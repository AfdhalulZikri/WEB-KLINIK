from datetime import date
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

from ..deps import get_db, require
from ..models import Dokter, Layanan, Pendaftaran, User
from ..security import hash_password
from ..serializers import pendaftaran_out, user_out
from ..utils import HARI, STATUS

router = APIRouter(prefix="/api/pasien", tags=["Pasien"])
pasien_only = require("pasien")


class ProfilIn(BaseModel):
    nama: str = ""
    nomor_telepon: Optional[str] = None
    password_baru: Optional[str] = None


class PendaftaranIn(BaseModel):
    dokter_id: int
    layanan_id: int
    tanggal: str = ""
    keluhan: str = ""


def _milik_pasien(db: Session, user: User):
    return (
        db.query(Pendaftaran)
        .filter(Pendaftaran.pasien_id == user.id)
        .order_by(Pendaftaran.tanggal.desc(), Pendaftaran.id.desc())
    )


@router.get("/dashboard")
def dashboard(user: User = Depends(pasien_only), db: Session = Depends(get_db)):
    semua = _milik_pasien(db, user).all()
    hitung = {s: sum(1 for p in semua if p.status == s) for s in STATUS}
    mendatang = sorted(
        [p for p in semua if p.status in ("Menunggu", "Dikonfirmasi") and p.tanggal >= date.today()],
        key=lambda p: p.tanggal,
    )
    return {
        "total": len(semua),
        "hitung": hitung,
        "mendatang": [pendaftaran_out(p) for p in mendatang[:3]],
        "terbaru": [pendaftaran_out(p) for p in semua[:5]],
    }


@router.get("/profil")
def profil(user: User = Depends(pasien_only)):
    return user_out(user)


@router.put("/profil")
def profil_simpan(data: ProfilIn, user: User = Depends(pasien_only), db: Session = Depends(get_db)):
    if not data.nama.strip():
        raise HTTPException(400, "Nama tidak boleh kosong.")
    if data.password_baru and len(data.password_baru) < 6:
        raise HTTPException(400, "Password baru minimal 6 karakter.")
    user.nama = data.nama.strip()
    user.nomor_telepon = (data.nomor_telepon or "").strip() or None
    if data.password_baru:
        user.password = hash_password(data.password_baru)
    db.commit()
    return user_out(user)


@router.post("/pendaftaran", status_code=201)
def buat_pendaftaran(
    data: PendaftaranIn, user: User = Depends(pasien_only), db: Session = Depends(get_db)
):
    """FR-07: pendaftaran konsultasi."""
    dokter = db.get(Dokter, data.dokter_id)
    layanan = db.get(Layanan, data.layanan_id)
    if not dokter or not layanan:
        raise HTTPException(400, "Dokter atau layanan tidak ditemukan.")
    try:
        tgl = date.fromisoformat(data.tanggal)
    except ValueError:
        raise HTTPException(400, "Tanggal tidak valid.") from None
    if tgl < date.today():
        raise HTTPException(400, "Tanggal kunjungan tidak boleh sebelum hari ini.")
    hari = HARI[tgl.weekday()]
    if hari not in dokter.hari_praktik:
        praktik = ", ".join(dokter.hari_praktik) or "belum ada jadwal"
        raise HTTPException(400, f"{dokter.nama} tidak praktik pada hari {hari}. Hari praktik: {praktik}.")
    if not data.keluhan.strip():
        raise HTTPException(400, "Keluhan wajib diisi.")
    duplikat = (
        db.query(Pendaftaran)
        .filter(
            Pendaftaran.pasien_id == user.id,
            Pendaftaran.dokter_id == dokter.id,
            Pendaftaran.tanggal == tgl,
            Pendaftaran.status != "Dibatalkan",
        )
        .first()
    )
    if duplikat:
        raise HTTPException(409, "Anda sudah mendaftar ke dokter ini pada tanggal tersebut.")

    p = Pendaftaran(
        pasien_id=user.id,
        dokter_id=dokter.id,
        layanan_id=layanan.id,
        tanggal=tgl,
        keluhan=data.keluhan.strip(),
        status="Menunggu",
    )
    db.add(p)
    db.commit()
    db.refresh(p)
    return pendaftaran_out(p)


@router.get("/pendaftaran")
def riwayat(user: User = Depends(pasien_only), db: Session = Depends(get_db)):
    """FR-08 & FR-09: status dan riwayat pendaftaran."""
    return [pendaftaran_out(p) for p in _milik_pasien(db, user).all()]


@router.post("/pendaftaran/{pid}/batal")
def batal(pid: int, user: User = Depends(pasien_only), db: Session = Depends(get_db)):
    p = db.get(Pendaftaran, pid)
    if not p or p.pasien_id != user.id:
        raise HTTPException(404, "Pendaftaran tidak ditemukan.")
    if p.status != "Menunggu":
        raise HTTPException(400, "Hanya pendaftaran berstatus Menunggu yang bisa dibatalkan.")
    p.status = "Dibatalkan"
    db.commit()
    return pendaftaran_out(p)
