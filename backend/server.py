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
    "users": [IndexModel([("email", ASCENDING)], name="email", unique=True)],
    "saves": [IndexModel([("user_id", ASCENDING)], name="user_id", unique=True)],
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


@api_router.post("/auth/login", response_model=AuthOut)
async def login(body: Credentials):
    email = str(body.email).lower().strip()
    user = await db.users.find_one({"email": email})
    if not user or not bcrypt.checkpw(body.password.encode(), user["password_hash"].encode()):
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
