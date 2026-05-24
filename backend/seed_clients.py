import os
from dotenv import load_dotenv
load_dotenv(os.path.join(os.path.dirname(__file__), ".env.local"))

from database import SessionLocal, engine
from models import Lead, Client, LeadSource, ClientStatus, Base

def seed_clients():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        # Удаляем старые данные клиентов (для чистоты сидирования)
        db.query(Client).delete()
        db.commit()

        # Получаем существующие лиды для конвертации (по имени, т.к. ID могут отличаться)
        lead_anna = db.query(Lead).filter(Lead.client_name == "Анна Смирнова").first()
        lead_sidorov = db.query(Lead).filter(Lead.client_name == "ИП Сидоров").first()

        test_clients = []

        # Клиент 1: Конвертация лида Анна Смирнова
        if lead_anna:
            test_clients.append(Client(
                name=lead_anna.client_name,
                phone=lead_anna.phone,
                email="anna.smirnova@mail.ru",
                source=lead_anna.source,
                status=ClientStatus.AGREEMENT,
                comment="Заинтересована в кухне из массива дуба",
                lead_id=lead_anna.id
            ))
            print(f"  -> Конвертирован лид #{lead_anna.id} ({lead_anna.client_name})")
        else:
            print("  [!] Лид 'Анна Смирнова' не найден, пропускаем")

        # Клиент 2: Конвертация лида ИП Сидоров
        if lead_sidorov:
            test_clients.append(Client(
                name=lead_sidorov.client_name,
                phone=lead_sidorov.phone,
                address="г. Москва, ул. Столярная, 15",
                source=lead_sidorov.source,
                status=ClientStatus.PREPAYMENT,
                comment="Предоплата 50% внесена. Заказ на лестницу.",
                lead_id=lead_sidorov.id
            ))
            print(f"  -> Конвертирован лид #{lead_sidorov.id} ({lead_sidorov.client_name})")
        else:
            print("  [!] Лид 'ИП Сидоров' не найден, пропускаем")

        # Клиент 3: Ручной ввод (без лида)
        test_clients.append(Client(
            name='ООО "Дубовый мир"',
            phone="+7 (495) 123-45-67",
            email="info@duboviy-mir.ru",
            address="г. Москва, ул. Мебельная, 42",
            source=LeadSource.MANUAL,
            status=ClientStatus.CALCULATION,
            comment="Корпоративный заказ на офисную мебель",
            lead_id=None
        ))
        print('  -> Добавлен ручной клиент: ООО "Дубовый мир"')

        db.add_all(test_clients)
        db.commit()
        print(f"\n[OK] База данных успешно наполнена клиентами! Всего: {len(test_clients)} записей.")
    except Exception as e:
        db.rollback()
        print(f"[ERROR] Ошибка при сидировании клиентов: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    seed_clients()
