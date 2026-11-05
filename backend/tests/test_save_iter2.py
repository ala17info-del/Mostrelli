import os
import uuid
import pytest
import requests

BASE_URL = os.environ.get("EXPO_PUBLIC_BACKEND_URL").rstrip("/")


@pytest.fixture(scope="module")
def tok():
    email = f"test_it2_{uuid.uuid4().hex[:8]}@example.com"
    r = requests.post(f"{BASE_URL}/api/auth/register", json={"email": email, "password": "secret123"})
    assert r.status_code == 201, r.text
    t = r.json()["token"]
    yield t
    requests.delete(f"{BASE_URL}/api/save", headers={"Authorization": f"Bearer {t}"})


STATE = {
    "name": "TEST_Iter2", "map": "riviera", "x": 1, "y": 8, "dir": "right",
    "party": [{"uid": "a1", "s": "tortellotto", "lv": 15, "xp": 4090, "hp": 40}],
    "box": [], "seen": ["tortellotto"], "caught": ["tortellotto"], "money": 3000,
    "items": {"vasetto": 5, "brodino": 3, "tortellini": 2, "caffe": 1},
    "defeated": [], "badges": ["Sigillo del Cantiere"], "lastHeal": {"map": "riviera", "x": 2, "y": 7},
}


# Save: new item keys + riviera map persisted
def test_put_get_riviera_items(tok):
    h = {"Authorization": f"Bearer {tok}"}
    r = requests.put(f"{BASE_URL}/api/save", json={"state": STATE}, headers=h)
    assert r.status_code == 200, r.text
    g = requests.get(f"{BASE_URL}/api/save", headers=h).json()["state"]
    assert g["map"] == "riviera"
    assert g["items"] == {"vasetto": 5, "brodino": 3, "tortellini": 2, "caffe": 1}
    assert g["party"][0]["lv"] == 15


# Save: old-shape items (missing tortellini/caffe) accepted
def test_old_items_shape(tok):
    h = {"Authorization": f"Bearer {tok}"}
    st = dict(STATE, items={"vasetto": 1, "brodino": 1})
    assert requests.put(f"{BASE_URL}/api/save", json={"state": st}, headers=h).status_code == 200
    g = requests.get(f"{BASE_URL}/api/save", headers=h).json()["state"]
    assert "caffe" not in g["items"]
