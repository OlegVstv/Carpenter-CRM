import os
from dotenv import load_dotenv
load_dotenv(os.path.join(os.path.dirname(__file__), ".env.local"))

from database import engine
from models import Base

# Импортируем функции сидирования
from seed import seed_leads
from seed_clients import seed_clients
from seed_orders import seed_orders
from seed_tasks import seed_tasks
from seed_supply import seed_supply

def seed_all():
    print("=== Сброс и инициализация базы данных ===")
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)
    print("[OK] Все таблицы успешно пересозданы.")

    print("\n=== [1] Сидирование Лидов ===")
    seed_leads()

    print("\n=== [2] Сидирование Клиентов ===")
    seed_clients()

    print("\n=== [3] Сидирование Заказов ===")
    seed_orders()

    print("\n=== [4] Сидирование Задач ===")
    seed_tasks()

    print("\n=== [5] Сидирование Снабжения ===")
    seed_supply()

    print("\n=== ВСЕ СИДЫ УСПЕШНО ВЫПОЛНЕНЫ! ===")

if __name__ == "__main__":
    seed_all()
