import asyncio
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


APPLE_AUDIENCES = [a.strip() for a in os.environ["APPLE_AUDIENCES"].split(",") if a.strip()]
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
    "tortellotto", "fanghino", "grappolino", "mortazzone", "umarellino", "zanzarone", "nebbiolone", "salamone", "biciclone",
    "pistonzo", "vaporella", "cinghialotto", "squacquerone", "piadinone", "passatellone", "portichino", "tortellone", "fangone",
    "vendemmione", "umarellone", "cinghialone", "gabbianone", "vongolino", "medusella", "discotecco", "ombrellone",
    "crescentino", "lambruschino", "canalino", "scooterone", "cappellaccio", "zuppone", "mortadellone", "squacquerona", "passatellaccio", "piadinazza", "zanzarazza", "turbonzo", "vaporiera", "tandemone", "crescentone", "gabbianazzo", "lambruscone", "zuppissima",
}


@api_router.post("/duel")
async def create_duel(body: DuelIn, user: dict = Depends(current_user)):
    clean = []
    for m in body.party:
        s, lv = m.get("s"), m.get("lv")
        if s not in SPECIES_IDS or not isinstance(lv, int) or isinstance(lv, bool) or not 1 <= lv <= 50:
            raise HTTPException(status_code=422, detail="Squadra non valida")
        clean.append({"uid": str(m.get("uid", ""))[:16], "s": s, "lv": lv, "xp": lv ** 3, "hp": 1})
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
