# Helper: login as TEST_ user and GET/patch save. Usage: python save_tool.py email [json_patch]
import json, os, sys, requests

BASE = os.environ["EXPO_PUBLIC_BACKEND_URL"].rstrip("/")
t = requests.post(f"{BASE}/api/auth/login", json={"email": sys.argv[1], "password": "secret123"}).json()["token"]
h = {"Authorization": f"Bearer {t}"}
st = requests.get(f"{BASE}/api/save", headers=h).json()["state"]
if len(sys.argv) > 2:
    st.update(json.loads(sys.argv[2]))
    assert requests.put(f"{BASE}/api/save", json={"state": st}, headers=h).status_code == 200
print(json.dumps({k: st[k] for k in ["map", "x", "y", "items", "badges", "defeated", "money", "picked"] if k in st}))
print([(m["s"], m["lv"], m["xp"], m["hp"]) for m in st["party"]], len(st.get("box", [])), st.get("caught"))
