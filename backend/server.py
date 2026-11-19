import asyncio
import secrets
from contextlib import suppress
from fastapi import FastAPI, APIRouter, HTTPException, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
from pymongo import ASCENDING, IndexModel
from pymongo.errors import DuplicateKeyError
from bson import ObjectId
import os
import json
import logging
import bcrypt
import jwt
from pathlib import Path
from pydantic import BaseModel, EmailStr, Field
from typing import Any, Optional
from datetime import datetime, timezone, timedelta


ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]
JWT_SECRET = os.environ['JWT_SECRET']
JWT_ALG = "HS256"
JWT_DAYS = 30

INDEXES: dict[str, list[IndexModel]] = {
    "users": [IndexModel([("email", ASCENDING)], name="email", unique=True), IndexModel([("apple_sub", ASCENDING)], name="apple_sub", unique=True, sparse=True)],
    "saves": [IndexModel([("user_id", ASCENDING)], name="user_id", unique=True)],
    "duels": [IndexModel([("code", ASCENDING)], name="code", unique=True), IndexModel([("user_id", ASCENDING), ("created_at", ASCENDING)], name="user_created")],
    "live_duels": [IndexModel([("code", ASCENDING)], name="code", unique=True), IndexModel([("expires_at", ASCENDING)], name="ttl", expireAfterSeconds=0)],
    "match_queue": [IndexModel([("user_id", ASCENDING)], name="user_id"), IndexModel([("status", ASCENDING), ("created_at", ASCENDING)], name="status_created"), IndexModel([("expires_at", ASCENDING)], name="ttl", expireAfterSeconds=0)],
    "presence": [IndexModel([("user_id", ASCENDING)], name="user_id", unique=True), IndexModel([("map", ASCENDING), ("at", ASCENDING)], name="map_at"), IndexModel([("expires_at", ASCENDING)], name="ttl", expireAfterSeconds=0)],
    "invites": [IndexModel([("to_id", ASCENDING)], name="to_id"), IndexModel([("expires_at", ASCENDING)], name="ttl", expireAfterSeconds=0)],
}


async def ensure_indexes() -> None:
    for collection, models in INDEXES.items():
        for model in models:
            try:
                await db[collection].create_indexes([model])
            except Exception as exc:
                logging.getLogger(__name__).error("ensure_indexes(%s.%s): %s", collection, model.document["name"], exc)

app = FastAPI()


@app.get("/health", include_in_schema=False)
@app.head("/health", include_in_schema=False)
async def health():
    return {"status": "ok"}

api_router = APIRouter(prefix="/api")
bearer = HTTPBearer(auto_error=False)


class Credentials(BaseModel):
    email: EmailStr
    password: str = Field(min_length=6, max_length=128)


class PublicUser(BaseModel):
    id: str
    email: str


class AuthOut(BaseModel):
    token: str
    user: PublicUser


class SaveIn(BaseModel):
    state: dict[str, Any]


class SaveOut(BaseModel):
    state: Optional[dict[str, Any]] = None
    updated_at: Optional[str] = None


def issue_token(user_id: str) -> str:
    now = datetime.now(timezone.utc)
    return jwt.encode({"sub": user_id, "iat": now, "exp": now + timedelta(days=JWT_DAYS)}, JWT_SECRET, algorithm=JWT_ALG)


async def current_user(creds: HTTPAuthorizationCredentials = Depends(bearer)) -> dict:
    if not creds:
        raise HTTPException(status_code=401, detail="Non autenticato")
    try:
        payload = jwt.decode(creds.credentials, JWT_SECRET, algorithms=[JWT_ALG])
        uid = payload.get("sub")
        if not uid or not ObjectId.is_valid(uid):
            raise ValueError()
    except (jwt.InvalidTokenError, ValueError):
        raise HTTPException(status_code=401, detail="Sessione scaduta, accedi di nuovo")
    user = await db.users.find_one({"_id": ObjectId(uid)})
    if not user:
        raise HTTPException(status_code=401, detail="Utente non trovato")
    return user


