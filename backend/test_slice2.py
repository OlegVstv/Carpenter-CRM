import urllib.request
import urllib.error
import json

BASE = "http://localhost:8000/api"

def test_post(url, data):
    req = urllib.request.Request(
        url, 
        data=json.dumps(data).encode("utf-8"),
        headers={"Content-Type": "application/json"},
        method="POST"
    )
    try:
        resp = urllib.request.urlopen(req)
        body = json.loads(resp.read().decode())
        print(f"  STATUS: {resp.status}")
        print(f"  BODY: {json.dumps(body, ensure_ascii=False, indent=2)[:200]}")
    except urllib.error.HTTPError as e:
        body = json.loads(e.read().decode())
        print(f"  STATUS: {e.code}")
        print(f"  DETAIL: {body.get('detail', body)}")

def test_get(url):
    resp = urllib.request.urlopen(url)
    body = json.loads(resp.read().decode())
    print(f"  STATUS: {resp.status}, COUNT: {len(body)}")

print("=== TEST 1: GET /api/clients ===")
test_get(f"{BASE}/clients")

print("\n=== TEST 2: POST /api/clients (lead_id=999 -> 404) ===")
test_post(f"{BASE}/clients", {"lead_id": 999})

print("\n=== TEST 3: POST /api/clients (lead_id=13 -> 409 duplicate) ===")
test_post(f"{BASE}/clients", {"lead_id": 13})

# Find a lead that hasn't been converted
print("\n=== TEST 4: GET /api/leads (find unconverted) ===")
resp = urllib.request.urlopen(f"{BASE}/leads")
leads = json.loads(resp.read().decode())
converted_ids = set()
resp2 = urllib.request.urlopen(f"{BASE}/clients")
clients = json.loads(resp2.read().decode())
for c in clients:
    if c["lead_id"]:
        converted_ids.add(c["lead_id"])

unconverted = [l for l in leads if l["id"] not in converted_ids]
if unconverted:
    free_lead = unconverted[0]
    print(f"  Found unconverted lead: #{free_lead['id']} ({free_lead['client_name']})")
    
    print(f"\n=== TEST 5: POST /api/clients (lead_id={free_lead['id']} -> 201) ===")
    test_post(f"{BASE}/clients", {"lead_id": free_lead["id"], "email": "test@test.ru"})
    
    print("\n=== TEST 6: GET /api/clients (after conversion) ===")
    test_get(f"{BASE}/clients")
else:
    print("  No unconverted leads found")

print("\n=== ALL TESTS COMPLETED ===")
