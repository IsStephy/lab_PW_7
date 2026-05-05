from pydantic import BaseModel
from typing import Optional, Any, List, Dict


class TokenRequest(BaseModel):
    role: Optional[str] = "VISITOR"
    permissions: Optional[List[str]] = None


class TokenResponse(BaseModel):
    access_token: str
    token_type: str
    expires_in: int
    role: str
    permissions: List[str]


class DeckCreate(BaseModel):
    id: str
    name: str
    cardTheme: str
    favorite: bool = False
    createdAt: int
    bestScores: Dict[str, Any] = {}


class DeckUpdate(BaseModel):
    name: Optional[str] = None
    cardTheme: Optional[str] = None
    favorite: Optional[bool] = None
    bestScores: Optional[Dict[str, Any]] = None


class DeckResponse(BaseModel):
    id: str
    name: str
    cardTheme: str
    favorite: bool
    createdAt: int
    bestScores: Dict[str, Any]


class ReplayCreate(BaseModel):
    id: str
    deckName: str
    deckTheme: str
    gridSize: Dict[str, Any]
    cardStyle: Dict[str, Any]
    moves: int
    time: int
    playedAt: int
    initialCards: List[Any]
    moveLog: List[Any]


class ReplayResponse(BaseModel):
    id: str
    deckName: str
    deckTheme: str
    gridSize: Dict[str, Any]
    cardStyle: Dict[str, Any]
    moves: int
    time: int
    playedAt: int
    initialCards: List[Any]
    moveLog: List[Any]
