from typing import Optional

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

from ..deps import get_current_user, get_db
from ..models import User
from ..security import create_token, hash_password, verify_password
from ..serializers import user_out
from ..utils import valid_email

router = APIRouter(prefix="/api/auth", tags=["Autentikasi"])


class RegisterIn(BaseModel):
    nama: str = ""
    email: str = ""
    nomor_telepon: Optional[str] = None
    password: str = ""


class LoginIn(BaseModel):
    email: str = ""
    password: str = ""


def _token_response(user: User) -> dict:
    return {
        "access_token": create_token(user.id, user.role),
        "token_type": "bearer",
        "user": user_out(user),
    }


@router.post("/register", status_code=201)
def register(data: RegisterIn, db: Session = Depends(get_db)):
    """FR-01: registrasi akun pasien."""
    email = data.email.strip().lower()
    if not data.nama.strip():
        raise HTTPException(400, "Nama wajib diisi.")
    if not valid_email(email):
        raise HTTPException(400, "Email tidak valid.")
    if len(data.password) < 6:
        raise HTTPException(400, "Password minimal 6 karakter.")
    if db.query(User).filter(User.email == email).first():
        raise HTTPException(409, "Email sudah terdaftar.")

    user = User(
        nama=data.nama.strip(),
        email=email,
        password=hash_password(data.password),
        role="pasien",
        nomor_telepon=(data.nomor_telepon or "").strip() or None,
    )
    db.add(user)
    db.commit()
    return _token_response(user)


@router.post("/login")
def login(data: LoginIn, db: Session = Depends(get_db)):
    """FR-02: login untuk pasien, dokter, dan admin."""
    user = db.query(User).filter(User.email == data.email.strip().lower()).first()
    if not user or not verify_password(data.password, user.password):
        raise HTTPException(401, "Email atau password salah.")
    return _token_response(user)


@router.get("/me")
def me(user: User = Depends(get_current_user)):
    return user_out(user)
