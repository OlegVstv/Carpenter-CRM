import enum
from datetime import datetime, timezone
# pyrefly: ignore [missing-import]
from sqlalchemy import Column, Integer, String, Enum as SQLAlchemyEnum, DateTime, ForeignKey, Text, Date, Float
from sqlalchemy.orm import relationship
from database import Base

class LeadSource(str, enum.Enum):
    CALL = "звонок"
    WHATSAPP = "WhatsApp"
    INSTAGRAM = "Instagram"
    WEBSITE = "сайт"
    RECOMMENDATION = "рекомендация"
    REPEAT_CLIENT = "повторный клиент"
    ADVERTISING = "реклама"
    MANUAL = "вручную внесено"

class LeadStatus(str, enum.Enum):
    NEW = "новый запрос"
    CALCULATION = "просчет / КП"
    SENT = "КП отправлено"
    AGREEMENT = "согласование"
    REJECTION = "отказ"

class Lead(Base):
    __tablename__ = "leads"
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    client_name = Column(String, nullable=False)
    phone = Column(String, nullable=False)
    source = Column(SQLAlchemyEnum(LeadSource), nullable=False)
    status = Column(SQLAlchemyEnum(LeadStatus), nullable=False, default=LeadStatus.NEW)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

class ClientStatus(str, enum.Enum):
    NEW = "новый запрос"
    CALCULATION = "просчет / КП"
    SENT = "КП отправлено"
    AGREEMENT = "согласование"
    PREPAYMENT = "предоплата"
    IN_PRODUCTION = "передан в производство"
    PAID = "оплачен полностью"
    CLOSED = "закрыт"
    REJECTION = "отказ"
    ARCHIVE = "архив"

class Client(Base):
    __tablename__ = "clients"

    id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String, nullable=False)
    phone = Column(String, nullable=False)
    email = Column(String, nullable=True)
    address = Column(String, nullable=True)
    source = Column(SQLAlchemyEnum(LeadSource), nullable=False)
    status = Column(SQLAlchemyEnum(ClientStatus), nullable=False, default=ClientStatus.AGREEMENT)
    comment = Column(Text, nullable=True)
    lead_id = Column(Integer, ForeignKey("leads.id"), nullable=True, unique=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    orders = relationship("Order", back_populates="client", cascade="all, delete-orphan")

class OrderStatus(str, enum.Enum):
    ACCEPTED = "принят"
    AWAITING_PAYMENT = "ожидает оплаты"
    AGREED = "согласован"
    IN_PRODUCTION_QUEUE = "передан в производство"
    AWAITING_MATERIALS = "ожидает материалы"
    IN_PRODUCTION = "в производстве"
    READY = "готов"
    DELIVERING = "на доставке"
    HANDED_OVER = "сдан клиенту"
    CLOSED = "закрыт"
    SUSPENDED = "приостановлен"
    PROBLEM = "проблемный"

class Order(Base):
    __tablename__ = "orders"

    id = Column(Integer, primary_key=True, autoincrement=True)
    client_id = Column(Integer, ForeignKey("clients.id"), nullable=False)
    product_type = Column(String, nullable=False)
    technical_spec = Column(Text, nullable=True)
    price = Column(Float, nullable=False)
    paid_amount = Column(Float, nullable=False, default=0.0)
    status = Column(SQLAlchemyEnum(OrderStatus), nullable=False, default=OrderStatus.ACCEPTED)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    delivery_date = Column(Date, nullable=True)
    installation_date = Column(Date, nullable=True)

    client = relationship("Client", back_populates="orders")
    tasks = relationship("Task", back_populates="order", cascade="all, delete-orphan")
    supply_requests = relationship("SupplyRequest", back_populates="order", cascade="all, delete-orphan")
    payments = relationship("Payment", back_populates="order", cascade="all, delete-orphan")


    @property
    def client_name(self):
        return self.client.name if self.client else None

    @property
    def remaining_balance(self):
        return max(0.0, self.price - self.paid_amount)

    @property
    def payment_status(self):
        if self.paid_amount == 0:
            return "ожидает оплаты"
        elif self.paid_amount < self.price:
            return "предоплата"
        else:
            return "оплачен полностью"

class TaskPriority(str, enum.Enum):
    LOW = "низкий"
    MEDIUM = "средний"
    HIGH = "высокий"
    CRITICAL = "критический"

class TaskStatus(str, enum.Enum):
    TODO = "нужно сделать"
    IN_PROGRESS = "в процессе"
    DONE = "выполнено"
    CANCELLED = "отменено"

class Task(Base):
    __tablename__ = "tasks"

    id = Column(Integer, primary_key=True, autoincrement=True)
    title = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    due_date = Column(Date, nullable=True)
    priority = Column(SQLAlchemyEnum(TaskPriority), nullable=False)
    status = Column(SQLAlchemyEnum(TaskStatus), nullable=False, default=TaskStatus.TODO)
    assigned_to = Column(String, nullable=False, default="DIRECTOR")
    order_id = Column(Integer, ForeignKey("orders.id"), nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    order = relationship("Order", back_populates="tasks")

    @property
    def order_product_type(self):
        return self.order.product_type if self.order else None

class Supplier(Base):
    __tablename__ = "suppliers"

    id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String, nullable=False)
    contact_person = Column(String, nullable=True)
    phone = Column(String, nullable=True)
    email = Column(String, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

class Material(Base):
    __tablename__ = "materials"

    id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String, nullable=False)
    sku = Column(String, nullable=True)
    unit = Column(String, nullable=False) # шт, м², м.п., литр
    price = Column(Float, nullable=False, default=0.0)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    supply_requests = relationship("SupplyRequest", back_populates="material", cascade="all, delete-orphan")

class SupplyRequestStatus(str, enum.Enum):
    DRAFT = "черновик"
    APPROVED = "согласовано"
    ORDERED = "заказано"
    DELIVERED = "получено"
    CANCELLED = "отменено"

class SupplyRequest(Base):
    __tablename__ = "supply_requests"

    id = Column(Integer, primary_key=True, autoincrement=True)
    order_id = Column(Integer, ForeignKey("orders.id"), nullable=False)
    material_id = Column(Integer, ForeignKey("materials.id"), nullable=False)
    quantity = Column(Float, nullable=False)
    actual_price = Column(Float, nullable=False)
    status = Column(SQLAlchemyEnum(SupplyRequestStatus), nullable=False, default=SupplyRequestStatus.DRAFT)
    delivery_date = Column(Date, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    order = relationship("Order", back_populates="supply_requests")
    material = relationship("Material", back_populates="supply_requests")

    @property
    def material_name(self):
        return self.material.name if self.material else None

    @property
    def order_product_type(self):
        return self.order.product_type if self.order else None

    @property
    def client_name(self):
        return self.order.client.name if self.order and self.order.client else None


class Payment(Base):
    __tablename__ = "payments"

    id = Column(Integer, primary_key=True, autoincrement=True)
    order_id = Column(Integer, ForeignKey("orders.id"), nullable=False)
    amount = Column(Float, nullable=False)
    payment_date = Column(Date, nullable=False, default=lambda: datetime.now(timezone.utc).date())
    comment = Column(String, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    order = relationship("Order", back_populates="payments")