def public(user: dict) -> PublicUser:
    return PublicUser(id=str(user["_id"]), email=user["email"])


@api_router.post("/auth/register", response_model=AuthOut, status_code=201)
async def register(body: Credentials):
    email = str(body.email).lower().strip()
    doc = {
        "email": email,
        "password_hash": bcrypt.hashpw(body.password.encode(), bcrypt.gensalt()).decode(),
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    try:
        res = await db.users.insert_one(doc)
    except DuplicateKeyError:
        raise HTTPException(status_code=409, detail="Email già registrata")
    doc["_id"] = res.inserted_id
    return AuthOut(token=issue_token(str(res.inserted_id)), user=public(doc))


class AppleIn(BaseModel):
    identity_token: str
    email: Optional[str] = None
    full_name: Optional[str] = None


APPLE_AUDIENCES = [a.strip() for a in os.environ.get("APPLE_AUDIENCES", "").split(",") if a.strip()]
_apple_jwks = jwt.PyJWKClient("https://appleid.apple.com/auth/keys")


@api_router.post("/auth/apple", response_model=AuthOut)
async def apple_login(body: AppleIn):
    try:
        key = (await asyncio.to_thread(_apple_jwks.get_signing_key_from_jwt, body.identity_token)).key
        claims = jwt.decode(body.identity_token, key, algorithms=["RS256"], audience=APPLE_AUDIENCES, issuer="https://appleid.apple.com")
    except Exception:
        raise HTTPException(status_code=401, detail="Accesso con Apple non valido")
    sub = claims["sub"]
    user = await db.users.find_one({"apple_sub": sub})
    if not user:
        verified_email = claims.get("email")
        email = (verified_email or f"apple_{sub}@privaterelay.local").lower()
        existing = await db.users.find_one({"email": email}) if verified_email else None
        if existing:
            await db.users.update_one({"_id": existing["_id"]}, {"$set": {"apple_sub": sub}})
            user = existing
        else:
            doc = {"email": email, "apple_sub": sub, "full_name": body.full_name, "created_at": datetime.now(timezone.utc).isoformat()}
            res = await db.users.insert_one(doc)
            doc["_id"] = res.inserted_id
            user = doc
    return AuthOut(token=issue_token(str(user["_id"])), user=public(user))


@api_router.post("/auth/login", response_model=AuthOut)
async def login(body: Credentials):
    email = str(body.email).lower().strip()
    user = await db.users.find_one({"email": email})
    if not user or not user.get("password_hash") or not bcrypt.checkpw(body.password.encode(), user["password_hash"].encode()):
        raise HTTPException(status_code=401, detail="Email o password errati")
    return AuthOut(token=issue_token(str(user["_id"])), user=public(user))


@api_router.get("/auth/me", response_model=PublicUser)
async def me(user: dict = Depends(current_user)):
    return public(user)


@api_router.get("/save", response_model=SaveOut)
async def get_save(user: dict = Depends(current_user)):
    doc = await db.saves.find_one({"user_id": str(user["_id"])}, {"_id": 0})
    if not doc:
        return SaveOut()
    return SaveOut(state=doc["state"], updated_at=doc["updated_at"])


@api_router.put("/save", response_model=SaveOut)
async def put_save(body: SaveIn, user: dict = Depends(current_user)):
    if len(json.dumps(body.state)) > 200_000:
        raise HTTPException(status_code=413, detail="Salvataggio troppo grande")
    now = datetime.now(timezone.utc).isoformat()
    await db.saves.update_one(
        {"user_id": str(user["_id"])},
        {"$set": {"state": body.state, "updated_at": now}},
        upsert=True,
    )
    return SaveOut(state=body.state, updated_at=now)


@api_router.delete("/save")
async def delete_save(user: dict = Depends(current_user)):
    await db.saves.delete_one({"user_id": str(user["_id"])})
    return {"ok": True}


class DuelIn(BaseModel):
    name: str = Field(min_length=1, max_length=20)
    party: list[dict[str, Any]] = Field(min_length=1, max_length=6)


class DuelResult(BaseModel):
    won: bool


def duel_out(d: dict) -> dict:
    return {"code": d["code"], "name": d["name"], "party": d["party"], "wins": d.get("wins", 0), "losses": d.get("losses", 0), "created_at": d["created_at"]}


SPECIES_IDS = {
    "anguillina", "anguillona", "anolino", "anolone", "balsamino", "balsamone", "biciclone", "bollicino", "bollicione", "bombolino", "bombolone", "canalino", "cappellaccio", "castagnino", "castagnone", "ceramichino", "ceramicone", "ciliegina", "ciliegiona", "cinghialone", "cinghialotto", "crescentino", "crescentone", "culatellino", "culatellone", "discotecco", "erbazzino", "erbazzone", "fanghino", "fangone", "gabbianazzo", "gabbianone", "gnocchino", "gnoccone", "grappolino", "lambruschino", "lambruscone", "lisciolo", "liscione", "medusella", "mortadellone", "mortazzone", "mosaichino", "mosaicone", "motorino", "motorissimo", "motorone", "nebbiolone", "ocarinissimo", "ocarino", "ocarinone", "ombrellone", "parmigianino", "parmigione", "passatellaccio", "passatellone", "piadinazza", "inutilino", "piadinazza", "piadinetta", "piadinona", "piadinissima", "piadinone", "pioppino", "pioppone", "pisarello", "pisarone", "pistonzo", "portichino", "prosciuttino", "prosciuttone", "rossocorsa", "salamone", "salinello", "salinone", "scooterone", "squacquerona", "squacquerone", "tandemone", "tartufino", "tartufone", "tortellone", "tortellotto", "turbonzo", "umarellino", "umarellone", "vaporella", "vaporiera", "vendemmione", "vongolino", "zanzarazza", "zanzarone", "zuppissima", "zuppone",
}


@api_router.post("/duel")
async def create_duel(body: DuelIn, user: dict = Depends(current_user)):
    clean = []
    for m in body.party:
        s, lv = m.get("s"), m.get("lv")
        if s not in SPECIES_IDS or not isinstance(lv, int) or isinstance(lv, bool) or not 1 <= lv <= 100:
            raise HTTPException(status_code=422, detail="Squadra non valida")
        clean.append({"uid": str(m.get("uid", ""))[:16], "s": s, "lv": lv, "xp": xp_for(lv), "hp": 1})
    body.party = clean
    import secrets
    alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"
    for _ in range(10):
        code = "".join(secrets.choice(alphabet) for _ in range(6))
        if not await db.duels.find_one({"code": code}):
            break
    doc = {"code": code, "user_id": str(user["_id"]), "name": body.name, "party": body.party, "wins": 0, "losses": 0,
           "created_at": datetime.now(timezone.utc).isoformat()}
    await db.duels.insert_one(doc)
    return duel_out(doc)


@api_router.get("/duel/mine")
async def my_duels(user: dict = Depends(current_user)):
    docs = await db.duels.find({"user_id": str(user["_id"])}, {"_id": 0}).sort("created_at", -1).to_list(20)
    return [duel_out(d) for d in docs]


@api_router.get("/duel/{code}")
async def get_duel(code: str, user: dict = Depends(current_user)):
    d = await db.duels.find_one({"code": code.upper().strip()}, {"_id": 0})
    if not d:
        raise HTTPException(status_code=404, detail="Codice sfida non trovato")
    if d["user_id"] == str(user["_id"]):
        raise HTTPException(status_code=400, detail="Non puoi sfidare la tua stessa squadra!")
    return duel_out(d)


@api_router.post("/duel/{code}/result")
async def duel_result(code: str, body: DuelResult, user: dict = Depends(current_user)):
    d = await db.duels.find_one({"code": code.upper().strip()})
    if not d or d["user_id"] == str(user["_id"]):
        raise HTTPException(status_code=404, detail="Codice sfida non trovato")
    uid = str(user["_id"])
    res = await db.duels.update_one({"_id": d["_id"], "reported_by": {"$ne": uid}}, {"$inc": {"losses" if body.won else "wins": 1}, "$push": {"reported_by": uid}})
    if res.modified_count == 0:
        return {"ok": True, "counted": False}
    return {"ok": True}


# --- Live duels: both players pick an action each turn; when both are in, the turn is sealed with a
# shared random seed so both clients resolve it identically.
class LiveIn(BaseModel):
    name: str = Field(min_length=1, max_length=20)
    party: list[dict[str, Any]] = Field(min_length=1, max_length=6)
    mode: str = Field(default="pvp", pattern="^(pvp|coop|trade)$")
    boss: Optional[str] = Field(default=None, pattern="^[a-z_]{2,30}$")


class LiveAction(BaseModel):
    turn: int = Field(ge=0)
    kind: str = Field(pattern="^(move|switch|item|forfeit|pass)$")
    move: Optional[str] = Field(default=None, max_length=30)
    idx: Optional[int] = Field(default=None, ge=0, le=5)
    item: Optional[str] = Field(default=None, pattern="^(brodino|tortellini|digestivo|gelato|caffe)$")
    # Timed commands: how well the player struck and guarded this turn.
    grade: Optional[str] = Field(default=None, pattern="^(perfetto|buono|mancato)$")
    guard: Optional[str] = Field(default=None, pattern="^(perfetto|buono|mancato)$")


def xp_for(lv: int) -> int:
    """Same curve as the game: lv^3 up to 50, then gentler up to 100."""
    if lv <= 50:
        return lv ** 3
    k = lv - 50
    return 125000 + 1000 * k + 15 * k * (k + 1)


def clean_party(party: list[dict[str, Any]]) -> list[dict[str, Any]]:
    out = []
    for i, m in enumerate(party):
        s, lv = m.get("s"), m.get("lv")
        if s not in SPECIES_IDS or not isinstance(lv, int) or isinstance(lv, bool) or not 1 <= lv <= 100:
            raise HTTPException(status_code=422, detail="Squadra non valida")
        out.append({"uid": f"m{i}", "s": s, "lv": lv, "xp": xp_for(lv), "hp": 1})
    return out


async def live_update(filt: dict, upd: dict):
    """update_one on live_duels that also bumps `rev`, which wakes up clients waiting in /wait."""
    upd = dict(upd)
    inc = dict(upd.get("$inc", {}))
    inc["rev"] = 1
    upd["$inc"] = inc
    return await db.live_duels.update_one(filt, upd)


def live_out(d: dict, uid: str) -> dict:
    side = "host" if d["host_id"] == uid else "guest"
    other = "guest" if side == "host" else "host"
    return {
        "code": d["code"], "side": side, "status": d["status"], "turn": d["turn"],
        "host": {"name": d["host_name"], "party": d["host_party"]},
        "guest": {"name": d.get("guest_name"), "party": d.get("guest_party")} if d.get("guest_id") else None,
        "log": d["log"], "my_action": d["actions"].get(side) is not None, "their_action": d["actions"].get(other) is not None,
        "winner": d.get("winner"), "mode": d.get("mode", "pvp"), "boss": d.get("boss"),
        "offers": d.get("offers", {}), "confirms": d.get("confirms", {}), "trade_done": d.get("trade_done", False),
        "rev": d.get("rev", 0), "chat": (d.get("chat") or [])[-8:],
    }


async def live_doc(code: str, uid: str) -> dict:
    d = await db.live_duels.find_one({"code": code.upper().strip()}, {"_id": 0})
    if not d or uid not in (d["host_id"], d.get("guest_id")):
        raise HTTPException(status_code=404, detail="Sfida in diretta non trovata")
    return d


@api_router.post("/live")
async def live_create(body: LiveIn, user: dict = Depends(current_user)):
    import secrets
    alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"
    if body.mode == "coop" and not body.boss:
        raise HTTPException(status_code=422, detail="Scegli un avversario per la sfida in coppia")
    doc = {"host_id": str(user["_id"]), "host_name": body.name, "host_party": clean_party(body.party), "guest_id": None,
           "mode": body.mode, "boss": body.boss if body.mode == "coop" else None, "offers": {}, "confirms": {},
           "status": "waiting", "turn": 0, "actions": {"host": None, "guest": None}, "log": [], "winner": None,
           "created_at": datetime.now(timezone.utc).isoformat(), "expires_at": datetime.now(timezone.utc) + timedelta(days=2)}
    for _ in range(10):
        doc["code"] = "".join(secrets.choice(alphabet) for _ in range(6))
        try:
            await db.live_duels.insert_one(dict(doc))
            break
        except DuplicateKeyError:
            continue
    return live_out(doc, doc["host_id"])


@api_router.post("/live/{code}/join")
async def live_join(code: str, body: LiveIn, user: dict = Depends(current_user)):
    uid = str(user["_id"])
    c = code.upper().strip()
    d = await db.live_duels.find_one({"code": c})
    if not d:
        raise HTTPException(status_code=404, detail="Codice sfida non trovato")
    if d["host_id"] == uid:
        if d["status"] == "waiting":
            raise HTTPException(status_code=400, detail="Non puoi sfidare te stesso!")
        return live_out(d, uid)  # host coming back to a running duel
    if d.get("guest_id") and d["guest_id"] != uid:
        raise HTTPException(status_code=409, detail="Questa sfida è già cominciata con un altro giocatore")
    if not d.get("guest_id"):
        res = await live_update({"code": c, "guest_id": None},
                                             {"$set": {"guest_id": uid, "guest_name": body.name, "guest_party": clean_party(body.party), "status": "active"}})
        if res.modified_count == 0:
            raise HTTPException(status_code=409, detail="Questa sfida è già cominciata con un altro giocatore")
    return live_out(await live_doc(c, uid), uid)


@api_router.get("/live/{code}")
async def live_get(code: str, user: dict = Depends(current_user)):
    uid = str(user["_id"])
    return live_out(await live_doc(code, uid), uid)


@api_router.post("/live/{code}/action")
async def live_action(code: str, body: LiveAction, user: dict = Depends(current_user)):
    import secrets
    uid = str(user["_id"])
    d = await live_doc(code, uid)
    side = "host" if d["host_id"] == uid else "guest"
    other = "guest" if side == "host" else "host"
    if d["status"] != "active":
        raise HTTPException(status_code=409, detail="La sfida non è in corso")
    if body.kind == "forfeit":
        await live_update({"code": d["code"], "status": "active"}, {"$set": {"status": "done", "winner": other, "forfeit": side}})
        return live_out(await live_doc(code, uid), uid)
    if body.turn != d["turn"]:
        raise HTTPException(status_code=409, detail="Turno non valido")
    if body.kind == "move" and not body.move or body.kind == "switch" and body.idx is None or body.kind == "item" and (body.item is None or body.idx is None):
        raise HTTPException(status_code=422, detail="Azione non valida")
    if body.kind == "item":
        sv = await db.saves.find_one({"user_id": uid}, {"state.items": 1})
        if (((sv or {}).get("state") or {}).get("items") or {}).get(body.item, 0) <= 0:
            raise HTTPException(status_code=422, detail="Non hai questo strumento nello zaino")
    act = body.model_dump(exclude={"turn"})
    await live_update({"code": d["code"], "turn": body.turn, f"actions.{side}": None}, {"$set": {f"actions.{side}": act}})
    cur = await db.live_duels.find_one({"code": d["code"]})
    if cur["turn"] == body.turn and cur["actions"]["host"] and cur["actions"]["guest"]:
        entry = {"turn": body.turn, "host": cur["actions"]["host"], "guest": cur["actions"]["guest"], "seed": secrets.randbelow(2**31)}
        await live_update(
            {"code": d["code"], "turn": body.turn, "actions.host": {"$ne": None}, "actions.guest": {"$ne": None}},
            {"$push": {"log": entry}, "$set": {"actions": {"host": None, "guest": None}}, "$inc": {"turn": 1}},
        )
    return live_out(await live_doc(code, uid), uid)


class TradeOffer(BaseModel):
    uid: str = Field(min_length=1, max_length=40)


def find_mon(state: dict, uid: str):
    for where in ("party", "box"):
        for i, m in enumerate(state.get(where) or []):
            if m.get("uid") == uid:
                return where, i, m
    return None, -1, None


async def trade_doc(code: str, uid: str) -> tuple[dict, str]:
    d = await live_doc(code, uid)
    if d.get("mode") != "trade":
        raise HTTPException(status_code=400, detail="Questa stanza non è per gli scambi")
    if d["status"] != "active":
        raise HTTPException(status_code=409, detail="Lo scambio non è in corso")
    return d, "host" if d["host_id"] == uid else "guest"


@api_router.post("/live/{code}/offer")
async def trade_offer(code: str, body: TradeOffer, user: dict = Depends(current_user)):
    uid = str(user["_id"])
    d, side = await trade_doc(code, uid)
    sv = await db.saves.find_one({"user_id": uid}, {"state": 1}) or {}
    state = sv.get("state") or {}
    where, _, mon = find_mon(state, body.uid)
    if not mon:
        raise HTTPException(status_code=404, detail="Mostrello non trovato nel tuo salvataggio")
    if where == "party" and len(state.get("party") or []) < 2:
        raise HTTPException(status_code=422, detail="Non puoi scambiare il tuo unico Mostrello in squadra")
    snap = {"uid": mon["uid"], "s": mon.get("s"), "lv": mon.get("lv"), "xp": mon.get("xp"), "hp": mon.get("hp")}
    await live_update({"code": d["code"]}, {"$set": {f"offers.{side}": snap, "confirms": {}}})
    return live_out(await live_doc(code, uid), uid)


@api_router.post("/live/{code}/confirm")
async def trade_confirm(code: str, user: dict = Depends(current_user)):
    uid = str(user["_id"])
    d, side = await trade_doc(code, uid)
    if not d.get("offers", {}).get("host") or not d.get("offers", {}).get("guest"):
        raise HTTPException(status_code=409, detail="Servono le offerte di entrambi")
    await live_update({"code": d["code"]}, {"$set": {f"confirms.{side}": True}})
    d = await db.live_duels.find_one({"code": d["code"]})
    if d["confirms"].get("host") and d["confirms"].get("guest") and d["status"] == "active":
        # Lock the room first so the swap can happen only once.
        res = await live_update({"code": d["code"], "status": "active"}, {"$set": {"status": "swapping"}})
        if res.modified_count:
            ids = {"host": d["host_id"], "guest": d["guest_id"]}
            saves = {k: (await db.saves.find_one({"user_id": v}) or {}).get("state") or {} for k, v in ids.items()}
            for k in ("host", "guest"):
                where, i, mon = find_mon(saves[k], d["offers"][k]["uid"])
                if not mon:
                    await live_update({"code": d["code"]}, {"$set": {"status": "active", "confirms": {}}})
                    raise HTTPException(status_code=409, detail="Uno dei Mostrelli non è più disponibile")
                saves[k][where].pop(i)
            for k, o in (("host", "guest"), ("guest", "host")):
                got = dict(next(m for m in [d["offers"][o]]))
                got["uid"] = secrets.token_hex(4)
                st = saves[k]
                if len(st.get("party") or []) < 6:
                    st.setdefault("party", []).append(got)
                else:
                    st.setdefault("box", []).append(got)
                for f in ("caught", "seen"):
                    if got["s"] not in (st.get(f) or []):
                        st.setdefault(f, []).append(got["s"])
            now = datetime.now(timezone.utc).isoformat()
            for k, v in ids.items():
                await db.saves.update_one({"user_id": v}, {"$set": {"state": saves[k], "updated_at": now}})
            await live_update({"code": d["code"]}, {"$set": {"status": "done", "trade_done": True}})
    return live_out(await live_doc(code, uid), uid)


@api_router.get("/live/{code}/wait")
async def live_wait(code: str, rev: int = 0, user: dict = Depends(current_user)):
    """Long poll: answers as soon as the room changes (or after ~20 s), so turns arrive almost instantly
    without hammering the server and without needing WebSockets from the hosting."""
    uid = str(user["_id"])
    c = code.upper().strip()
    for _ in range(80):
        d = await db.live_duels.find_one({"code": c}, {"rev": 1, "host_id": 1, "guest_id": 1})
        if not d or uid not in (d["host_id"], d.get("guest_id")):
            raise HTTPException(status_code=404, detail="Sfida in diretta non trovata")
        if d.get("rev", 0) != rev:
            break
        await asyncio.sleep(0.25)
    return live_out(await live_doc(code, uid), uid)


QUICK_CHAT = 12  # number of preset phrases on the client (no free text: nothing to moderate)


class ChatIn(BaseModel):
    m: int = Field(ge=0, lt=QUICK_CHAT)


@api_router.post("/live/{code}/chat")
async def live_chat(code: str, body: ChatIn, user: dict = Depends(current_user)):
    uid = str(user["_id"])
    d = await live_doc(code, uid)
    side = "host" if d["host_id"] == uid else "guest"
    msg = {"side": side, "m": body.m, "at": datetime.now(timezone.utc).isoformat()}
    await live_update({"code": d["code"]}, {"$push": {"chat": {"$each": [msg], "$slice": -20}}})
    return live_out(await live_doc(code, uid), uid)


# --- Quick match: a public queue that pairs two players with similar teams.
def party_avg(party: list[dict[str, Any]]) -> float:
    return sum(m["lv"] for m in party) / max(1, len(party))


async def new_room(host: dict, guest: Optional[dict] = None, mode: str = "pvp") -> dict:
    alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"
    now = datetime.now(timezone.utc)
    doc = {"host_id": host["id"], "host_name": host["name"], "host_party": host["party"], "guest_id": None,
           "mode": mode, "boss": None, "offers": {}, "confirms": {}, "status": "waiting", "turn": 0,
           "actions": {"host": None, "guest": None}, "log": [], "winner": None, "rev": 0, "chat": [],
           "created_at": now.isoformat(), "expires_at": now + timedelta(days=2)}
    if guest:
        doc.update({"guest_id": guest["id"], "guest_name": guest["name"], "guest_party": guest["party"], "status": "active"})
    for _ in range(10):
        doc["code"] = "".join(secrets.choice(alphabet) for _ in range(6))
        try:
            await db.live_duels.insert_one(dict(doc))
            return doc
        except DuplicateKeyError:
            continue
    raise HTTPException(status_code=500, detail="Riprova tra poco")


@api_router.post("/match")
async def match_join(body: LiveIn, user: dict = Depends(current_user)):
    uid = str(user["_id"])
    me = {"id": uid, "name": body.name, "party": clean_party(body.party)}
    avg = party_avg(me["party"])
    now = datetime.now(timezone.utc)
    await db.match_queue.delete_many({"user_id": uid})
    # Similar level first; after 20 s of waiting anyone is fine.
    for filt in (
        {"status": "waiting", "user_id": {"$ne": uid}, "avg": {"$gte": avg - 10, "$lte": avg + 10}},
        {"status": "waiting", "user_id": {"$ne": uid}, "created_at": {"$lte": (now - timedelta(seconds=20)).isoformat()}},
    ):
        other = await db.match_queue.find_one_and_update(filt, {"$set": {"status": "taken"}}, sort=[("created_at", ASCENDING)])
        if other:
            room = await new_room({"id": other["user_id"], "name": other["name"], "party": other["party"]}, me)
            await db.match_queue.update_one({"_id": other["_id"]}, {"$set": {"status": "matched", "code": room["code"]}})
            return {"status": "matched", "live": live_out(room, uid)}
    await db.match_queue.insert_one({"user_id": uid, "name": body.name, "party": me["party"], "avg": avg, "status": "waiting",
                                     "created_at": now.isoformat(), "expires_at": now + timedelta(minutes=3)})
    return {"status": "waiting"}


@api_router.get("/match")
async def match_status(user: dict = Depends(current_user)):
    e = await db.match_queue.find_one({"user_id": str(user["_id"])}, sort=[("created_at", -1)])
    if not e:
        return {"status": "none"}
    if e["status"] == "matched":
        await db.match_queue.delete_one({"_id": e["_id"]})
        return {"status": "matched", "code": e["code"]}
    return {"status": "waiting"}


@api_router.delete("/match")
async def match_leave(user: dict = Depends(current_user)):
    await db.match_queue.delete_many({"user_id": str(user["_id"]), "status": "waiting"})
    return {"ok": True}


# --- Presence: who else is walking on the same map, and challenges sent to me.
class PresenceIn(BaseModel):
    map: str = Field(pattern="^[a-z0-9_]{2,40}$")
    x: int = Field(ge=0, le=15)
    y: int = Field(ge=0, le=15)
    dir: str = Field(pattern="^(up|down|left|right)$")
    name: str = Field(min_length=1, max_length=20)
    visible: bool = True


@api_router.post("/presence")
async def presence(body: PresenceIn, user: dict = Depends(current_user)):
    uid = str(user["_id"])
    now = datetime.now(timezone.utc)
    if body.visible:
        await db.presence.update_one({"user_id": uid}, {"$set": {"name": body.name, "map": body.map, "x": body.x, "y": body.y, "dir": body.dir,
                                                                 "at": now.isoformat(), "expires_at": now + timedelta(seconds=30)}}, upsert=True)
    else:
        await db.presence.delete_one({"user_id": uid})
    players = []
    if body.visible:
        cur = db.presence.find({"map": body.map, "user_id": {"$ne": uid}, "at": {"$gte": (now - timedelta(seconds=12)).isoformat()}}, {"_id": 0}).limit(8)
        players = [{"id": p["user_id"], "name": p["name"], "x": p["x"], "y": p["y"], "dir": p["dir"]} async for p in cur]
    inv = db.invites.find({"to_id": uid, "expires_at": {"$gt": now}}).limit(3)
    invites = [{"id": str(i["_id"]), "from": i["from_name"], "code": i["code"]} async for i in inv]
    return {"players": players, "invites": invites}


class InviteIn(BaseModel):
    to: str = Field(min_length=24, max_length=24)
    code: str = Field(min_length=6, max_length=6)


@api_router.post("/invite")
async def invite(body: InviteIn, user: dict = Depends(current_user)):
    uid = str(user["_id"])
    d = await db.live_duels.find_one({"code": body.code.upper(), "host_id": uid, "status": "waiting"})
    if not d:
        raise HTTPException(status_code=404, detail="Stanza non trovata")
    if not await db.presence.find_one({"user_id": body.to}):
        raise HTTPException(status_code=404, detail="Il giocatore non è più qui")
    await db.invites.delete_many({"to_id": body.to, "from_id": uid})
    await db.invites.insert_one({"to_id": body.to, "from_id": uid, "from_name": d["host_name"], "code": d["code"],
                                 "expires_at": datetime.now(timezone.utc) + timedelta(seconds=90)})
    return {"ok": True}


@api_router.delete("/invite/{invite_id}")
async def invite_drop(invite_id: str, user: dict = Depends(current_user)):
    if ObjectId.is_valid(invite_id):
        await db.invites.delete_one({"_id": ObjectId(invite_id), "to_id": str(user["_id"])})
    return {"ok": True}


class LiveEnd(BaseModel):
    winner: str = Field(pattern="^(host|guest|draw|boss)$")


@api_router.post("/live/{code}/end")
async def live_end(code: str, body: LiveEnd, user: dict = Depends(current_user)):
    uid = str(user["_id"])
    d = await live_doc(code, uid)
    await live_update({"code": d["code"], "status": "active"}, {"$set": {"status": "done", "winner": body.winner}})
    return live_out(await live_doc(code, uid), uid)


app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=False,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')


@app.on_event("startup")
async def start_index_build():
    app.state.index_task = asyncio.create_task(ensure_indexes())


@app.on_event("shutdown")
async def shutdown_db_client():
    app.state.index_task.cancel()
    with suppress(asyncio.CancelledError):
        await app.state.index_task
    client.close()
