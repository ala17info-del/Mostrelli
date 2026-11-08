# Helper to backup/patch/restore test user's save for daynight/battle UI tests
import json, os, sys, requests

BASE = os.environ["EXPO_PUBLIC_BACKEND_URL"].rstrip("/")
BK = "/tmp/save_backup.json"

def tok():
    r = requests.post(f"{BASE}/api/auth/login", json={"email": "test@bologna.it", "password": "tortellini"})
    r.raise_for_status()
    return {"Authorization": f"Bearer {r.json()['token']}"}

h = tok()
cmd = sys.argv[1]
if cmd == "backup":
    if not os.path.exists(BK):
        json.dump(requests.get(f"{BASE}/api/save", headers=h).json()["state"], open(BK, "w"))
    print("backup ok")
elif cmd == "set":
    st = json.load(open(BK))
    st.update({"map": sys.argv[2], "x": int(sys.argv[3]), "y": int(sys.argv[4]), "dir": "up"})
    st["party"] = [dict(p, hp=999) if False else p for p in st["party"]]
    r = requests.put(f"{BASE}/api/save", headers=h, json={"state": st})
    print("set", r.status_code, r.json()["state"]["map"], r.json()["state"]["x"], r.json()["state"]["y"])
elif cmd == "restore":
    r = requests.put(f"{BASE}/api/save", headers=h, json={"state": json.load(open(BK))})
    print("restore", r.status_code, r.json()["state"])
