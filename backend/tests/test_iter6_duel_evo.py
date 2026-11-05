# Iteration 6: duel party validation (evolved species), result idempotency, auth/save regression
import os
import uuid
import pytest
import requests

BASE_URL = (os.environ.get("EXPO_PUBLIC_BACKEND_URL") or os.environ.get("EXPO_BACKEND_URL")).rstrip("/")
EVOLVED = ["mortadellone", "crescentone", "squacquerona", "zuppissima", "lambruscone", "gabbianazzo", "tandemone", "turbonzo",
           "vaporiera", "zanzarazza", "piadinazza", "passatellaccio"]


def H(t):
    return {"Authorization": f"Bearer {t}"}


def reg(s):
    email = f"test_it6_{uuid.uuid4().hex[:6]}@example.com"
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


# Auth regression
def test_login_main_account(s):
    r = s.post(f"{BASE_URL}/api/auth/login", json={"email": "test@bologna.it", "password": "tortellini"})
    assert r.status_code == 200
    assert r.json()["token"]


# Save roundtrip with new map ids
def test_save_roundtrip_new_map(s, a):
    st = {"map": "altedo", "x": 7, "y": 14, "party": [{"uid": "u1", "s": "mortadellone", "lv": 20, "xp": 8000, "hp": 50}]}
    assert s.put(f"{BASE_URL}/api/save", json={"state": st}, headers=H(a)).status_code == 200
    g = s.get(f"{BASE_URL}/api/save", headers=H(a)).json()["state"]
    assert g["map"] == "altedo" and g["party"][0]["s"] == "mortadellone"


# Duel accepts all evolved species
@pytest.mark.parametrize("sp", EVOLVED)
def test_duel_accepts_evolved(s, a, sp):
    r = s.post(f"{BASE_URL}/api/duel", json={"name": "TEST_Evo", "party": [{"s": sp, "lv": 25}]}, headers=H(a))
    assert r.status_code == 200, r.text
    d = r.json()
    assert d["party"][0]["s"] == sp and d["party"][0]["xp"] == 25 ** 3


@pytest.mark.parametrize("party", [[{"s": "pikachu", "lv": 5}], [{"s": "tortellotto", "lv": 51}], [{"s": "tortellotto", "lv": 0}],
                                   [{"s": "tortellotto", "lv": "5"}], [], [{"s": "tortellotto", "lv": 5}] * 7])
def test_duel_rejects_invalid(s, a, party):
    r = s.post(f"{BASE_URL}/api/duel", json={"name": "TEST_Bad", "party": party}, headers=H(a))
    assert r.status_code == 422, r.text


def test_duel_get_and_result_idempotent(s, a, b):
    r = s.post(f"{BASE_URL}/api/duel", json={"name": "TEST_Ana", "party": [{"s": "crescentone", "lv": 22, "hp": 999, "xp": 1}]}, headers=H(a))
    code = r.json()["code"]
    g = s.get(f"{BASE_URL}/api/duel/{code}", headers=H(b))
    assert g.status_code == 200 and g.json()["party"][0]["hp"] == 1
    r1 = s.post(f"{BASE_URL}/api/duel/{code}/result", json={"won": True}, headers=H(b))
    r2 = s.post(f"{BASE_URL}/api/duel/{code}/result", json={"won": True}, headers=H(b))
    assert r1.status_code == 200, r1.text
    print("second report:", r2.status_code, r2.text)
    d = s.get(f"{BASE_URL}/api/duel/{code}", headers=H(b)).json()
    assert d["losses"] == 1 and d["wins"] == 0


def test_duel_unknown_code(s, b):
    assert s.get(f"{BASE_URL}/api/duel/ZZZZZZ", headers=H(b)).status_code == 404
