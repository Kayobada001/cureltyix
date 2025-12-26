from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import Patient, User
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
def get_patients(db: Session = Depends(get_db), current_user: dict = Depends(get_current_user)):
    # Admins can view all patients
    if current_user["role"] == "admin":
        return db.query(Patient).all()
    # Doctors can view all patients
    if current_user["role"] == "doctor":
        return db.query(Patient).all()
    # Patients can only view themselves
    patient = db.query(Patient).filter(Patient.user_id == current_user["id"]).first()
    if patient:
        return [patient]
    raise HTTPException(status_code=403, detail="Not authorized")


@router.get("/me", response_model=PatientCreate)
def get_my_profile(db: Session = Depends(get_db), current_user: dict = Depends(get_current_user)):
    patient = db.query(Patient).filter(Patient.user_id == current_user["id"]).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")
    return patient


@router.put("/me")
def update_my_profile(data: PatientCreate, db: Session = Depends(get_db), current_user: dict = Depends(get_current_user)):
    patient = db.query(Patient).filter(Patient.user_id == current_user["id"]).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")
    for key, value in data.dict(exclude_unset=True).items():
        setattr(patient, key, value)
    db.commit()
    db.refresh(patient)
    return patient
