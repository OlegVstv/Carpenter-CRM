from pydantic import BaseModel, ConfigDict
from datetime import datetime, date
from models import LeadSource, LeadStatus, ClientStatus, OrderStatus, TaskPriority, TaskStatus

class LeadBase(BaseModel):
    client_name: str
    phone: str
    source: LeadSource
    status: LeadStatus = LeadStatus.NEW

class LeadCreate(LeadBase):
    pass

class LeadResponse(LeadBase):
    id: int
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)

# --- Клиенты (Срез №2) ---

class ClientBase(BaseModel):
    name: str
    phone: str
    email: str | None = None
    address: str | None = None
    source: LeadSource
    status: ClientStatus = ClientStatus.AGREEMENT
    comment: str | None = None

class ClientCreate(BaseModel):
    """Создание клиента из лида — достаточно передать lead_id и опциональные поля"""
    lead_id: int
    email: str | None = None
    address: str | None = None
    comment: str | None = None

class ClientCreateManual(ClientBase):
    """Создание клиента вручную (без лида)"""
    pass

class ClientResponse(ClientBase):
    id: int
    lead_id: int | None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)

# --- Заказы (Срез №3) ---

class OrderBase(BaseModel):
    product_type: str
    technical_spec: str | None = None
    price: float
    status: OrderStatus = OrderStatus.ACCEPTED
    delivery_date: date | None = None
    installation_date: date | None = None

class OrderCreate(OrderBase):
    client_id: int

class OrderStatusUpdate(BaseModel):
    status: OrderStatus

class OrderResponse(OrderBase):
    id: int
    client_id: int
    paid_amount: float
    created_at: datetime
    client_name: str | None = None  # Опционально для удобства отображения на UI

    model_config = ConfigDict(from_attributes=True)

# --- Задачи (Срез №4) ---

class TaskBase(BaseModel):
    title: str
    description: str | None = None
    due_date: date | None = None
    priority: TaskPriority
    status: TaskStatus = TaskStatus.TODO
    assigned_to: str = "DIRECTOR"
    order_id: int | None = None

class TaskCreate(TaskBase):
    pass

class TaskStatusUpdate(BaseModel):
    status: TaskStatus

class TaskResponse(TaskBase):
    id: int
    created_at: datetime
    order_product_type: str | None = None

    model_config = ConfigDict(from_attributes=True)

