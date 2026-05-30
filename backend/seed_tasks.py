import os
from datetime import date
from dotenv import load_dotenv
load_dotenv(os.path.join(os.path.dirname(__file__), ".env.local"))

from database import SessionLocal, engine
from models import Order, Task, TaskPriority, TaskStatus, Base

def seed_tasks():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        # Очищаем таблицу задач для чистоты сидирования
        db.query(Task).delete()
        db.commit()

        # Находим существующие заказы для привязки
        order_kitchen = db.query(Order).filter(Order.product_type == "Кухня из массива дуба").first()
        order_stairs = db.query(Order).filter(Order.product_type == "Лестница деревянная на металлокаркасе").first()

        test_tasks = []

        # 1. Задача, привязанная к заказу кухни
        if order_kitchen:
            test_tasks.append(Task(
                title="Закупить дуб для Анны",
                description="Заказать сухой дуб 50мм на складе 'Лес-Маркет' для изготовления фасадов кухни.",
                due_date=date(2026, 6, 15),
                priority=TaskPriority.HIGH,
                status=TaskStatus.TODO,
                assigned_to="DIRECTOR",
                order_id=order_kitchen.id
            ))
            print(f"  -> Создана задача для заказа '{order_kitchen.product_type}'")
        else:
            print("  [!] Заказ 'Кухня из массива дуба' не найден, создаем общую задачу")
            test_tasks.append(Task(
                title="Закупить дуб для Анны (общая)",
                description="Заказать сухой дуб 50мм.",
                due_date=date(2026, 6, 15),
                priority=TaskPriority.HIGH,
                status=TaskStatus.TODO,
                assigned_to="DIRECTOR"
            ))

        # 2. Задача, привязанная к заказу лестницы
        if order_stairs:
            test_tasks.append(Task(
                title="Выезд на замер к Сидорову",
                description="Сделать финальный замер проема под лестницу, согласовать высоты ступеней.",
                due_date=date(2026, 6, 5),
                priority=TaskPriority.CRITICAL,
                status=TaskStatus.IN_PROGRESS,
                assigned_to="DIRECTOR",
                order_id=order_stairs.id
            ))
            print(f"  -> Создана задача для заказа '{order_stairs.product_type}'")
        else:
            print("  [!] Заказ 'Лестница деревянная на металлокаркасе' не найден, создаем общую задачу")
            test_tasks.append(Task(
                title="Выезд на замер к Сидорову (общая)",
                description="Сделать замер проема под лестницу.",
                due_date=date(2026, 6, 5),
                priority=TaskPriority.CRITICAL,
                status=TaskStatus.IN_PROGRESS,
                assigned_to="DIRECTOR"
            ))

        # 3. Общая задача без привязки к конкретному заказу (Чертежи)
        test_tasks.append(Task(
            title="Подготовить чертежи для нового стола",
            description="Разработать 3D модель и сборочный чертеж стола из слэба карагача.",
            due_date=date(2026, 5, 29),
            priority=TaskPriority.MEDIUM,
            status=TaskStatus.TODO,
            assigned_to="DIRECTOR"
        ))

        # 4. Общая выполненная задача
        test_tasks.append(Task(
            title="Сделать уборку в мастерской",
            description="Провести генеральную уборку, очистить стружкоотсосы.",
            due_date=date(2026, 5, 27),
            priority=TaskPriority.LOW,
            status=TaskStatus.DONE,
            assigned_to="DIRECTOR"
        ))

        db.add_all(test_tasks)
        db.commit()
        print(f"\n[OK] База данных успешно наполнена задачами! Всего: {len(test_tasks)} записей.")

    except Exception as e:
        db.rollback()
        print(f"[ERROR] Ошибка при сидировании задач: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    seed_tasks()
