import json
import time
from typing import Optional

from fastapi import Depends, FastAPI, HTTPException, Query, status
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session

import models
import schemas
from auth import ROLE_PERMISSIONS, create_access_token, require_permission
from database import Base, SessionLocal, engine, get_db

Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Memory Card Game API",
    description=(
        "REST CRUD API for the Memory Card Game.\n\n"
        "## Authentication\n"
        "Call **GET /token?role=ADMIN** (or POST /token with a JSON body) to receive a short-lived JWT.\n"
        "Pass it as `Authorization: Bearer <token>` on every other endpoint.\n\n"
        "## Roles & Permissions\n"
        "| Role | Permissions |\n"
        "|------|-------------|\n"
        "| ADMIN | READ, WRITE, DELETE |\n"
        "| WRITER | READ, WRITE |\n"
        "| VISITOR | READ |\n\n"
        "Token expiry is **60 seconds** (demo setting)."
    ),
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ---------------------------------------------------------------------------
# Startup seed
# ---------------------------------------------------------------------------

@app.on_event("startup")
def seed_default_decks():
    db = SessionLocal()
    try:
        if db.query(models.Deck).count() == 0:
            now = int(time.time() * 1000)
            defaults = [
                models.Deck(id="1", name="Animals",          card_theme="animals", favorite=False, created_at=now - 2000, best_scores="{}"),
                models.Deck(id="2", name="Yummy Food",       card_theme="food",    favorite=True,  created_at=now - 1000, best_scores="{}"),
                models.Deck(id="3", name="Beautiful Nature", card_theme="nature",  favorite=False, created_at=now,        best_scores="{}"),
            ]
            db.add_all(defaults)
            db.commit()
    finally:
        db.close()


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _deck_out(d: models.Deck) -> dict:
    return {
        "id": d.id,
        "name": d.name,
        "cardTheme": d.card_theme,
        "favorite": d.favorite,
        "createdAt": d.created_at,
        "bestScores": json.loads(d.best_scores or "{}"),
    }


def _replay_out(r: models.Replay) -> dict:
    return {
        "id": r.id,
        "deckName": r.deck_name,
        "deckTheme": r.deck_theme,
        "gridSize": json.loads(r.grid_size),
        "cardStyle": json.loads(r.card_style),
        "moves": r.moves,
        "time": r.time,
        "playedAt": r.played_at,
        "initialCards": json.loads(r.initial_cards),
        "moveLog": json.loads(r.move_log),
    }


# ---------------------------------------------------------------------------
# Auth — /token
# ---------------------------------------------------------------------------

@app.get(
    "/token",
    response_model=schemas.TokenResponse,
    tags=["Auth"],
    summary="Get a JWT via query param",
    description="Pass `?role=ADMIN|WRITER|VISITOR` to receive a signed JWT. Expires in 60 s.",
)
def get_token_get(role: str = Query("VISITOR", description="ADMIN | WRITER | VISITOR")):
    role = role.upper()
    if role not in ROLE_PERMISSIONS:
        raise HTTPException(status_code=400, detail=f"Unknown role. Choose from: {list(ROLE_PERMISSIONS)}")
    perms = ROLE_PERMISSIONS[role]
    return schemas.TokenResponse(
        access_token=create_access_token(role, perms),
        token_type="bearer",
        expires_in=60,
        role=role,
        permissions=perms,
    )


@app.post(
    "/token",
    response_model=schemas.TokenResponse,
    tags=["Auth"],
    summary="Get a JWT via POST body",
    description=(
        "POST a JSON body `{\"role\": \"ADMIN\"}` (optionally include `\"permissions\": [...]`) "
        "to receive a signed JWT. Expires in 60 s."
    ),
)
def get_token_post(body: schemas.TokenRequest):
    role = (body.role or "VISITOR").upper()
    if role not in ROLE_PERMISSIONS:
        raise HTTPException(status_code=400, detail=f"Unknown role. Choose from: {list(ROLE_PERMISSIONS)}")
    perms = body.permissions if body.permissions else ROLE_PERMISSIONS[role]
    return schemas.TokenResponse(
        access_token=create_access_token(role, perms),
        token_type="bearer",
        expires_in=60,
        role=role,
        permissions=perms,
    )


# ---------------------------------------------------------------------------
# Decks — CRUD
# ---------------------------------------------------------------------------

@app.get(
    "/decks",
    tags=["Decks"],
    summary="List decks (paginated)",
    description="Returns a paginated list of all decks. Requires READ permission.",
)
def list_decks(
    skip: int = Query(0, ge=0, description="Number of records to skip"),
    limit: int = Query(10, ge=1, le=100, description="Max records to return (1-100)"),
    db: Session = Depends(get_db),
    _auth=Depends(require_permission("READ")),
):
    total = db.query(models.Deck).count()
    items = db.query(models.Deck).offset(skip).limit(limit).all()
    return {"items": [_deck_out(d) for d in items], "total": total, "skip": skip, "limit": limit}


