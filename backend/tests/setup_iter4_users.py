# Creates TEST_ users with crafted saves for iteration-4 UI testing (move side effects). Prints emails.
import json, os, uuid, requests

BASE = os.environ["EXPO_PUBLIC_BACKEND_URL"].rstrip("/")


def mk(state):
    email = f"test_it4_{uuid.uuid4().hex[:6]}@example.com"
    r = requests.post(f"{BASE}/api/auth/register", json={"email": email, "password": "secret123"})
    t = r.json()["token"]
    p = requests.put(f"{BASE}/api/save", json={"state": state}, headers={"Authorization": f"Bearer {t}"})
    assert p.status_code == 200, p.text
    return email


base = dict(box=[], seen=["umarellino"], caught=["umarellino"], defeated=[], badges=[],
            items={"vasetto": 5, "brodino": 5, "tortellini": 2, "caffe": 2}, money=500,
            lastHeal={"map": "bologna", "x": 2, "y": 13})
# A: Bologna grass, Umarellino lv12 (chiacchierata+lamentela) lead + Zanzarone lv18 + weak Tortellotto
A = dict(base, name="TEST_Fx", map="bologna", x=8, y=12, dir="down",
         party=[{"uid": "f1", "s": "umarellino", "lv": 12, "xp": 1728, "hp": 39},
                {"uid": "f2", "s": "zanzarone", "lv": 18, "xp": 5832, "hp": 55},
                {"uid": "f3", "s": "tortellotto", "lv": 5, "xp": 125, "hp": 20}])
# B: facing Gino boss (trainer win money x2) with Zanzarone lead
B = dict(base, name="TEST_FxB", map="bologna", x=9, y=5, dir="up",
         party=[{"uid": "g1", "s": "zanzarone", "lv": 18, "xp": 5832, "hp": 55},
                {"uid": "g2", "s": "umarellino", "lv": 12, "xp": 1728, "hp": 39}])
print(json.dumps({"A": mk(A), "B": mk(B)}))
