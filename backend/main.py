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

app = FastAPI(title="Carpenter CRM API", version="0.2.0")

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

# --- Клиенты (Срез №2) ---

@app.post("/api/clients", response_model=schemas.ClientResponse, status_code=201)
def create_client(client_data: schemas.ClientCreate, db: Session = Depends(get_db)):
    current_role = os.getenv("CURRENT_ROLE", "UNKNOWN")
    if current_role != "DIRECTOR":
        raise HTTPException(status_code=403, detail="Forbidden")
    # Находим лид
    db_lead = db.query(models.Lead).filter(models.Lead.id == client_data.lead_id).first()
    if not db_lead:
        raise HTTPException(status_code=404, detail="Лид не найден")
    # Проверяем, что лид ещё не конвертирован
    existing_client = db.query(models.Client).filter(models.Client.lead_id == client_data.lead_id).first()
    if existing_client:
        raise HTTPException(status_code=409, detail="Этот лид уже конвертирован в клиента")
    # Создаём клиента из данных лида
    db_client = models.Client(
        name=db_lead.client_name,
        phone=db_lead.phone,
        email=client_data.email,
        address=client_data.address,
        source=db_lead.source,
        status=models.ClientStatus.AGREEMENT,
        comment=client_data.comment,
        lead_id=db_lead.id
    )
    db.add(db_client)
    # Обновляем статус лида
    if db_lead.status in (models.LeadStatus.NEW, models.LeadStatus.CALCULATION, models.LeadStatus.SENT):
        db_lead.status = models.LeadStatus.AGREEMENT
    db.commit()
    db.refresh(db_client)
    return db_client

@app.get("/api/clients", response_model=List[schemas.ClientResponse])
def get_clients(db: Session = Depends(get_db)):
    current_role = os.getenv("CURRENT_ROLE", "UNKNOWN")
    if current_role != "DIRECTOR":
        raise HTTPException(status_code=403, detail="Forbidden")
    return db.query(models.Client).order_by(models.Client.id.desc()).all()

@app.delete("/api/clients/{client_id}")
def delete_client(client_id: int, db: Session = Depends(get_db)):
    current_role = os.getenv("CURRENT_ROLE", "UNKNOWN")
    if current_role != "DIRECTOR":
        raise HTTPException(status_code=403, detail="Forbidden")
    db_client = db.query(models.Client).filter(models.Client.id == client_id).first()
    if not db_client:
        raise HTTPException(status_code=404, detail="Клиент не найден")
    db.delete(db_client)
    db.commit()
    return {"status": "ok"}

# --- Заказы (Срез №3) ---

@app.post("/api/orders", response_model=schemas.OrderResponse, status_code=201)
def create_order(order_data: schemas.OrderCreate, db: Session = Depends(get_db)):
    # Проверяем, существует ли клиент
    db_client = db.query(models.Client).filter(models.Client.id == order_data.client_id).first()
    if not db_client:
        raise HTTPException(status_code=404, detail="Клиент не найден")
    
    db_order = models.Order(**order_data.model_dump())
    db.add(db_order)
    db.commit()
    db.refresh(db_order)
    return db_order

@app.get("/api/orders", response_model=List[schemas.OrderResponse])
def get_orders(db: Session = Depends(get_db)):
    current_role = os.getenv("CURRENT_ROLE", "UNKNOWN")
    if current_role != "DIRECTOR":
        raise HTTPException(status_code=403, detail="Forbidden")
    return db.query(models.Order).order_by(models.Order.id.desc()).all()

@app.patch("/api/orders/{order_id}/status", response_model=schemas.OrderResponse)
def update_order_status(order_id: int, status_data: schemas.OrderStatusUpdate, db: Session = Depends(get_db)):
    db_order = db.query(models.Order).filter(models.Order.id == order_id).first()
    if not db_order:
        raise HTTPException(status_code=404, detail="Заказ не найден")
    
    db_order.status = status_data.status
    db.commit()
    db.refresh(db_order)
    return db_order

@app.delete("/api/orders/{order_id}")
def delete_order(order_id: int, db: Session = Depends(get_db)):
    current_role = os.getenv("CURRENT_ROLE", "UNKNOWN")
    if current_role != "DIRECTOR":
        raise HTTPException(status_code=403, detail="Forbidden")
    
    db_order = db.query(models.Order).filter(models.Order.id == order_id).first()
    if not db_order:
        raise HTTPException(status_code=404, detail="Заказ не найден")
    
    db.delete(db_order)
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
# --- Задачи (Срез №4) ---

@app.post("/api/tasks", response_model=schemas.TaskResponse, status_code=201)
def create_task(task_data: schemas.TaskCreate, db: Session = Depends(get_db)):
    if task_data.order_id is not None:
        db_order = db.query(models.Order).filter(models.Order.id == task_data.order_id).first()
        if not db_order:
            raise HTTPException(status_code=404, detail="Заказ не найден")
    
    db_task = models.Task(**task_data.model_dump())
    db.add(db_task)
    db.commit()
    db.refresh(db_task)
    return db_task