@app.get(
    "/decks/{deck_id}",
    tags=["Decks"],
    summary="Get a single deck",
)
def get_deck(
    deck_id: str,
    db: Session = Depends(get_db),
    _auth=Depends(require_permission("READ")),
):
    d = db.query(models.Deck).filter(models.Deck.id == deck_id).first()
    if not d:
        raise HTTPException(status_code=404, detail="Deck not found")
    return _deck_out(d)


@app.post(
    "/decks",
    status_code=status.HTTP_201_CREATED,
    tags=["Decks"],
    summary="Create a deck",
    description="Requires WRITE permission.",
)
def create_deck(
    deck: schemas.DeckCreate,
    db: Session = Depends(get_db),
    _auth=Depends(require_permission("WRITE")),
):
    if db.query(models.Deck).filter(models.Deck.id == deck.id).first():
        raise HTTPException(status_code=409, detail="Deck with this ID already exists")
    d = models.Deck(
        id=deck.id,
        name=deck.name,
        card_theme=deck.cardTheme,
        favorite=deck.favorite,
        created_at=deck.createdAt,
        best_scores=json.dumps(deck.bestScores),
    )
    db.add(d)
    db.commit()
    db.refresh(d)
    return _deck_out(d)


@app.put(
    "/decks/{deck_id}",
    tags=["Decks"],
    summary="Update a deck",
    description="Partial update — only provided fields are changed. Requires WRITE permission.",
)
def update_deck(
    deck_id: str,
    updates: schemas.DeckUpdate,
    db: Session = Depends(get_db),
    _auth=Depends(require_permission("WRITE")),
):
    d = db.query(models.Deck).filter(models.Deck.id == deck_id).first()
    if not d:
        raise HTTPException(status_code=404, detail="Deck not found")
    if updates.name is not None:
        d.name = updates.name
    if updates.cardTheme is not None:
        d.card_theme = updates.cardTheme
    if updates.favorite is not None:
        d.favorite = updates.favorite
    if updates.bestScores is not None:
        d.best_scores = json.dumps(updates.bestScores)
    db.commit()
    db.refresh(d)
    return _deck_out(d)


@app.delete(
    "/decks/{deck_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    tags=["Decks"],
    summary="Delete a deck",
    description="Requires DELETE permission.",
)
def delete_deck(
    deck_id: str,
    db: Session = Depends(get_db),
    _auth=Depends(require_permission("DELETE")),
):
    d = db.query(models.Deck).filter(models.Deck.id == deck_id).first()
    if not d:
        raise HTTPException(status_code=404, detail="Deck not found")
    db.delete(d)
    db.commit()


# ---------------------------------------------------------------------------
# Replays — CRUD
# ---------------------------------------------------------------------------

@app.get(
    "/replays",
    tags=["Replays"],
    summary="List replays (paginated)",
    description="Returns replays ordered newest-first. Requires READ permission.",
)
def list_replays(
    skip: int = Query(0, ge=0, description="Number of records to skip"),
    limit: int = Query(10, ge=1, le=100, description="Max records to return (1-100)"),
    db: Session = Depends(get_db),
    _auth=Depends(require_permission("READ")),
):
    total = db.query(models.Replay).count()
    items = (
        db.query(models.Replay)
        .order_by(models.Replay.played_at.desc())
        .offset(skip)
        .limit(limit)
        .all()
    )
    return {"items": [_replay_out(r) for r in items], "total": total, "skip": skip, "limit": limit}


@app.get(
    "/replays/{replay_id}",
    tags=["Replays"],
    summary="Get a single replay",
)
def get_replay(
    replay_id: str,
    db: Session = Depends(get_db),
    _auth=Depends(require_permission("READ")),
):
    r = db.query(models.Replay).filter(models.Replay.id == replay_id).first()
    if not r:
        raise HTTPException(status_code=404, detail="Replay not found")
    return _replay_out(r)


@app.post(
    "/replays",
    status_code=status.HTTP_201_CREATED,
    tags=["Replays"],
    summary="Save a replay",
    description="Requires WRITE permission.",
)
def create_replay(
    replay: schemas.ReplayCreate,
    db: Session = Depends(get_db),
    _auth=Depends(require_permission("WRITE")),
):
    if db.query(models.Replay).filter(models.Replay.id == replay.id).first():
        raise HTTPException(status_code=409, detail="Replay with this ID already exists")
    r = models.Replay(
        id=replay.id,
        deck_name=replay.deckName,
        deck_theme=replay.deckTheme,
        grid_size=json.dumps(replay.gridSize),
        card_style=json.dumps(replay.cardStyle),
        moves=replay.moves,
        time=replay.time,
        played_at=replay.playedAt,
        initial_cards=json.dumps(replay.initialCards),
        move_log=json.dumps(replay.moveLog),
    )
    db.add(r)
    db.commit()
    db.refresh(r)
    return _replay_out(r)


@app.delete(
    "/replays/{replay_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    tags=["Replays"],
    summary="Delete a replay",
    description="Requires DELETE permission.",
)
def delete_replay(
    replay_id: str,
    db: Session = Depends(get_db),
    _auth=Depends(require_permission("DELETE")),
):
    r = db.query(models.Replay).filter(models.Replay.id == replay_id).first()
    if not r:
        raise HTTPException(status_code=404, detail="Replay not found")
    db.delete(r)
    db.commit()
