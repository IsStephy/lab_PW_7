from datetime import datetime, timedelta, timezone
from typing import List
from jose import JWTError, jwt
from fastapi import HTTPException, Security, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

SECRET_KEY = "memory-card-game-secret-2024"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 1  # short for demo

ROLE_PERMISSIONS = {
    "ADMIN": ["READ", "WRITE", "DELETE"],
    "WRITER": ["READ", "WRITE"],
    "VISITOR": ["READ"],
}

security = HTTPBearer()


def create_access_token(role: str, permissions: List[str]) -> str:
    expire = datetime.now(timezone.utc) + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    payload = {
        "role": role,
        "permissions": permissions,
        "exp": expire,
        "iat": datetime.now(timezone.utc),
    }
    return jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)


def decode_token(token: str) -> dict:
    try:
        return jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
    except JWTError as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Invalid or expired token: {e}",
            headers={"WWW-Authenticate": "Bearer"},
        )


def require_permission(required: str):
    """Dependency factory — checks that the JWT contains the required permission."""
    def dep(credentials: HTTPAuthorizationCredentials = Security(security)):
        payload = decode_token(credentials.credentials)
        perms = payload.get("permissions", [])
        if required not in perms:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Permission '{required}' required. Your permissions: {perms}",
            )
        return payload
    return dep
