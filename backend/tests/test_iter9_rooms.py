# Iteration 9: online rooms (pvp/coop/trade) + save with expansion fields (picked, caramella)
import os, uuid
import pytest
import requests

BASE = os.environ["EXPO_PUBLIC_BACKEND_URL"].rstrip("/") + "/api"


def mon(uid, s, lv):
    return {"uid": uid, "s": s, "lv": lv, "xp": lv ** 3, "hp": 20}


def reg(pre):
    r = requests.post(BASE + "/auth/register", json={"email": f"test_it9_{pre}_{uuid.uuid4().hex[:6]}@example.com", "password": "secret123"})
    assert r.status_code in (200, 201), r.text
    return {"Authorization": "Bearer " + r.json()["token"]}


def put_save(h, pre, party, box=None):
    st = {"name": "TEST_" + pre, "map": "bologna", "x": 7, "y": 7, "dir": "down", "party": party, "box": box or [], "seen": [], "caught": [],
          "money": 0, "items": {"caramella": 2}, "picked": ["me_caramella"], "defeated": [], "badges": [], "lastHeal": {"map": "bologna", "x": 2, "y": 13}}
    r = requests.put(BASE + "/save", json={"state": st}, headers=h)
    assert r.status_code == 200, r.text


@pytest.fixture(scope="module")
def users():
    a, b = reg("a"), reg("b")
    put_save(a, "a", [mon("a1", "tortellotto", 10), mon("a2", "balsamino", 25)])
    put_save(b, "b", [mon("b1", "parmigianino", 12)], box=[mon("bx", "tortellotto", 5)])
    return a, b


P = [mon("x", "parmigianino", 10)]


# Save keeps expansion fields
def test_save_roundtrip_expansion_fields(users):
    a, _ = users
    st = requests.get(BASE + "/save", headers=a).json()["state"]
    assert st["picked"] == ["me_caramella"] and st["items"]["caramella"] == 2


# Room creation per mode
def test_create_modes(users):
    a, _ = users
    for mode in ("pvp", "trade"):
        d = requests.post(BASE + "/live", json={"name": "A", "party": P, "mode": mode}, headers=a)
        assert d.status_code == 200 and d.json()["mode"] == mode and d.json()["boss"] is None
    d = requests.post(BASE + "/live", json={"name": "A", "party": P, "mode": "coop", "boss": "pa_duchessa"}, headers=a).json()
    assert d["mode"] == "coop" and d["boss"] == "pa_duchessa" and d["status"] == "waiting"


def test_coop_without_boss_422(users):
    a, _ = users
    assert requests.post(BASE + "/live", json={"name": "A", "party": P, "mode": "coop"}, headers=a).status_code == 422


def test_bad_mode_422(users):
    a, _ = users
    assert requests.post(BASE + "/live", json={"name": "A", "party": P, "mode": "raid"}, headers=a).status_code == 422


def test_pvp_default_mode(users):
    a, _ = users
    d = requests.post(BASE + "/live", json={"name": "A", "party": P}, headers=a).json()
    assert d["mode"] == "pvp"


# Coop turn sealing with pass
def test_coop_pass_turn(users):
    a, b = users
    c = requests.post(BASE + "/live", json={"name": "A", "party": P, "mode": "coop", "boss": "pa_duchessa"}, headers=a).json()["code"]
    j = requests.post(BASE + f"/live/{c}/join", json={"name": "B", "party": P}, headers=b).json()
    assert j["mode"] == "coop" and j["boss"] == "pa_duchessa" and j["side"] == "guest"
    requests.post(BASE + f"/live/{c}/action", json={"turn": 0, "kind": "move", "move": "sberla"}, headers=a)
    r = requests.post(BASE + f"/live/{c}/action", json={"turn": 0, "kind": "pass"}, headers=b).json()
    assert r["turn"] == 1 and len(r["log"]) == 1 and r["log"][0]["guest"]["kind"] == "pass"
    e = requests.post(BASE + f"/live/{c}/end", json={"winner": "boss"}, headers=a).json()
    assert e["winner"] == "boss" and e["status"] == "done"


