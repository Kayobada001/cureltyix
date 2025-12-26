from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import Doctor
from app.schemas import PatientCreate
from fastapi.security import OAuth2PasswordBearer
from jose import jwt
import os
from dotenv import load_dotenv

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


@router.get("/", response_model=list[PatientCreate])
def get_doctors(db: Session = Depends(get_db), current_user: dict = Depends(get_current_user)):
    # Admins can view all doctors
    if current_user["role"] == "admin":
        return db.query(Doctor).all()
    # Patients can only view verified doctors
    if current_user["role"] == "patient":
        return db.query(Doctor).filter(Doctor.is_verified == True).all()
    # Doctors can view themselves
    if current_user["role"] == "doctor":
        doctor = db.query(Doctor).filter(Doctor.user_id == current_user["id"]).first()
        return [doctor] if doctor else []
    raise HTTPException(status_code=403, detail="Not authorized")


@router.get("/me")
def get_my_profile(db: Session = Depends(get_db), current_user: dict = Depends(get_current_user)):
    doctor = db.query(Doctor).filter(Doctor.user_id == current_user["id"]).first()
    if not doctor:
        raise HTTPException(status_code=404, detail="Doctor not found")
    return doctor


@router.put("/me")
def update_my_profile(data: PatientCreate, db: Session = Depends(get_db), current_user: dict = Depends(get_current_user)):
    doctor = db.query(Doctor).filter(Doctor.user_id == current_user["id"]).first()
    if not doctor:
        raise HTTPException(status_code=404, detail="Doctor not found")
    for key, value in data.dict(exclude_unset=True).items():
        setattr(doctor, key, value)
    db.commit()
    db.refresh(doctor)
    return doctor
