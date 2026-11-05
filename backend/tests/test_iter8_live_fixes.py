# Iteration 8: live duel fixes - host resume via /join, item ownership check (422), TTL index on live_duels
import os
import uuid
import pytest
import requests
from pymongo import MongoClient
from dotenv import load_dotenv

load_dotenv("/app/backend/.env")
BASE_URL = (os.environ.get("EXPO_PUBLIC_BACKEND_URL") or os.environ.get("EXPO_BACKEND_URL")).rstrip("/")
PARTY = [{"s": "mortadellone", "lv": 20}, {"s": "tortellotto", "lv": 10}]


def H(t):
    return {"Authorization": f"Bearer {t}"}


def reg(s, items=None):
    email = f"test_it8_{uuid.uuid4().hex[:6]}@example.com"
    r = s.post(f"{BASE_URL}/api/auth/register", json={"email": email, "password": "secret123"})
    assert r.status_code == 201, r.text
    t = r.json()["token"]
    if items is not None:
        assert s.put(f"{BASE_URL}/api/save", json={"state": {"name": "TEST_x", "items": items}}, headers=H(t)).status_code == 200
    return t


@pytest.fixture(scope="module")
def s():
    return requests.Session()


@pytest.fixture(scope="module")
def host(s):
    return reg(s, {"brodino": 1, "gelato": 0})


@pytest.fixture(scope="module")
def guest(s):
    return reg(s)  # no save at all


def active(s, host, guest):
    d = s.post(f"{BASE_URL}/api/live", json={"name": "TEST_H", "party": PARTY}, headers=H(host)).json()
    j = s.post(f"{BASE_URL}/api/live/{d['code']}/join", json={"name": "TEST_G", "party": PARTY}, headers=H(guest))
    assert j.status_code == 200
    return d["code"]


# FIX 4: host self-join
def test_host_selfjoin_waiting_400(s, host):
    d = s.post(f"{BASE_URL}/api/live", json={"name": "TEST_H", "party": PARTY}, headers=H(host)).json()
    r = s.post(f"{BASE_URL}/api/live/{d['code']}/join", json={"name": "TEST_H", "party": PARTY}, headers=H(host))
    assert r.status_code == 400 and "te stesso" in r.json()["detail"]


def test_host_selfjoin_active_returns_state(s, host, guest):
    c = active(s, host, guest)
    s.post(f"{BASE_URL}/api/live/{c}/action", json={"turn": 0, "kind": "move", "move": "colpo"}, headers=H(host))
    r = s.post(f"{BASE_URL}/api/live/{c.lower()}/join", json={"name": "TEST_Other", "party": [{"s": "fanghino", "lv": 3}]}, headers=H(host))
    assert r.status_code == 200, r.text
    d = r.json()
    assert d["side"] == "host" and d["status"] == "active" and d["guest"]["name"] == "TEST_G"
    assert d["my_action"] is True and d["host"]["name"] == "TEST_H"  # not overwritten by join body
    assert d["host"]["party"][0]["s"] == "mortadellone"


def test_host_selfjoin_done_returns_state(s, host, guest):
    c = active(s, host, guest)
    s.post(f"{BASE_URL}/api/live/{c}/action", json={"turn": 0, "kind": "forfeit"}, headers=H(guest))
    r = s.post(f"{BASE_URL}/api/live/{c}/join", json={"name": "TEST_H", "party": PARTY}, headers=H(host))
    assert r.status_code == 200 and r.json()["status"] == "done" and r.json()["winner"] == "host"


# FIX 5: item must be in saved state
def test_item_missing_save_422(s, host, guest):
    c = active(s, host, guest)
    r = s.post(f"{BASE_URL}/api/live/{c}/action", json={"turn": 0, "kind": "item", "item": "brodino", "idx": 0}, headers=H(guest))
    assert r.status_code == 422 and "zaino" in r.json()["detail"]
    assert s.get(f"{BASE_URL}/api/live/{c}", headers=H(guest)).json()["my_action"] is False


def test_item_zero_and_missing_key_422(s, host, guest):
    c = active(s, host, guest)
    for item in ("gelato", "caffe"):
        r = s.post(f"{BASE_URL}/api/live/{c}/action", json={"turn": 0, "kind": "item", "item": item, "idx": 0}, headers=H(host))
        assert r.status_code == 422, (item, r.text)


def test_item_owned_ok(s, host, guest):
    c = active(s, host, guest)
    r = s.post(f"{BASE_URL}/api/live/{c}/action", json={"turn": 0, "kind": "item", "item": "brodino", "idx": 0}, headers=H(host))
    assert r.status_code == 200 and r.json()["my_action"] is True
    r = s.post(f"{BASE_URL}/api/live/{c}/action", json={"turn": 0, "kind": "move", "move": "colpo"}, headers=H(guest))
    assert r.json()["turn"] == 1 and r.json()["log"][0]["host"] == {"kind": "item", "move": None, "idx": 0, "item": "brodino"}


def test_forfeit_still_ok_without_items(s, host, guest):
    c = active(s, host, guest)
    r = s.post(f"{BASE_URL}/api/live/{c}/action", json={"turn": 0, "kind": "forfeit"}, headers=H(guest))
    assert r.status_code == 200 and r.json()["winner"] == "host"


# FIX 5: TTL index + expires_at
def test_ttl_index_and_expires_at(s, host):
    d = s.post(f"{BASE_URL}/api/live", json={"name": "TEST_H", "party": PARTY}, headers=H(host)).json()
    db = MongoClient(os.environ["MONGO_URL"])[os.environ["DB_NAME"]]
    idx = db.live_duels.index_information()
    ttl = [v for v in idx.values() if v["key"] == [("expires_at", 1)]]
    assert ttl and ttl[0].get("expireAfterSeconds") == 0
    doc = db.live_duels.find_one({"code": d["code"]})
    from datetime import datetime, timedelta
    delta = doc["expires_at"] - datetime.utcnow()
    assert timedelta(days=1, hours=23) < delta <= timedelta(days=2)
