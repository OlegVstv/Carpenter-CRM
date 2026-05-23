import os
import sys
sys.path.insert(0, os.path.dirname(__file__))
import platform
from importlib.metadata import distributions
from fastapi import FastAPI, Depends, HTTPException
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from sqlalchemy import text
from dotenv import load_dotenv
from typing import List
from database import get_db, engine
import models
import schemas

# Загружаем переменные окружения
load_dotenv(os.path.join(os.path.dirname(__file__), ".env.local"))

models.Base.metadata.create_all(bind=engine)

app = FastAPI(title="Carpenter CRM API", version="0.1.0")

@app.post("/api/leads", response_model=schemas.LeadResponse)
def create_lead(lead: schemas.LeadCreate, db: Session = Depends(get_db)):
    db_lead = models.Lead(**lead.model_dump())
    db.add(db_lead)
    db.commit()
    db.refresh(db_lead)
    return db_lead

@app.get("/api/leads", response_model=List[schemas.LeadResponse])
def get_leads(db: Session = Depends(get_db)):
    current_role = os.getenv("CURRENT_ROLE", "UNKNOWN")
    if current_role != "DIRECTOR":
        raise HTTPException(status_code=403, detail="Forbidden")
    return db.query(models.Lead).order_by(models.Lead.id.desc()).all()

@app.delete("/api/leads/{lead_id}")
def delete_lead(lead_id: int, db: Session = Depends(get_db)):
    current_role = os.getenv("CURRENT_ROLE", "UNKNOWN")
    if current_role != "DIRECTOR":
        raise HTTPException(status_code=403, detail="Forbidden")
    db_lead = db.query(models.Lead).filter(models.Lead.id == lead_id).first()
    if not db_lead:
        raise HTTPException(status_code=404, detail="Lead not found")
    db.delete(db_lead)
    db.commit()
    return {"status": "ok"}

@app.get("/api/health")
def health_check(db: Session = Depends(get_db)):
    db_status = "error"
    db_details = {}
    try:
        # Сбор информации о базе данных
        version_req = db.execute(text("SELECT version();")).scalar()
        vector_req = db.execute(text("SELECT extversion FROM pg_extension WHERE extname = 'vector';")).scalar()
        db_name = db.execute(text("SELECT current_database();")).scalar()
        
        db_status = "connected"
        db_details = {
            "postgres_version": version_req.split(" on ")[0] if version_req else "unknown",
            "pgvector_version": vector_req if vector_req else "не найдено",
            "db_name": db_name
        }
    except Exception as e:
        db_status = str(e)

    # Получение версий ключевых установленных библиотек
    target_packages = ["fastapi", "sqlalchemy", "psycopg2-binary", "python-dotenv", "pydantic", "uvicorn", "google-cloud-aiplatform"]
    packages_info = {}
    for dist in distributions():
        name = dist.metadata["Name"].lower()
        if name in target_packages or name == "psycopg2":
            packages_info[dist.metadata["Name"]] = dist.version

    return {
        "status": "ok",
        "database": db_status,
        "database_details": db_details,
        "current_role": os.getenv("CURRENT_ROLE", "UNKNOWN"),
        "environment": {
            "python_version": sys.version.split(" ")[0],
            "os": f"{platform.system()} {platform.release()}"
        },
        "libraries": packages_info
    }

# Отдаем UI по корневому URL (без Next.js, просто статика)
@app.get("/")
def serve_frontend():
    # Путь относителен запуска из папки backend/
    html_path = os.path.join(os.path.dirname(__file__), "..", "frontend", "index.html")
    return FileResponse(html_path)
