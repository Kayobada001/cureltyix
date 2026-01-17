from pydantic import BaseModel, EmailStr
from typing import List, Optional
from datetime import date, datetime
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

class SymptomBase(BaseModel):
    name: str
    category: str
    description: Optional[str] = None

class SymptomCreate(SymptomBase):
    pass

class SymptomOut(SymptomBase):
    id: UUID

    class Config:
        from_attributes = True
        orm_mode = True

class ConsultationCreate(BaseModel):
    symptoms: List[str]
    description: str

class ConsultationOut(BaseModel):
    id: UUID
    patient_id: UUID
    doctor_id: Optional[UUID]
    symptoms: List[str]
    description: str
    status: str
    priority: str
    ai_recommendation: Optional[str]
    doctor_notes: Optional[str]
    suggested_specialty: Optional[str]
    follow_up_questions: Optional[List[str]]
    created_at: datetime
    updated_at: Optional[datetime]

    class Config:
        from_attributes = True

class AppointmentCreate(BaseModel):
    doctor_id: UUID
    date: date
    time: str
    type: str  # video or in-person
    location: Optional[str] = None
    notes: Optional[str] = None

class AppointmentOut(BaseModel):
    id: UUID
    patient_id: UUID
    doctor_id: UUID
    date: date
    time: str
    type: str
    location: Optional[str]
    status: str
    notes: Optional[str]
    created_at: datetime

    class Config:
        from_attributes = True

class NotificationCreate(BaseModel):
    user_id: UUID
    title: str
    message: str
    type: Optional[str] = "info"
    link: Optional[str] = None

class NotificationOut(BaseModel):
    id: UUID
    user_id: UUID
    title: str
    message: str
    type: str
    is_read: bool
    link: Optional[str]
    created_at: datetime

    class Config:
        from_attributes = True
