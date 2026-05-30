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

print("=== TEST 1: GET /api/tasks ===")
status, tasks = make_request(f"{BASE}/tasks")
print(f"  STATUS: {status}, COUNT: {len(tasks) if isinstance(tasks, list) else tasks}")

print("\n=== TEST 2: GET /api/orders ===")
status, orders = make_request(f"{BASE}/orders")
print(f"  STATUS: {status}, COUNT: {len(orders) if isinstance(orders, list) else orders}")

order_id = None
if isinstance(orders, list) and len(orders) > 0:
    order_id = orders[0]["id"]
    print(f"  Используем заказ: ID={order_id}, Изделие={orders[0]['product_type']}")
else:
    print("  [!] Нет заказов в БД, задача будет создана без привязки к заказу.")

print(f"\n=== TEST 3: POST /api/tasks (Создание задачи) ===")
task_data = {
    "title": "Тестовая задача по срезу 4",
    "description": "Описание тестовой задачи для проверки CRUD.",
    "due_date": "2026-06-10",
    "priority": "высокий",
    "status": "нужно сделать",
    "assigned_to": "DIRECTOR",
    "order_id": order_id
}
status, new_task = make_request(f"{BASE}/tasks", data=task_data, method="POST")
print(f"  STATUS: {status}")
print(f"  BODY: {json.dumps(new_task, ensure_ascii=False, indent=2)}")

if status != 201:
    print("  [!] Не удалось создать задачу, прекращаем тесты.")
    sys.exit(1)

task_id = new_task["id"]

print(f"\n=== TEST 4: PATCH /api/tasks/{task_id}/status (Обновление статуса) ===")
status, patched_task = make_request(f"{BASE}/tasks/{task_id}/status", data={"status": "в процессе"}, method="PATCH")
print(f"  STATUS: {status}")
print(f"  Новый статус: {patched_task.get('status') if isinstance(patched_task, dict) else patched_task}")

print(f"\n=== TEST 5: GET /api/tasks?status=в процессе (Фильтрация по статусу) ===")
status, filtered_tasks = make_request(f"{BASE}/tasks?status=" + urllib.parse.quote("в процессе"))
print(f"  STATUS: {status}, Найдено задач со статусом 'в процессе': {len(filtered_tasks) if isinstance(filtered_tasks, list) else filtered_tasks}")

if order_id is not None:
    print(f"\n=== TEST 6: GET /api/tasks?order_id={order_id} (Фильтрация по заказу) ===")
    status, order_tasks = make_request(f"{BASE}/tasks?order_id={order_id}")
    print(f"  STATUS: {status}, Найдено задач для заказа #{order_id}: {len(order_tasks) if isinstance(order_tasks, list) else order_tasks}")

print(f"\n=== TEST 7: DELETE /api/tasks/{task_id} (Удаление задачи) ===")
status, delete_resp = make_request(f"{BASE}/tasks/{task_id}", method="DELETE")
print(f"  STATUS: {status}")
print(f"  BODY: {delete_resp}")

print(f"\n=== TEST 8: GET /api/tasks (После удаления) ===")
status, tasks_after = make_request(f"{BASE}/tasks")
print(f"  STATUS: {status}, Всего задач: {len(tasks_after) if isinstance(tasks_after, list) else tasks_after}")

print("\n=== ALL TESTS COMPLETED ===")
