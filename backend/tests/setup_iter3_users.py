# Creates TEST_ users with crafted saves for iteration-3 UI testing (Tonello, rewards, wild pay, lose penalty). Prints emails.
import json, os, uuid, requests

BASE = os.environ["EXPO_PUBLIC_BACKEND_URL"].rstrip("/")


def mk(state):
    email = f"test_it3_{uuid.uuid4().hex[:6]}@example.com"
    r = requests.post(f"{BASE}/api/auth/register", json={"email": email, "password": "secret123"})
    t = r.json()["token"]
    p = requests.put(f"{BASE}/api/save", json={"state": state}, headers={"Authorization": f"Bearer {t}"})
    assert p.status_code == 200, p.text
    return email


base = dict(box=[], seen=["cinghialone"], caught=["cinghialone"], defeated=[], badges=[],
            items={"vasetto": 3, "brodino": 3, "tortellini": 1, "caffe": 1})
strong = [{"uid": "s1", "s": "cinghialone", "lv": 45, "xp": 91125, "hp": 137},
          {"uid": "s2", "s": "tortellotto", "lv": 10, "xp": 1000, "hp": 20}]
# T: facing Tonello at Osteria Grande
T = dict(base, name="TEST_Ton", map="osteria", x=3, y=4, dir="up", money=100, party=strong,
         lastHeal={"map": "osteria", "x": 2, "y": 10})
# S: facing Studente (8,7) in Bologna
S = dict(base, name="TEST_Stu", map="bologna", x=8, y=8, dir="up", money=100, party=strong,
         lastHeal={"map": "bologna", "x": 2, "y": 13})
# W: Riviera dune, weak-mid team for multi-turn wild battle / lose test
W = dict(base, name="TEST_Wild", map="riviera", x=4, y=10, dir="down", money=1000,
         party=[{"uid": "w1", "s": "tortellotto", "lv": 18, "xp": 5832, "hp": 30},
                {"uid": "w2", "s": "fanghino", "lv": 3, "xp": 27, "hp": 1}],
         lastHeal={"map": "riviera", "x": 4, "y": 4})
print(json.dumps({"T": mk(T), "S": mk(S), "W": mk(W)}))
