import urllib.request
import urllib.error
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

print("\n=== TEST 2: GET /api/clients ===")
status, clients = make_request(f"{BASE}/clients")
print(f"  STATUS: {status}, COUNT: {len(clients) if isinstance(clients, list) else clients}")

if not isinstance(clients, list) or len(clients) == 0:
    print("  [!] Нет клиентов для привязки заказа, прекращаем тесты.")
    sys.exit(1)

client = clients[0]
client_id = client["id"]
print(f"  Используем клиента: ID={client_id}, Имя={client['name']}")

print(f"\n=== TEST 3: POST /api/orders (Создание заказа) ===")
order_data = {
    "client_id": client_id,
    "product_type": "Стол столярный тестовый",
    "technical_spec": "Тестовое техническое описание стола.",
    "price": 75000.0,
    "status": "принят",
    "delivery_date": "2026-06-01",
    "installation_date": "2026-06-02"
}
status, new_order = make_request(f"{BASE}/orders", data=order_data, method="POST")
print(f"  STATUS: {status}")
print(f"  BODY: {json.dumps(new_order, ensure_ascii=False, indent=2)}")

if status != 201:
    print("  [!] Не удалось создать заказ, прекращаем тесты.")
    sys.exit(1)

order_id = new_order["id"]

print(f"\n=== TEST 4: PATCH /api/orders/{order_id}/status (Обновление статуса) ===")
status, patched_order = make_request(f"{BASE}/orders/{order_id}/status", data={"status": "в производстве"}, method="PATCH")
print(f"  STATUS: {status}")
print(f"  Новый статус: {patched_order.get('status') if isinstance(patched_order, dict) else patched_order}")

print(f"\n=== TEST 5: GET /api/orders (После создания) ===")
status, orders = make_request(f"{BASE}/orders")
print(f"  STATUS: {status}, Всего заказов: {len(orders) if isinstance(orders, list) else orders}")

print(f"\n=== TEST 6: DELETE /api/orders/{order_id} (Удаление заказа) ===")
status, delete_resp = make_request(f"{BASE}/orders/{order_id}", method="DELETE")
print(f"  STATUS: {status}")
print(f"  BODY: {delete_resp}")

print(f"\n=== TEST 7: GET /api/orders (После удаления) ===")
status, orders = make_request(f"{BASE}/orders")
print(f"  STATUS: {status}, Всего заказов: {len(orders) if isinstance(orders, list) else orders}")

print("\n=== ALL TESTS COMPLETED ===")
