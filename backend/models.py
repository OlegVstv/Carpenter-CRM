import enum
from datetime import datetime, timezone
# pyrefly: ignore [missing-import]
from sqlalchemy import Column, Integer, String, Enum as SQLAlchemyEnum, DateTime, ForeignKey, Text
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
