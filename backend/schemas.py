from pydantic import BaseModel, ConfigDict
from datetime import datetime
from models import LeadSource, LeadStatus

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
