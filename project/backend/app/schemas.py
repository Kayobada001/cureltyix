from pydantic import BaseModel, EmailStr
from typing import List, Optional
from datetime import date
from uuid import UUID

class UserCreate(BaseModel):
    email: EmailStr
    full_name: str
    password: str
    role: str

class UserOut(BaseModel):
    id: UUID
    email: EmailStr
    full_name: str
    role: str

    class Config:
        from_attributes = True

class Token(BaseModel):
    access_token: str
    token_type: str

class PatientCreate(BaseModel):
    date_of_birth: Optional[date]
    gender: Optional[str]
    phone: Optional[str]
    address: Optional[str]

class SymptomOut(BaseModel):
    id: str
    name: str
    category: str
    description: Optional[str]

    class Config:
        orm_mode = True

class ConsultationCreate(BaseModel):
    symptoms: List[str]
    description: str

class ConsultationOut(BaseModel):
    id: str
    patient_id: str
    doctor_id: Optional[str]
    symptoms: List[str]
    description: str
    status: str
    priority: str
    ai_recommendation: Optional[str]
    doctor_notes: Optional[str]

class SymptomBase(BaseModel):
    name: str
    description: Optional[str] = None


class SymptomCreate(SymptomBase):
    pass


class SymptomOut(SymptomBase):
    id: int

    class Config:
        from_attributes = True