# Trade endpoints refused outside trade rooms / before guest joins
def test_offer_on_pvp_room_400(users):
    a, b = users
    c = requests.post(BASE + "/live", json={"name": "A", "party": P}, headers=a).json()["code"]
    requests.post(BASE + f"/live/{c}/join", json={"name": "B", "party": P}, headers=b)
    assert requests.post(BASE + f"/live/{c}/offer", json={"uid": "a1"}, headers=a).status_code == 400


def test_offer_waiting_room_409(users):
    a, _ = users
    c = requests.post(BASE + "/live", json={"name": "A", "party": P, "mode": "trade"}, headers=a).json()["code"]
    assert requests.post(BASE + f"/live/{c}/offer", json={"uid": "a1"}, headers=a).status_code == 409


# Full trade flow
def test_trade_flow(users):
    a, b = users
    c = requests.post(BASE + "/live", json={"name": "A", "party": P, "mode": "trade"}, headers=a).json()["code"]
    requests.post(BASE + f"/live/{c}/join", json={"name": "B", "party": P}, headers=b)
    # B's only party member cannot be offered
    assert requests.post(BASE + f"/live/{c}/offer", json={"uid": "b1"}, headers=b).status_code == 422
    assert requests.post(BASE + f"/live/{c}/offer", json={"uid": "nope"}, headers=b).status_code == 404
    # confirm before offers -> 409
    assert requests.post(BASE + f"/live/{c}/confirm", headers=a).status_code == 409
    assert requests.post(BASE + f"/live/{c}/offer", json={"uid": "a2"}, headers=a).status_code == 200
    r = requests.post(BASE + f"/live/{c}/offer", json={"uid": "bx"}, headers=b).json()  # from box
    assert r["offers"]["host"]["s"] == "balsamino" and r["offers"]["guest"]["s"] == "tortellotto"
    r = requests.post(BASE + f"/live/{c}/confirm", headers=a).json()
    assert r["trade_done"] is False and r["confirms"].get("host") is True
    # re-offer resets confirms
    r = requests.post(BASE + f"/live/{c}/offer", json={"uid": "a2"}, headers=a).json()
    assert r["confirms"] == {}
    requests.post(BASE + f"/live/{c}/confirm", headers=a)
    r = requests.post(BASE + f"/live/{c}/confirm", headers=b).json()
    assert r["trade_done"] is True and r["status"] == "done"
    sa = requests.get(BASE + "/save", headers=a).json()["state"]
    sb = requests.get(BASE + "/save", headers=b).json()["state"]
    assert [m["s"] for m in sa["party"]] == ["tortellotto", "tortellotto"]
    assert [m["s"] for m in sb["party"]] == ["parmigianino", "balsamino"] and sb["box"] == []
    assert "balsamino" in sb["caught"] and sb["picked"] == ["me_caramella"]
    # further confirm on a done room -> 409
    assert requests.post(BASE + f"/live/{c}/confirm", headers=a).status_code == 409


def test_third_user_cannot_read_room(users):
    a, b = users
    c = requests.post(BASE + "/live", json={"name": "A", "party": P, "mode": "trade"}, headers=a).json()["code"]
    requests.post(BASE + f"/live/{c}/join", json={"name": "B", "party": P}, headers=b)
    x = reg("x")
    assert requests.get(BASE + f"/live/{c}", headers=x).status_code == 404
    assert requests.post(BASE + f"/live/{c}/join", json={"name": "X", "party": P}, headers=x).status_code == 409


def test_new_species_accepted_in_party(users):
    a, _ = users
    # expansion species must pass server-side SPECIES_IDS validation
    import re
    src = open("/app/frontend/src/game/expansion.ts").read()
    ids = re.findall(r'sp\(\{ id: "([a-z_]+)"', src)
    ids = [i for i in ids if i] or []
    bad = []
    for s in ids:
        r = requests.post(BASE + "/live", json={"name": "A", "party": [mon("z", s, 10)]}, headers=a)
        if r.status_code != 200:
            bad.append(s)
    print("checked", ids)
    assert not bad, f"species rejected by backend: {bad}"
