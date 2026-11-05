# Creates TEST_ users with crafted saves for iteration-2 UI testing. Prints emails.
import json, os, uuid, requests

BASE = os.environ["EXPO_PUBLIC_BACKEND_URL"].rstrip("/")
BADGES5 = ["Sigillo del Cantiere", "Sigillo della Via Emilia", "Sigillo delle Terme", "Sigillo del Rombo", "Sigillo Estense"]


def mk(state):
    email = f"test_it2_{uuid.uuid4().hex[:6]}@example.com"
    r = requests.post(f"{BASE}/api/auth/register", json={"email": email, "password": "secret123"})
    t = r.json()["token"]
    p = requests.put(f"{BASE}/api/save", json={"state": state}, headers={"Authorization": f"Bearer {t}"})
    assert p.status_code == 200, p.text
    return email


base = dict(box=[], seen=["tortellotto"], caught=["tortellotto"], defeated=[], dir="down")
A = dict(base, name="TEST_Evo", map="bologna", x=8, y=12, money=500, badges=[],
         party=[{"uid": "e1", "s": "tortellotto", "lv": 15, "xp": 4090, "hp": 38},
                {"uid": "e2", "s": "fanghino", "lv": 5, "xp": 125, "hp": 0}],
         items={"vasetto": 3, "brodino": 2}, lastHeal={"map": "bologna", "x": 2, "y": 13})
B = dict(base, name="TEST_Riv", map="imola", x=14, y=8, dir="right", money=1000, badges=BADGES5,
         party=[{"uid": "r1", "s": "cinghialone", "lv": 45, "xp": 91125, "hp": 137},
                {"uid": "r2", "s": "tortellotto", "lv": 10, "xp": 1000, "hp": 5},
                {"uid": "r3", "s": "fanghino", "lv": 10, "xp": 1000, "hp": 0}],
         items={"vasetto": 5, "brodino": 3, "tortellini": 2, "caffe": 2}, lastHeal={"map": "imola", "x": 4, "y": 11})
print(json.dumps({"A": mk(A), "B": mk(B)}))
