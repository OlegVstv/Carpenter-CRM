import enum
from datetime import datetime, timezone
# pyrefly: ignore [missing-import]
from sqlalchemy import Column, Integer, String, Enum as SQLAlchemyEnum, DateTime
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
