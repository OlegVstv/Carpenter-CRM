import os
from datetime import date
from dotenv import load_dotenv
load_dotenv(os.path.join(os.path.dirname(__file__), ".env.local"))

from database import SessionLocal, engine
from models import Client, Order, OrderStatus, Base

def seed_orders():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        # Удаляем старые данные заказов (для чистоты сидирования)
        db.query(Order).delete()
        db.commit()

        # Получаем существующих клиентов
        client_anna = db.query(Client).filter(Client.name == "Анна Смирнова").first()
        client_sidorov = db.query(Client).filter(Client.name == "ИП Сидоров").first()
        client_dub = db.query(Client).filter(Client.name == 'ООО "Дубовый мир"').first()

        test_orders = []

        if client_anna:
            test_orders.append(Order(
                client_id=client_anna.id,
                product_type="Кухня из массива дуба",
                technical_spec="Кухня угловая, фасады дуб тонированный, столешница искусственный камень. Встроенная техника.",
                price=450000.0,
                paid_amount=0.0,
                status=OrderStatus.AWAITING_PAYMENT,
                delivery_date=date(2026, 7, 15),
                installation_date=date(2026, 7, 18)
            ))
            print(f"  -> Создан заказ для {client_anna.name}")
        else:
            print("  [!] Клиент 'Анна Смирнова' не найден, пропускаем заказ")

        if client_sidorov:
            test_orders.append(Order(
                client_id=client_sidorov.id,
                product_type="Лестница деревянная на металлокаркасе",
                technical_spec="Лестница с забежными ступенями, дубовые ступени, ограждение из кованого металла.",
                price=280000.0,
                paid_amount=140000.0,
                status=OrderStatus.IN_PRODUCTION,
                delivery_date=date(2026, 6, 20),
                installation_date=date(2026, 6, 22)
            ))
            print(f"  -> Создан заказ для {client_sidorov.name}")
        else:
            print("  [!] Клиент 'ИП Сидоров' не найден, пропускаем заказ")

        if client_dub:
            test_orders.append(Order(
                client_id=client_dub.id,
                product_type="Офисный стол из слэба",
                technical_spec="Стол руководителя из слэба карагача с заливкой эпоксидной смолой (река). Подстолье черное.",
                price=150000.0,
                paid_amount=150000.0,
                status=OrderStatus.READY,
                delivery_date=date(2026, 5, 30),
                installation_date=date(2026, 5, 31)
            ))
            print(f"  -> Создан заказ для {client_dub.name}")
        else:
            print("  [!] Клиент 'ООО \"Дубовый мир\"' не найден, пропускаем заказ")

        if test_orders:
            db.add_all(test_orders)
            db.commit()
            print(f"\n[OK] База данных успешно наполнена заказами! Всего: {len(test_orders)} записей.")
        else:
            print("\n[!] Не создано ни одного заказа, так как клиенты не найдены в БД. Пожалуйста, запустите сначала seed_clients.py")
    except Exception as e:
        db.rollback()
        print(f"[ERROR] Ошибка при сидировании заказов: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    seed_orders()
