from fastapi import FastAPI
from app.database import Base, engine
from app.auth import router as auth_router
from app.routers import consultations, patients, doctors, symptoms

app = FastAPI(title="CurelyTix Backend")

# -----------------------
# Database startup
# -----------------------
@app.on_event("startup")
def on_startup():
    try:
        Base.metadata.create_all(bind=engine)
        print("✅ Database connected")
    except Exception as e:
        print("❌ Database connection failed:", e)

# -----------------------
# Routers
# -----------------------
app.include_router(auth_router, prefix="/auth", tags=["auth"])
app.include_router(consultations.router, prefix="/consultations", tags=["consultations"])
app.include_router(patients.router, prefix="/patients", tags=["patients"])
app.include_router(doctors.router, prefix="/doctors", tags=["doctors"])
app.include_router(symptoms.router, prefix="/symptoms", tags=["symptoms"])
