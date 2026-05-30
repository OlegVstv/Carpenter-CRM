import os
from datetime import date
from dotenv import load_dotenv
load_dotenv(os.path.join(os.path.dirname(__file__), ".env.local"))

from database import SessionLocal, engine
from models import Order, Payment, Base

def seed_financial():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        # Очищаем старые платежи
        db.query(Payment).delete()
        db.commit()

        # Находим существующие заказы для привязки платежей
        order_stairs = db.query(Order).filter(Order.product_type == "Лестница деревянная на металлокаркасе").first()
        order_slab_table = db.query(Order).filter(Order.product_type == "Офисный стол из слэба").first()

        test_payments = []

        # Платежи по лестнице (Всего стоимость 280,000.0, оплачено 140,000.0)
        if order_stairs:
            test_payments.append(Payment(
                order_id=order_stairs.id,
                amount=140000.0,
                payment_date=date(2026, 5, 10),
                comment="Аванс 50% по договору"
            ))
            print(f"  -> Создан платеж для заказа '{order_stairs.product_type}'")

        # Платежи по столу (Всего стоимость 150,000.0, оплачено 150,000.0)
        if order_slab_table:
            test_payments.append(Payment(
                order_id=order_slab_table.id,
                amount=75000.0,
                payment_date=date(2026, 5, 15),
                comment="Предоплата 50%"
            ))
            test_payments.append(Payment(
                order_id=order_slab_table.id,
                amount=75000.0,
                payment_date=date(2026, 5, 28),
                comment="Финальный расчет"
            ))
            print(f"  -> Созданы платежи для заказа '{order_slab_table.product_type}'")

        if test_payments:
            db.add_all(test_payments)
            db.commit()
            print(f"\n[OK] База данных успешно наполнена платежами! Всего: {len(test_payments)} записей.")
        else:
            print("\n[!] Не удалось создать платежи, так как соответствующие заказы не найдены.")
    except Exception as e:
        db.rollback()
        print(f"[ERROR] Ошибка при сидировании финансов: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    seed_financial()
