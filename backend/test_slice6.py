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

print("=== TEST 1: GET /api/clients ===")
status, clients = make_request(f"{BASE}/clients")
print(f"  STATUS: {status}, COUNT: {len(clients) if isinstance(clients, list) else clients}")

if not isinstance(clients, list) or len(clients) == 0:
    print("  [!] Нет клиентов в БД, прекращаем тесты.")
    sys.exit(1)

client_id = clients[0]["id"]
print(f"  Используем клиента: ID={client_id}, Имя={clients[0]['name']}")

print("\n=== TEST 2: POST /api/orders (Создание заказа для теста финансов) ===")
order_data = {
    "client_id": client_id,
    "product_type": "Тестовые стулья из ясеня",
    "technical_spec": "Спецификация для теста Среза 6",
    "price": 100000.0,
    "status": "принят"
}
status, order = make_request(f"{BASE}/orders", data=order_data, method="POST")
print(f"  STATUS: {status}")
print(f"  BODY: {json.dumps(order, ensure_ascii=False, indent=2)}")

if status != 201 or not isinstance(order, dict):
    print("  [!] Не удалось создать заказ, прекращаем тесты.")
    sys.exit(1)

order_id = order["id"]
print(f"  Начальный paid_amount: {order.get('paid_amount')}")
print(f"  Начальный remaining_balance: {order.get('remaining_balance')}")
print(f"  Начальный payment_status: {order.get('payment_status')}")

# Проверяем, что начальный статус правильный
if order.get("paid_amount") != 0.0 or order.get("payment_status") != "ожидает оплаты":
    print("  [!] Неверный начальный финансовый статус заказа.")
    sys.exit(1)

print("\n=== TEST 3: POST /api/payments (Создание первого платежа - Предоплата) ===")
payment_1 = {
    "order_id": order_id,
    "amount": 40000.0,
    "payment_date": "2026-05-30",
    "comment": "Тестовый аванс 40%"
}
status, pay1_resp = make_request(f"{BASE}/payments", data=payment_1, method="POST")
print(f"  STATUS: {status}")
print(f"  BODY: {json.dumps(pay1_resp, ensure_ascii=False, indent=2)}")

if status != 201:
    print("  [!] Не удалось внести первый платеж.")
    sys.exit(1)

pay1_id = pay1_resp["id"]

# Запрашиваем заказ повторно, чтобы проверить статус
print("\n=== TEST 4: GET /api/orders (Проверка после 1-го платежа) ===")
status, orders = make_request(f"{BASE}/orders")
test_order = next((o for o in orders if o["id"] == order_id), None)
if test_order:
    print(f"  Текущий paid_amount: {test_order.get('paid_amount')}")
    print(f"  Текущий remaining_balance: {test_order.get('remaining_balance')}")
    print(f"  Текущий payment_status: {test_order.get('payment_status')}")
    if test_order.get("paid_amount") != 40000.0 or test_order.get("payment_status") != "предоплата":
        print("  [!] Неверный статус после предоплаты.")
        sys.exit(1)
else:
    print("  [!] Заказ не найден.")
    sys.exit(1)

print("\n=== TEST 5: POST /api/payments (Создание второго платежа - Полная оплата) ===")
payment_2 = {
    "order_id": order_id,
    "amount": 60000.0,
    "payment_date": "2026-05-30",
    "comment": "Тестовый расчет 60%"
}
status, pay2_resp = make_request(f"{BASE}/payments", data=payment_2, method="POST")
print(f"  STATUS: {status}")

# Запрашиваем заказ повторно
status, orders = make_request(f"{BASE}/orders")
test_order = next((o for o in orders if o["id"] == order_id), None)
if test_order:
    print(f"  Итоговый paid_amount: {test_order.get('paid_amount')}")
    print(f"  Итоговый remaining_balance: {test_order.get('remaining_balance')}")
    print(f"  Итоговый payment_status: {test_order.get('payment_status')}")
    if test_order.get("paid_amount") != 100000.0 or test_order.get("payment_status") != "оплачен полностью":
        print("  [!] Неверный статус после полной оплаты.")
        sys.exit(1)

print("\n=== TEST 6: GET /api/financials/summary (Получение дашборда) ===")
status, summary = make_request(f"{BASE}/financials/summary")
print(f"  STATUS: {status}")
print(f"  BODY: {json.dumps(summary, ensure_ascii=False, indent=2)}")

if status != 200:
    print("  [!] Не удалось получить финансовую сводку.")
    sys.exit(1)

print("\n=== TEST 7: DELETE /api/payments/{id} (Удаление первого платежа) ===")
status, del_resp = make_request(f"{BASE}/payments/{pay1_id}", method="DELETE")
print(f"  STATUS: {status}")
print(f"  BODY: {del_resp}")

if status != 200:
    print("  [!] Не удалось удалить первый платеж.")
    sys.exit(1)

# Запрашиваем заказ повторно, проверяем перерасчет
status, orders = make_request(f"{BASE}/orders")
test_order = next((o for o in orders if o["id"] == order_id), None)
if test_order:
    print(f"  После удаления paid_amount: {test_order.get('paid_amount')}")
    print(f"  После удаления remaining_balance: {test_order.get('remaining_balance')}")
    print(f"  После удаления payment_status: {test_order.get('payment_status')}")
    if test_order.get("paid_amount") != 60000.0 or test_order.get("payment_status") != "предоплата":
        print("  [!] Ошибка перерасчета после удаления платежа.")
        sys.exit(1)

# Удаляем тестовый заказ для чистоты БД
print("\n=== TEST 8: DELETE /api/orders/{id} (Очистка) ===")
status, del_order_resp = make_request(f"{BASE}/orders/{order_id}", method="DELETE")
print(f"  STATUS: {status}")

print("\n=== ALL TESTS PASSED SUCCESSFULLY ===")
