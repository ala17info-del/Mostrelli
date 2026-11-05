# Iteration 7: live PvP duel API (/api/live) - create/join/get/action/forfeit/end
import os
import uuid
import pytest
import requests

BASE_URL = (os.environ.get("EXPO_PUBLIC_BACKEND_URL") or os.environ.get("EXPO_BACKEND_URL")).rstrip("/")
PARTY = [{"s": "mortadellone", "lv": 20, "uid": "x", "hp": 999}, {"s": "tortellotto", "lv": 10}]


def H(t):
    return {"Authorization": f"Bearer {t}"}


def reg(s):
    email = f"test_it7_{uuid.uuid4().hex[:6]}@example.com"
    r = s.post(f"{BASE_URL}/api/auth/register", json={"email": email, "password": "secret123"})
    assert r.status_code == 201, r.text
    return r.json()["token"]


@pytest.fixture(scope="module")
def s():
    return requests.Session()


@pytest.fixture(scope="module")
def users(s):
    return [reg(s) for _ in range(3)]


def new_live(s, host, guest=None):
    r = s.post(f"{BASE_URL}/api/live", json={"name": "TEST_Host", "party": PARTY}, headers=H(host))
    assert r.status_code == 200, r.text
    d = r.json()
    if guest:
        j = s.post(f"{BASE_URL}/api/live/{d['code']}/join", json={"name": "TEST_Guest", "party": PARTY}, headers=H(guest))
        assert j.status_code == 200, j.text
        return j.json()
    return d


# Create
def test_create_waiting(s, users):
    d = new_live(s, users[0])
    assert d["status"] == "waiting" and len(d["code"]) == 6 and d["side"] == "host" and d["turn"] == 0
    assert d["guest"] is None and d["log"] == []
    # party sanitised
    assert d["host"]["party"][0] == {"uid": "m0", "s": "mortadellone", "lv": 20, "xp": 8000, "hp": 1}


def test_create_invalid_party(s, users):
    r = s.post(f"{BASE_URL}/api/live", json={"name": "TEST", "party": [{"s": "pikachu", "lv": 5}]}, headers=H(users[0]))
    assert r.status_code == 422
    r = s.post(f"{BASE_URL}/api/live", json={"name": "TEST", "party": PARTY})
    assert r.status_code == 401


# Join rules
def test_join_rules(s, users):
    d = new_live(s, users[0])
    c = d["code"]
    assert s.post(f"{BASE_URL}/api/live/{c}/join", json={"name": "TEST", "party": PARTY}, headers=H(users[0])).status_code == 400
    # non participant GET before join -> 404
    assert s.get(f"{BASE_URL}/api/live/{c}", headers=H(users[1])).status_code == 404
    j = s.post(f"{BASE_URL}/api/live/{c.lower()}/join", json={"name": "TEST_G", "party": PARTY}, headers=H(users[1]))
    assert j.status_code == 200 and j.json()["status"] == "active" and j.json()["side"] == "guest"
    assert j.json()["guest"]["name"] == "TEST_G"
    # rejoin by same guest is idempotent
    assert s.post(f"{BASE_URL}/api/live/{c}/join", json={"name": "TEST_G", "party": PARTY}, headers=H(users[1])).status_code == 200
    assert s.post(f"{BASE_URL}/api/live/{c}/join", json={"name": "TEST", "party": PARTY}, headers=H(users[2])).status_code == 409
    assert s.get(f"{BASE_URL}/api/live/{c}", headers=H(users[2])).status_code == 404
    g = s.get(f"{BASE_URL}/api/live/{c}", headers=H(users[0])).json()
    assert g["status"] == "active" and g["side"] == "host"
    # iter8: host self-join on an ACTIVE duel returns the duel state (resume)
    hj = s.post(f"{BASE_URL}/api/live/{c}/join", json={"name": "TEST", "party": PARTY}, headers=H(users[0]))
    assert hj.status_code == 200 and hj.json()["side"] == "host" and hj.json()["status"] == "active"


def test_join_unknown(s, users):
    assert s.post(f"{BASE_URL}/api/live/ZZZZZZ/join", json={"name": "T", "party": PARTY}, headers=H(users[1])).status_code == 404


def test_action_on_waiting_409(s, users):
    d = new_live(s, users[0])
    r = s.post(f"{BASE_URL}/api/live/{d['code']}/action", json={"turn": 0, "kind": "move", "move": "x"}, headers=H(users[0]))
    assert r.status_code == 409


