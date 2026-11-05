# Iteration 5: friend duels (share code) + Sign in with Apple 401 + email login regression
import os
import uuid
import pytest
import requests

BASE_URL = (os.environ.get("EXPO_PUBLIC_BACKEND_URL") or os.environ.get("EXPO_BACKEND_URL")).rstrip("/")
PARTY = [{"uid": "t1", "s": "tortellotto", "lv": 5}]
CLEAN = [{"uid": "t1", "s": "tortellotto", "lv": 5, "xp": 125, "hp": 1}]  # server sanitises party (iter6)


def H(t):
    return {"Authorization": f"Bearer {t}"}


def reg(s):
    email = f"test_it5_{uuid.uuid4().hex[:6]}@example.com"
    r = s.post(f"{BASE_URL}/api/auth/register", json={"email": email, "password": "secret123"})
    assert r.status_code == 201, r.text
    return r.json()["token"]


@pytest.fixture(scope="module")
def s():
    return requests.Session()


@pytest.fixture(scope="module")
def a(s):
    return reg(s)


@pytest.fixture(scope="module")
def b(s):
    return reg(s)


@pytest.fixture(scope="module")
def duel(s, a):
    r = s.post(f"{BASE_URL}/api/duel", json={"name": "TEST_Ana", "party": PARTY}, headers=H(a))
    assert r.status_code == 200, r.text
    return r.json()


# Email login regression
def test_email_login(s):
    r = s.post(f"{BASE_URL}/api/auth/login", json={"email": "test@bologna.it", "password": "tortellini"})
    assert r.status_code == 200 and r.json()["token"]


def test_email_login_wrong(s):
    r = s.post(f"{BASE_URL}/api/auth/login", json={"email": "test@bologna.it", "password": "wrongpass99"})
    assert r.status_code == 401


# Apple
def test_apple_invalid_token(s):
    r = s.post(f"{BASE_URL}/api/auth/apple", json={"identity_token": "abc.def.ghi"})
    assert r.status_code == 401, r.text


def test_apple_garbage_token(s):
    r = s.post(f"{BASE_URL}/api/auth/apple", json={"identity_token": "garbage"})
    assert r.status_code == 401, r.text


def test_apple_missing_token(s):
    r = s.post(f"{BASE_URL}/api/auth/apple", json={})
    assert r.status_code == 422


# Duel create
def test_duel_create(duel):
    assert len(duel["code"]) == 6 and duel["name"] == "TEST_Ana"
    assert duel["wins"] == 0 and duel["losses"] == 0 and duel["party"] == CLEAN
    assert "_id" not in duel and "user_id" not in duel


def test_duel_create_requires_auth(s):
    r = s.post(f"{BASE_URL}/api/duel", json={"name": "x", "party": PARTY})
    assert r.status_code in (401, 403)


def test_duel_create_validation(s, a):
    assert s.post(f"{BASE_URL}/api/duel", json={"name": "", "party": PARTY}, headers=H(a)).status_code == 422
    assert s.post(f"{BASE_URL}/api/duel", json={"name": "x", "party": []}, headers=H(a)).status_code == 422
    assert s.post(f"{BASE_URL}/api/duel", json={"name": "x" * 21, "party": PARTY}, headers=H(a)).status_code == 422
    assert s.post(f"{BASE_URL}/api/duel", json={"name": "x", "party": PARTY * 7}, headers=H(a)).status_code == 422


def test_duel_mine(s, a, duel):
    r = s.get(f"{BASE_URL}/api/duel/mine", headers=H(a))
    assert r.status_code == 200
    assert duel["code"] in [d["code"] for d in r.json()]


def test_duel_get_own_400(s, a, duel):
    r = s.get(f"{BASE_URL}/api/duel/{duel['code']}", headers=H(a))
    assert r.status_code == 400


def test_duel_get_unknown_404(s, b):
    r = s.get(f"{BASE_URL}/api/duel/ZZZZZ1", headers=H(b))
    assert r.status_code == 404


def test_duel_get_other_lowercase(s, b, duel):
    r = s.get(f"{BASE_URL}/api/duel/{duel['code'].lower()}", headers=H(b))
    assert r.status_code == 200 and r.json()["party"] == CLEAN


def test_duel_result_increments(s, a, b, duel):
    c = duel["code"]
    assert s.post(f"{BASE_URL}/api/duel/{c}/result", json={"won": True}, headers=H(b)).status_code == 200
    assert s.post(f"{BASE_URL}/api/duel/{c}/result", json={"won": False}, headers=H(b)).status_code == 200
    assert s.post(f"{BASE_URL}/api/duel/{c}/result", json={"won": False}, headers=H(b)).status_code == 200
    d = [x for x in s.get(f"{BASE_URL}/api/duel/mine", headers=H(a)).json() if x["code"] == c][0]
    # iter6: only the first report per user counts
    assert d["losses"] == 1 and d["wins"] == 0


def test_duel_result_own_or_unknown_404(s, a, b, duel):
    assert s.post(f"{BASE_URL}/api/duel/{duel['code']}/result", json={"won": True}, headers=H(a)).status_code == 404
    assert s.post(f"{BASE_URL}/api/duel/QQQQQ9/result", json={"won": True}, headers=H(b)).status_code == 404
