# Iteration 7 setup: create 2 TEST_ users with saves for the live duel UI test. Prints emails.
import json, os, uuid, requests

BASE = os.environ["EXPO_PUBLIC_BACKEND_URL"].rstrip("/")
out = {}
for role, name, party in [
    ("host", "TEST_Ana", [("mortadellone", 22), ("crescentino", 10), ("zuppissima", 20)]),
    ("guest", "TEST_Bep", [("tortellotto", 12), ("vaporiera", 22)]),
]:
    email = f"test_it7_{role}_{uuid.uuid4().hex[:5]}@example.com"
    t = requests.post(f"{BASE}/api/auth/register", json={"email": email, "password": "secret123"}).json()["token"]
    st = {"name": name, "map": "bologna", "x": 7, "y": 7, "dir": "right",
          "party": [{"uid": f"u{i}{role}", "s": s, "lv": lv, "xp": lv ** 3, "hp": 5} for i, (s, lv) in enumerate(party)],
          "box": [], "seen": [s for s, _ in party], "caught": [s for s, _ in party], "money": 150,
          "items": {"vasetto": 5, "brodino": 3, "gelato": 2}, "defeated": [], "badges": [], "lastHeal": {"map": "bologna", "x": 2, "y": 13}}
    assert requests.put(f"{BASE}/api/save", json={"state": st}, headers={"Authorization": f"Bearer {t}"}).status_code == 200
    out[role] = email
print(json.dumps(out))
