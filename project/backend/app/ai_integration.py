from typing import List

def generate_ai_recommendation(symptoms: List[str]) -> str:
    if "Chest Pain" in symptoms or "Shortness of Breath" in symptoms:
        return "Seek immediate medical attention. These symptoms may indicate a serious condition."
    if "Fever" in symptoms and len(symptoms) > 2:
        return "Recommended to consult with a general practitioner within 24 hours."
    return "Monitor symptoms. If they persist or worsen, consult with a healthcare provider."
