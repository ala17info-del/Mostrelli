import requests, uuid, json
B = "http://localhost:8001/api"
def reg():
    r = requests.post(B + "/auth/register", json={"email": f"rooms_{uuid.uuid4().hex[:6]}@example.com", "password": "secret123"}).json()
    return {"Authorization": "Bearer " + r["token"]}
def mon(uid, s, lv): return {"uid": uid, "s": s, "lv": lv, "xp": lv ** 3, "hp": 20}
a, b = reg(), reg()
for h, pre in ((a, "a"), (b, "b")):
    st = {"name": pre, "map": "bologna", "x": 7, "y": 7, "dir": "down", "party": [mon(pre + "1", "tortellotto", 10), mon(pre + "2", "balsamino", 25)], "box": [], "seen": [], "caught": [], "money": 0, "items": {}, "defeated": [], "badges": [], "lastHeal": {"map": "bologna", "x": 2, "y": 13}}
    print("save", requests.put(B + "/save", json={"state": st}, headers=h).status_code)
p = [mon("x", "parmigianino", 10)]
d = requests.post(B + "/live", json={"name": "A", "party": p, "mode": "trade"}, headers=a).json(); c = d["code"]
print("join", requests.post(B + f"/live/{c}/join", json={"name": "B", "party": p}, headers=b).json()["mode"])
print("offer a", requests.post(B + f"/live/{c}/offer", json={"uid": "a2"}, headers=a).status_code)
print("offer b", requests.post(B + f"/live/{c}/offer", json={"uid": "b1"}, headers=b).status_code)
print("confirm a", requests.post(B + f"/live/{c}/confirm", headers=a).json()["trade_done"])
r = requests.post(B + f"/live/{c}/confirm", headers=b).json(); print("confirm b", r["trade_done"], r["status"])
sa = requests.get(B + "/save", headers=a).json()["state"]; sb = requests.get(B + "/save", headers=b).json()["state"]
print("A party", [m["s"] for m in sa["party"]], "B party", [m["s"] for m in sb["party"]])
d = requests.post(B + "/live", json={"name": "A", "party": p, "mode": "coop", "boss": "pa_duchessa"}, headers=a).json(); c = d["code"]
print("coop", d["mode"], d["boss"])
requests.post(B + f"/live/{c}/join", json={"name": "B", "party": p}, headers=b)
requests.post(B + f"/live/{c}/action", json={"turn": 0, "kind": "move", "move": "sberla"}, headers=a)
r = requests.post(B + f"/live/{c}/action", json={"turn": 0, "kind": "pass"}, headers=b).json(); print("coop turn", r["turn"], len(r["log"]))
print("end", requests.post(B + f"/live/{c}/end", json={"winner": "boss"}, headers=a).json()["winner"])
print("bad coop", requests.post(B + "/live", json={"name": "A", "party": p, "mode": "coop"}, headers=a).status_code)
