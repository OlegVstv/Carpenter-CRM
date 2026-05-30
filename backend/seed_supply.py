import os
from datetime import date
from dotenv import load_dotenv
load_dotenv(os.path.join(os.path.dirname(__file__), ".env.local"))

from database import SessionLocal, engine
from models import Order, Supplier, Material, SupplyRequest, SupplyRequestStatus, Base

def seed_supply():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        # Очищаем старые закупки, материалы и поставщиков
        db.query(SupplyRequest).delete()
        db.query(Material).delete()
        db.query(Supplier).delete()
        db.commit()

        # 1. Создаем поставщиков
        supplier_wood = Supplier(
            name="ВудМаркет",
            contact_person="Иван Петров",
            phone="+7 (999) 111-22-33",
            email="wood@market.ru"
        )
        supplier_hardware = Supplier(
            name="Фурнитура-Люкс",
            contact_person="Елена Сидорова",
            phone="+7 (999) 444-55-66",
            email="info@furnitura-lux.ru"
        )
        db.add_all([supplier_wood, supplier_hardware])
        db.commit()
        print("  -> Созданы поставщики: ВудМаркет, Фурнитура-Люкс")

        # 2. Создаем материалы
        mat_slab = Material(
            name="Слэб Карагача",
            sku="SLAB-KAR-01",
            unit="шт",
            price=45000.0
        )
        mat_oak = Material(
            name="Дубовый щит 40мм",
            sku="BOARD-OAK-40",
            unit="м²",
            price=5200.0
        )
        mat_lacquer = Material(
            name="Лак акриловый",
            sku="CHEM-LAC-ACR",
            unit="литр",
            price=850.0
        )
        mat_hinge = Material(
            name="Петли Blum",
            sku="HARD-BLUM-110",
            unit="шт",
            price=320.0
        )
        db.add_all([mat_slab, mat_oak, mat_lacquer, mat_hinge])
        db.commit()
        print("  -> Созданы материалы: Слэб Карагача, Дубовый щит 40мм, Лак акриловый, Петли Blum")

        # 3. Находим существующие заказы для привязки закупок
        order_kitchen = db.query(Order).filter(Order.product_type == "Кухня из массива дуба").first()
        order_stairs = db.query(Order).filter(Order.product_type == "Лестница деревянная на металлокаркасе").first()
        order_slab_table = db.query(Order).filter(Order.product_type == "Офисный стол из слэба").first()

        test_requests = []

        # Закупки для кухни
        if order_kitchen:
            test_requests.append(SupplyRequest(
                order_id=order_kitchen.id,
                material_id=mat_oak.id,
                quantity=15.0, # 15 кв.м.
                actual_price=5000.0, # Договорились по 5000р
                status=SupplyRequestStatus.APPROVED,
                delivery_date=date(2026, 6, 10)
            ))
            test_requests.append(SupplyRequest(
                order_id=order_kitchen.id,
                material_id=mat_lacquer.id,
                quantity=10.0, # 10 литров
                actual_price=800.0,
                status=SupplyRequestStatus.ORDERED,
                delivery_date=date(2026, 6, 8)
            ))
            print(f"  -> Созданы заявки на закупку для заказа '{order_kitchen.product_type}'")

        # Закупки для лестницы
        if order_stairs:
            test_requests.append(SupplyRequest(
                order_id=order_stairs.id,
                material_id=mat_oak.id,
                quantity=25.0, # 25 кв.м.
                actual_price=5200.0,
                status=SupplyRequestStatus.DELIVERED,
                delivery_date=date(2026, 5, 20)
            ))
            print(f"  -> Созданы заявки на закупку для заказа '{order_stairs.product_type}'")

        # Закупки для стола из слэба
        if order_slab_table:
            test_requests.append(SupplyRequest(
                order_id=order_slab_table.id,
                material_id=mat_slab.id,
                quantity=2.0, # 2 слэба
                actual_price=45000.0,
                status=SupplyRequestStatus.DELIVERED,
                delivery_date=date(2026, 5, 25)
            ))
            test_requests.append(SupplyRequest(
                order_id=order_slab_table.id,
                material_id=mat_hinge.id,
                quantity=8.0,
                actual_price=300.0,
                status=SupplyRequestStatus.DRAFT
            ))
            print(f"  -> Созданы заявки на закупку для заказа '{order_slab_table.product_type}'")

        if test_requests:
            db.add_all(test_requests)
            db.commit()
            print(f"\n[OK] База данных успешно наполнена заявками на закупки! Всего: {len(test_requests)} записей.")
        else:
            print("\n[!] Не удалось привязать заявки, так как заказы не найдены. Пожалуйста, запустите сначала seed_orders.py")

    except Exception as e:
        db.rollback()
        print(f"[ERROR] Ошибка при сидировании снабжения: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    seed_supply()
