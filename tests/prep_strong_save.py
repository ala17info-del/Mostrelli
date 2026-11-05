# Prep TEST user's own save: strong starter at (7,7) facing right to verify trainer WIN flow via UI
import os, requests
B = os.environ["EXPO_PUBLIC_BACKEND_URL"].rstrip("/")
t = requests.post(f"{B}/api/auth/login", json={"email": "test_ui63446@example.com", "password": "secret123"}).json()["token"]
H = {"Authorization": f"Bearer {t}"}
s = requests.get(f"{B}/api/save", headers=H).json()["state"]
for m in s["party"]:
    if m["s"] == "tortellotto":
        m["lv"], m["xp"], m["hp"] = 30, 27000, 67
s["party"].sort(key=lambda m: m["s"] != "tortellotto")
s.update({"map": "bologna", "x": 7, "y": 7, "dir": "right"})
r = requests.put(f"{B}/api/save", json={"state": s}, headers=H)
print(r.status_code, s["money"], s["defeated"], [(m["s"], m["lv"], m["hp"]) for m in s["party"]])
