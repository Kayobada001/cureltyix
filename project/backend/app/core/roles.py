from enum import Enum

class UserRole(str, Enum):
    admin = "admin"
    doctor = "doctor"
    patient = "patient"
