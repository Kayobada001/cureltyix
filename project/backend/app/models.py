from sqlalchemy import Column, String, Integer, Boolean, Date, ForeignKey, Text, ARRAY
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func
from .database import Base
import uuid

class User(Base):
    __tablename__ = "users"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    email = Column(String, unique=True, nullable=False)
    full_name = Column(String, nullable=False)
    role = Column(String, nullable=False)
    password_hash = Column(String, nullable=False)
    avatar_url = Column(String)
    created_at = Column(Text, default=func.now())
    updated_at = Column(Text, default=func.now())

class Patient(Base):
    __tablename__ = "patients"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), unique=True)
    date_of_birth = Column(Date)
    gender = Column(String)
    phone = Column(String)
    address = Column(String)

class Doctor(Base):
    __tablename__ = "doctors"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), unique=True)
    specialization = Column(String)
    license_number = Column(String)
    years_of_experience = Column(Integer, default=0)
    bio = Column(Text)
    is_verified = Column(Boolean, default=False)

class Symptom(Base):
    __tablename__ = "symptoms"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String, unique=True)
    category = Column(String)
    description = Column(Text)

class Consultation(Base):
    __tablename__ = "consultations"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    patient_id = Column(UUID(as_uuid=True), ForeignKey("patients.id"))
    doctor_id = Column(UUID(as_uuid=True), ForeignKey("doctors.id"), nullable=True)
    symptoms = Column(ARRAY(String))
    description = Column(Text)
    status = Column(String, default="pending")
    priority = Column(String, default="medium")
    ai_recommendation = Column(Text, default="")
    doctor_notes = Column(Text, default="")
