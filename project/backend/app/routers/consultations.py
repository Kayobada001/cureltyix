from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import Consultation, Patient
from app.schemas import ConsultationCreate, ConsultationOut
from app.ai_integration import generate_ai_recommendation
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

@router.post("/", response_model=ConsultationOut)
def create_consultation(data: ConsultationCreate, db: Session = Depends(get_db), current_user: dict = Depends(get_current_user)):
    patient = db.query(Patient).filter(Patient.user_id == current_user["id"]).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")
    ai_rec = generate_ai_recommendation(data.symptoms)
    consultation = Consultation(
        patient_id=patient.id,
        symptoms=data.symptoms,
        description=data.description,
        ai_recommendation=ai_rec
    )
    db.add(consultation)
    db.commit()
    db.refresh(consultation)
    return consultation

@router.get("/", response_model=list[ConsultationOut])
def get_consultations(db: Session = Depends(get_db), current_user: dict = Depends(get_current_user)):
    patient = db.query(Patient).filter(Patient.user_id == current_user["id"]).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")
    return db.query(Consultation).filter(Consultation.patient_id == patient.id).all()