@app.get("/api/tasks", response_model=List[schemas.TaskResponse])
def get_tasks(
    order_id: int | None = None,
    status: models.TaskStatus | None = None,
    db: Session = Depends(get_db)
):
    current_role = os.getenv("CURRENT_ROLE", "UNKNOWN")
    if current_role != "DIRECTOR":
        raise HTTPException(status_code=403, detail="Forbidden")
    
    query = db.query(models.Task)
    if order_id is not None:
        query = query.filter(models.Task.order_id == order_id)
    if status is not None:
        query = query.filter(models.Task.status == status)
    
    return query.order_by(models.Task.id.desc()).all()

@app.patch("/api/tasks/{task_id}/status", response_model=schemas.TaskResponse)
def update_task_status(task_id: int, status_data: schemas.TaskStatusUpdate, db: Session = Depends(get_db)):
    db_task = db.query(models.Task).filter(models.Task.id == task_id).first()
    if not db_task:
        raise HTTPException(status_code=404, detail="Задача не найдена")
    
    db_task.status = status_data.status
    db.commit()
    db.refresh(db_task)
    return db_task

@app.delete("/api/tasks/{task_id}")
def delete_task(task_id: int, db: Session = Depends(get_db)):
    current_role = os.getenv("CURRENT_ROLE", "UNKNOWN")
    if current_role != "DIRECTOR":
        raise HTTPException(status_code=403, detail="Forbidden")
    
    db_task = db.query(models.Task).filter(models.Task.id == task_id).first()
    if not db_task:
        raise HTTPException(status_code=404, detail="Задача не найдена")
    
    db.delete(db_task)
    db.commit()
    return {"status": "ok"}

# --- Снабжение и Материалы (Срез №5) ---

@app.post("/api/suppliers", response_model=schemas.SupplierResponse, status_code=201)
def create_supplier(supplier_data: schemas.SupplierCreate, db: Session = Depends(get_db)):
    db_supplier = models.Supplier(**supplier_data.model_dump())
    db.add(db_supplier)
    db.commit()
    db.refresh(db_supplier)
    return db_supplier

@app.get("/api/suppliers", response_model=List[schemas.SupplierResponse])
def get_suppliers(db: Session = Depends(get_db)):
    return db.query(models.Supplier).order_by(models.Supplier.id.desc()).all()

@app.post("/api/materials", response_model=schemas.MaterialResponse, status_code=201)
def create_material(material_data: schemas.MaterialCreate, db: Session = Depends(get_db)):
    db_material = models.Material(**material_data.model_dump())
    db.add(db_material)
    db.commit()
    db.refresh(db_material)
    return db_material

@app.get("/api/materials", response_model=List[schemas.MaterialResponse])
def get_materials(db: Session = Depends(get_db)):
    return db.query(models.Material).order_by(models.Material.id.desc()).all()

@app.post("/api/supply-requests", response_model=schemas.SupplyRequestResponse, status_code=201)
def create_supply_request(req_data: schemas.SupplyRequestCreate, db: Session = Depends(get_db)):
    db_order = db.query(models.Order).filter(models.Order.id == req_data.order_id).first()
    if not db_order:
        raise HTTPException(status_code=404, detail="Заказ не найден")
    
    db_material = db.query(models.Material).filter(models.Material.id == req_data.material_id).first()
    if not db_material:
        raise HTTPException(status_code=404, detail="Материал не найден")
    
    db_req = models.SupplyRequest(**req_data.model_dump())
    db.add(db_req)
    db.commit()
    db.refresh(db_req)
    return db_req

@app.get("/api/supply-requests", response_model=List[schemas.SupplyRequestResponse])
def get_supply_requests(db: Session = Depends(get_db)):
    current_role = os.getenv("CURRENT_ROLE", "UNKNOWN")
    if current_role != "DIRECTOR":
        raise HTTPException(status_code=403, detail="Forbidden")
    return db.query(models.SupplyRequest).order_by(models.SupplyRequest.id.desc()).all()

@app.patch("/api/supply-requests/{req_id}/status", response_model=schemas.SupplyRequestResponse)
def update_supply_request_status(req_id: int, status_data: schemas.SupplyRequestStatusUpdate, db: Session = Depends(get_db)):
    db_req = db.query(models.SupplyRequest).filter(models.SupplyRequest.id == req_id).first()
    if not db_req:
        raise HTTPException(status_code=404, detail="Заявка не найдена")
    
    db_req.status = status_data.status
    if status_data.delivery_date is not None:
        db_req.delivery_date = status_data.delivery_date
    
    db.commit()
    db.refresh(db_req)
    return db_req

@app.delete("/api/supply-requests/{req_id}")
def delete_supply_request(req_id: int, db: Session = Depends(get_db)):
    current_role = os.getenv("CURRENT_ROLE", "UNKNOWN")
    if current_role != "DIRECTOR":
        raise HTTPException(status_code=403, detail="Forbidden")
    
    db_req = db.query(models.SupplyRequest).filter(models.SupplyRequest.id == req_id).first()
    if not db_req:
        raise HTTPException(status_code=404, detail="Заявка не найдена")
    
    db.delete(db_req)
    db.commit()
    return {"status": "ok"}

# Отдаем UI по корневому URL (без Next.js, просто статика)
@app.get("/")
def serve_frontend():
    # Путь относителен запуска из папки backend/
    html_path = os.path.join(os.path.dirname(__file__), "..", "frontend", "index.html")
    return FileResponse(html_path, headers={"Cache-Control": "no-store, no-cache, must-revalidate, max-age=0"})
