# Iteration 9 UI setup: two TEST_ users with saves (bologna 1,8) for map/pickup/rooms UI tests
import json, os, uuid, requests
BASE = os.environ["EXPO_PUBLIC_BACKEND_URL"].rstrip("/") + "/api"
out = {}
for pre in ("h", "g"):
    email = f"test_it9_ui{pre}_{uuid.uuid4().hex[:5]}@example.com"
    t = requests.post(BASE + "/auth/register", json={"email": email, "password": "secret123"}).json()["token"]
    h = {"Authorization": "Bearer " + t}
    party = [{"uid": pre + "1", "s": "tortellotto", "lv": 30, "xp": 27000, "hp": 200}, {"uid": pre + "2", "s": "balsamino", "lv": 28, "xp": 21952, "hp": 200}]
    st = {"name": "TEST_" + pre.upper(), "map": "bologna", "x": 1, "y": 8, "dir": "left", "party": party, "box": [], "seen": ["tortellotto", "balsamino"],
          "caught": ["tortellotto", "balsamino"], "money": 500, "items": {"vasetto": 3, "brodino": 3, "caramella": 2}, "defeated": [], "badges": [], "lastHeal": {"map": "bologna", "x": 2, "y": 13}}
    assert requests.put(BASE + "/save", json={"state": st}, headers=h).status_code == 200
    out[pre] = {"email": email, "token": t}
print(json.dumps(out))
