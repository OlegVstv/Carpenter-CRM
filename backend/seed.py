import os
from dotenv import load_dotenv
load_dotenv(os.path.join(os.path.dirname(__file__), ".env.local"))

from database import SessionLocal, engine
from models import Lead, LeadSource, LeadStatus, Base

def seed_leads():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        # Удаляем старые данные (опционально, для чистоты сидирования)
        db.query(Lead).delete()
        
        test_leads = [
            Lead(client_name="Иван Петров", phone="+7 (999) 111-22-33", source=LeadSource.WEBSITE, status=LeadStatus.NEW),
            Lead(client_name="Анна Смирнова", phone="+7 (999) 444-55-66", source=LeadSource.CALL, status=LeadStatus.CALCULATION),
            Lead(client_name="ИП Сидоров", phone="+7 (999) 777-88-99", source=LeadSource.WHATSAPP, status=LeadStatus.SENT),
            Lead(client_name="Михаил (Повторно)", phone="+7 (999) 000-11-22", source=LeadSource.REPEAT_CLIENT, status=LeadStatus.AGREEMENT)
        ]
        db.add_all(test_leads)
        db.commit()
        print("База данных успешно наполнена тестовыми лидами!")
    except Exception as e:
        db.rollback()
        print(f"Ошибка при сидировании: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    seed_leads()
