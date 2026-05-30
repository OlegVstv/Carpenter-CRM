import urllib.request
import urllib.error
import urllib.parse
import json
import sys

BASE = "http://localhost:8000/api"

def make_request(url, data=None, method="GET"):
    req = urllib.request.Request(
        url,
        data=json.dumps(data).encode("utf-8") if data is not None else None,
        headers={"Content-Type": "application/json"} if data is not None else {},
        method=method
    )
    try:
        with urllib.request.urlopen(req) as resp:
            body = json.loads(resp.read().decode("utf-8"))
            return resp.status, body
    except urllib.error.HTTPError as e:
        try:
            body = json.loads(e.read().decode("utf-8"))
        except Exception:
            body = e.read().decode("utf-8")
        return e.code, body
    except Exception as e:
        return 0, str(e)

print("=== TEST 1: GET /api/orders ===")
status, orders = make_request(f"{BASE}/orders")
print(f"  STATUS: {status}, COUNT: {len(orders) if isinstance(orders, list) else orders}")

if not isinstance(orders, list) or len(orders) == 0:
    print("  [!] Нет заказов в БД, прекращаем тесты.")
    sys.exit(1)

order_id = orders[0]["id"]
print(f"  Используем заказ: ID={order_id}, Изделие={orders[0]['product_type']}")

print("\n=== TEST 2: POST /api/suppliers (Создание поставщика) ===")
supplier_data = {
    "name": "Тестовый Поставщик 5",
    "contact_person": "Тестовое Лицо",
    "phone": "+7 (999) 000-00-00",
    "email": "test@supplier.com"
}
status, supplier = make_request(f"{BASE}/suppliers", data=supplier_data, method="POST")
print(f"  STATUS: {status}")
print(f"  BODY: {json.dumps(supplier, ensure_ascii=False, indent=2)}")

print("\n=== TEST 3: GET /api/suppliers (Список поставщиков) ===")
status, suppliers = make_request(f"{BASE}/suppliers")
print(f"  STATUS: {status}, Всего поставщиков: {len(suppliers) if isinstance(suppliers, list) else suppliers}")

print("\n=== TEST 4: POST /api/materials (Создание материала) ===")
material_data = {
    "name": "Тестовый дубовый брус 100х100",
    "sku": "WOOD-OAK-100",
    "unit": "м.п.",
    "price": 1200.0
}
status, material = make_request(f"{BASE}/materials", data=material_data, method="POST")
print(f"  STATUS: {status}")
print(f"  BODY: {json.dumps(material, ensure_ascii=False, indent=2)}")

if status != 201 or not isinstance(material, dict):
    print("  [!] Не удалось создать материал, прекращаем тесты.")
    sys.exit(1)

material_id = material["id"]

print("\n=== TEST 5: POST /api/supply-requests (Создание заявки) ===")
req_data = {
    "order_id": order_id,
    "material_id": material_id,
    "quantity": 10.0,
    "actual_price": 1150.0,
    "status": "черновик",
    "delivery_date": "2026-06-15"
}
status, new_req = make_request(f"{BASE}/supply-requests", data=req_data, method="POST")
print(f"  STATUS: {status}")
print(f"  BODY: {json.dumps(new_req, ensure_ascii=False, indent=2)}")

if status != 201 or not isinstance(new_req, dict):
    print("  [!] Не удалось создать заявку на закупку, прекращаем тесты.")
    sys.exit(1)

req_id = new_req["id"]

print(f"\n=== TEST 6: PATCH /api/supply-requests/{req_id}/status (Обновление статуса) ===")
status, patched_req = make_request(f"{BASE}/supply-requests/{req_id}/status", data={"status": "заказано", "delivery_date": "2026-06-14"}, method="PATCH")
print(f"  STATUS: {status}")
print(f"  Новый статус: {patched_req.get('status') if isinstance(patched_req, dict) else patched_req}")

print(f"\n=== TEST 7: GET /api/supply-requests (Список всех закупок) ===")
status, supply_requests = make_request(f"{BASE}/supply-requests")
print(f"  STATUS: {status}, Всего заявок: {len(supply_requests) if isinstance(supply_requests, list) else supply_requests}")

if isinstance(supply_requests, list) and len(supply_requests) > 0:
    # Ищем нашу созданную заявку в списке
    my_req = next((r for r in supply_requests if r["id"] == req_id), None)
    if my_req:
        print(f"  Проверка helper-полей ответа: материал={my_req.get('material_name')}, изделие={my_req.get('order_product_type')}, клиент={my_req.get('client_name')}")
    else:
        print("  [!] Созданная заявка не найдена в списке.")

print(f"\n=== TEST 8: DELETE /api/supply-requests/{req_id} (Удаление закупки) ===")
status, delete_resp = make_request(f"{BASE}/supply-requests/{req_id}", method="DELETE")
print(f"  STATUS: {status}")
print(f"  BODY: {delete_resp}")

print(f"\n=== TEST 9: GET /api/supply-requests (После удаления) ===")
status, reqs_after = make_request(f"{BASE}/supply-requests")
print(f"  STATUS: {status}, Всего заявок: {len(reqs_after) if isinstance(reqs_after, list) else reqs_after}")

print("\n=== ALL TESTS COMPLETED ===")
