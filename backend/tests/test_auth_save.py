import os
import uuid
import pytest
import requests

BASE_URL = os.environ.get("EXPO_PUBLIC_BACKEND_URL").rstrip("/")


@pytest.fixture(scope="module")
def s():
    return requests.Session()


@pytest.fixture(scope="module")
def new_user(s):
    email = f"test_{uuid.uuid4().hex[:8]}@example.com"
    r = s.post(f"{BASE_URL}/api/auth/register", json={"email": email, "password": "secret123"})
    assert r.status_code == 201, r.text
    d = r.json()
    return {"email": email, "token": d["token"], "id": d["user"]["id"]}


def H(t):
    return {"Authorization": f"Bearer {t}"}


# Health
def test_health(s):
    r = s.get(f"{BASE_URL}/api/")
    assert r.status_code in (200, 404)


# Auth: register
def test_register_returns_token_user(new_user):
    assert new_user["token"] and new_user["id"]


def test_register_duplicate_409(s, new_user):
    r = s.post(f"{BASE_URL}/api/auth/register", json={"email": new_user["email"].upper(), "password": "secret123"})
    assert r.status_code == 409
    assert "registrata" in r.json()["detail"]


def test_register_validation(s):
    assert s.post(f"{BASE_URL}/api/auth/register", json={"email": "bad", "password": "secret123"}).status_code == 422
    assert s.post(f"{BASE_URL}/api/auth/register", json={"email": "a@b.it", "password": "123"}).status_code == 422


# Auth: login
def test_login_seed_user(s):
    r = s.post(f"{BASE_URL}/api/auth/login", json={"email": "test@bologna.it", "password": "tortellini"})
    assert r.status_code == 200
    d = r.json()
    assert d["user"]["email"] == "test@bologna.it" and d["token"]


def test_login_wrong_password(s):
    r = s.post(f"{BASE_URL}/api/auth/login", json={"email": "test@bologna.it", "password": "wrongpass"})
    assert r.status_code == 401


def test_login_case_insensitive(s, new_user):
    r = s.post(f"{BASE_URL}/api/auth/login", json={"email": new_user["email"].upper(), "password": "secret123"})
    assert r.status_code == 200


# Auth: me
def test_me(s, new_user):
    r = s.get(f"{BASE_URL}/api/auth/me", headers=H(new_user["token"]))
    assert r.status_code == 200
    assert r.json() == {"id": new_user["id"], "email": new_user["email"]}


def test_me_unauth(s):
    assert s.get(f"{BASE_URL}/api/auth/me").status_code == 401
    assert s.get(f"{BASE_URL}/api/auth/me", headers=H("garbage")).status_code == 401


# Save CRUD
def test_save_empty(s, new_user):
    r = s.get(f"{BASE_URL}/api/save", headers=H(new_user["token"]))
    assert r.status_code == 200
    assert r.json()["state"] is None


def test_save_put_get_delete(s, new_user):
    st = {"playerName": "TEST_Hero", "map": "bologna", "x": 7, "y": 7, "money": 500}
    r = s.put(f"{BASE_URL}/api/save", json={"state": st}, headers=H(new_user["token"]))
    assert r.status_code == 200 and r.json()["state"] == st and r.json()["updated_at"]
    g = s.get(f"{BASE_URL}/api/save", headers=H(new_user["token"])).json()
    assert g["state"] == st
    st["x"] = 9
    s.put(f"{BASE_URL}/api/save", json={"state": st}, headers=H(new_user["token"]))
    assert s.get(f"{BASE_URL}/api/save", headers=H(new_user["token"])).json()["state"]["x"] == 9
    d = s.delete(f"{BASE_URL}/api/save", headers=H(new_user["token"]))
    assert d.status_code == 200 and d.json()["ok"] is True
    assert s.get(f"{BASE_URL}/api/save", headers=H(new_user["token"])).json()["state"] is None


def test_save_requires_auth(s):
    assert s.get(f"{BASE_URL}/api/save").status_code == 401
    assert s.put(f"{BASE_URL}/api/save", json={"state": {}}).status_code == 401
    assert s.delete(f"{BASE_URL}/api/save").status_code == 401


def test_save_too_large(s, new_user):
    big = {"blob": "x" * 210_000}
    r = s.put(f"{BASE_URL}/api/save", json={"state": big}, headers=H(new_user["token"]))
    assert r.status_code == 413


def test_save_invalid_body(s, new_user):
    r = s.put(f"{BASE_URL}/api/save", json={"state": "notadict"}, headers=H(new_user["token"]))
    assert r.status_code == 422
