from pydantic import BaseModel, ConfigDict
from datetime import datetime
from models import LeadSource, LeadStatus, ClientStatus

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
