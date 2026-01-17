from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import Appointment, Patient, Doctor, User
from app.schemas import AppointmentCreate, AppointmentOut
from fastapi.security import OAuth2PasswordBearer
from jose import jwt
import os
from dotenv import load_dotenv
from typing import List

load_dotenv()
SECRET_KEY = os.getenv("SECRET_KEY")
ALGORITHM = os.getenv("ALGORITHM", "HS256")

router = APIRouter()
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login")


def get_current_user(token: str = Depends(oauth2_scheme)):
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return {"id": payload.get("sub"), "role": payload.get("role")}
    except:
        raise HTTPException(status_code=401, detail="Invalid token")


@router.post("/", response_model=AppointmentOut)
def create_appointment(
    data: AppointmentCreate,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Create a new appointment"""
    patient = db.query(Patient).filter(Patient.user_id == current_user["id"]).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")
    
    appointment = Appointment(
        patient_id=patient.id,
        doctor_id=data.doctor_id,
        date=data.date,
        time=data.time,
        type=data.type,
        location=data.location,
        status="scheduled"
    )
    db.add(appointment)
    db.commit()
    db.refresh(appointment)
    return appointment


@router.get("/", response_model=List[AppointmentOut])
def get_appointments(
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Get all appointments for current user"""
    if current_user["role"] == "patient":
        patient = db.query(Patient).filter(Patient.user_id == current_user["id"]).first()
        if not patient:
            raise HTTPException(status_code=404, detail="Patient not found")
        appointments = db.query(Appointment).filter(
            Appointment.patient_id == patient.id
        ).all()
    elif current_user["role"] == "doctor":
        doctor = db.query(Doctor).filter(Doctor.user_id == current_user["id"]).first()
        if not doctor:
            raise HTTPException(status_code=404, detail="Doctor not found")
        appointments = db.query(Appointment).filter(
            Appointment.doctor_id == doctor.id
        ).all()
    elif current_user["role"] == "admin":
        appointments = db.query(Appointment).all()
    else:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    return appointments


@router.get("/upcoming", response_model=List[AppointmentOut])
def get_upcoming_appointments(
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Get upcoming appointments for current user"""
    from datetime import datetime
    
    patient = db.query(Patient).filter(Patient.user_id == current_user["id"]).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")
    
    appointments = db.query(Appointment).filter(
        Appointment.patient_id == patient.id,
        Appointment.date >= datetime.now().date(),
        Appointment.status == "scheduled"
    ).order_by(Appointment.date, Appointment.time).limit(5).all()
    
    return appointments


@router.get("/{appointment_id}", response_model=AppointmentOut)
def get_appointment(
    appointment_id: str,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Get specific appointment"""
    appointment = db.query(Appointment).filter(Appointment.id == appointment_id).first()
    if not appointment:
        raise HTTPException(status_code=404, detail="Appointment not found")
    
    # Verify user has access
    if current_user["role"] == "patient":
        patient = db.query(Patient).filter(Patient.user_id == current_user["id"]).first()
        if not patient or appointment.patient_id != patient.id:
            raise HTTPException(status_code=403, detail="Not authorized")
    
    return appointment


@router.put("/{appointment_id}", response_model=AppointmentOut)
def update_appointment(
    appointment_id: str,
    data: AppointmentCreate,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Update appointment"""
    appointment = db.query(Appointment).filter(Appointment.id == appointment_id).first()
    if not appointment:
        raise HTTPException(status_code=404, detail="Appointment not found")
    
    for key, value in data.dict(exclude_unset=True).items():
        setattr(appointment, key, value)
    
    db.commit()
    db.refresh(appointment)
    return appointment


@router.delete("/{appointment_id}")
def cancel_appointment(
    appointment_id: str,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Cancel appointment"""
    appointment = db.query(Appointment).filter(Appointment.id == appointment_id).first()
    if not appointment:
        raise HTTPException(status_code=404, detail="Appointment not found")
    
    appointment.status = "cancelled"
    db.commit()
    return {"message": "Appointment cancelled successfully"}