# Turn sealing
def test_turn_sealing(s, users):
    d = new_live(s, users[0], users[1])
    c = d["code"]
    r = s.post(f"{BASE_URL}/api/live/{c}/action", json={"turn": 0, "kind": "move", "move": "colpo"}, headers=H(users[0]))
    assert r.status_code == 200 and r.json()["my_action"] is True and r.json()["turn"] == 0
    g = s.get(f"{BASE_URL}/api/live/{c}", headers=H(users[1])).json()
    assert g["their_action"] is True and g["my_action"] is False
    # wrong turn
    assert s.post(f"{BASE_URL}/api/live/{c}/action", json={"turn": 5, "kind": "switch", "idx": 1}, headers=H(users[1])).status_code == 409
    r = s.post(f"{BASE_URL}/api/live/{c}/action", json={"turn": 0, "kind": "switch", "idx": 1}, headers=H(users[1]))
    assert r.status_code == 200
    d2 = r.json()
    assert d2["turn"] == 1 and len(d2["log"]) == 1
    e = d2["log"][0]
    assert e["turn"] == 0 and e["host"]["kind"] == "move" and e["host"]["move"] == "colpo"
    assert e["guest"]["kind"] == "switch" and e["guest"]["idx"] == 1 and isinstance(e["seed"], int)
    assert d2["my_action"] is False and d2["their_action"] is False
    # host sees the same log
    h = s.get(f"{BASE_URL}/api/live/{c}", headers=H(users[0])).json()
    assert h["log"] == d2["log"]
    # item action (iter8: requires the item in the saved state)
    s.put(f"{BASE_URL}/api/save", json={"state": {"items": {"brodino": 2}}}, headers=H(users[0]))
    r = s.post(f"{BASE_URL}/api/live/{c}/action", json={"turn": 1, "kind": "item", "item": "brodino", "idx": 0}, headers=H(users[0]))
    assert r.status_code == 200
    r = s.post(f"{BASE_URL}/api/live/{c}/action", json={"turn": 1, "kind": "move", "move": "colpo"}, headers=H(users[1]))
    assert r.json()["turn"] == 2 and r.json()["log"][1]["host"]["item"] == "brodino"


def test_double_submit_ignored(s, users):
    d = new_live(s, users[0], users[1])
    c = d["code"]
    s.post(f"{BASE_URL}/api/live/{c}/action", json={"turn": 0, "kind": "move", "move": "a"}, headers=H(users[0]))
    s.post(f"{BASE_URL}/api/live/{c}/action", json={"turn": 0, "kind": "move", "move": "b"}, headers=H(users[0]))
    r = s.post(f"{BASE_URL}/api/live/{c}/action", json={"turn": 0, "kind": "move", "move": "z"}, headers=H(users[1]))
    assert r.json()["log"][0]["host"]["move"] == "a"


# Validation
@pytest.mark.parametrize("body", [
    {"turn": 0, "kind": "move"},
    {"turn": 0, "kind": "switch"},
    {"turn": 0, "kind": "item", "item": "brodino"},
    {"turn": 0, "kind": "item", "idx": 0},
    {"turn": 0, "kind": "item", "item": "vasetto", "idx": 0},
    {"turn": 0, "kind": "dance"},
    {"turn": 0, "kind": "switch", "idx": 9},
])
def test_action_validation_422(s, users, body):
    d = new_live(s, users[0], users[1])
    r = s.post(f"{BASE_URL}/api/live/{d['code']}/action", json=body, headers=H(users[0]))
    assert r.status_code == 422, r.text


# Forfeit and end
def test_forfeit(s, users):
    d = new_live(s, users[0], users[1])
    c = d["code"]
    r = s.post(f"{BASE_URL}/api/live/{c}/action", json={"turn": 0, "kind": "forfeit"}, headers=H(users[1]))
    assert r.status_code == 200 and r.json()["status"] == "done" and r.json()["winner"] == "host"
    h = s.get(f"{BASE_URL}/api/live/{c}", headers=H(users[0])).json()
    assert h["status"] == "done" and h["winner"] == "host"
    assert s.post(f"{BASE_URL}/api/live/{c}/action", json={"turn": 0, "kind": "move", "move": "a"}, headers=H(users[0])).status_code == 409
    # end after done doesn't override winner
    e = s.post(f"{BASE_URL}/api/live/{c}/end", json={"winner": "guest"}, headers=H(users[1])).json()
    assert e["winner"] == "host"


def test_end(s, users):
    d = new_live(s, users[0], users[1])
    c = d["code"]
    assert s.post(f"{BASE_URL}/api/live/{c}/end", json={"winner": "nobody"}, headers=H(users[0])).status_code == 422
    assert s.post(f"{BASE_URL}/api/live/{c}/end", json={"winner": "draw"}, headers=H(users[2])).status_code == 404
    r = s.post(f"{BASE_URL}/api/live/{c}/end", json={"winner": "guest"}, headers=H(users[0]))
    assert r.status_code == 200 and r.json()["status"] == "done" and r.json()["winner"] == "guest"


# Regression
def test_login_main_account(s):
    r = s.post(f"{BASE_URL}/api/auth/login", json={"email": "test@bologna.it", "password": "tortellini"})
    assert r.status_code == 200 and r.json()["token"]
