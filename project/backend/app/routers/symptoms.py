from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import Symptom
from app.schemas import SymptomCreate, SymptomOut
from app.auth import get_current_user

router = APIRouter(prefix="/symptoms", tags=["Symptoms"])

@router.post("/", response_model=SymptomOut)
def create_symptom(
    data: SymptomCreate,
    db: Session = Depends(get_db),
    user=Depends(get_current_user),
):
    symptom = Symptom(**data.dict())
    db.add(symptom)
    db.commit()
    db.refresh(symptom)
    return symptom

@router.get("/", response_model=list[SymptomOut])
def list_symptoms(
    db: Session = Depends(get_db),
    user=Depends(get_current_user),
):
    return db.query(Symptom).all()
