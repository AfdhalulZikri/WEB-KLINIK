from datetime import date

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from ..deps import get_db, require
from ..models import Dokter, Pendaftaran, User
from ..serializers import dokter_out, jadwal_out, pendaftaran_out
from ..utils import HARI, STATUS

router = APIRouter(prefix="/api/praktik", tags=["Dokter"])
dokter_only = require("dokter")


def _profil_dokter(user: User) -> Dokter:
    if not user.dokter:
        raise HTTPException(404, "Profil dokter untuk akun ini belum terhubung. Hubungi admin.")
    return user.dokter


@router.get("/dashboard")
def dashboard(user: User = Depends(dokter_only), db: Session = Depends(get_db)):
    dokter = _profil_dokter(user)
    hari_ini = HARI[date.today().weekday()]
    semua = db.query(Pendaftaran).filter(Pendaftaran.dokter_id == dokter.id)
    pasien_hari_ini = (
        semua.filter(Pendaftaran.tanggal == date.today(), Pendaftaran.status != "Dibatalkan")
        .order_by(Pendaftaran.id)
        .all()
    )
    return {
        "dokter": dokter_out(dokter),
        "hari_ini": hari_ini,
        "tanggal_hari_ini": date.today().isoformat(),
        "jadwal_hari_ini": [jadwal_out(j) for j in dokter.jadwal_urut if j.hari == hari_ini],
        "pasien_hari_ini": [pendaftaran_out(p) for p in pasien_hari_ini],
        "hitung": {s: semua.filter(Pendaftaran.status == s).count() for s in STATUS},
    }


@router.get("/jadwal")
def jadwal(user: User = Depends(dokter_only)):
    """FR-16: jadwal praktik dokter yang login."""
    dokter = _profil_dokter(user)
    return {"dokter": dokter_out(dokter), "jadwal": [jadwal_out(j) for j in dokter.jadwal_urut]}


@router.get("/pendaftaran")
def daftar_pasien(
    status: str = "",
    tanggal: str = "",
    user: User = Depends(dokter_only),
    db: Session = Depends(get_db),
):
    """FR-15: daftar pasien yang terdaftar ke dokter ini."""
    dokter = _profil_dokter(user)
    query = db.query(Pendaftaran).filter(Pendaftaran.dokter_id == dokter.id)
    if status in STATUS:
        query = query.filter(Pendaftaran.status == status)
    if tanggal:
        try:
            query = query.filter(Pendaftaran.tanggal == date.fromisoformat(tanggal))
        except ValueError:
            raise HTTPException(400, "Format tanggal harus YYYY-MM-DD.") from None
    data = query.order_by(Pendaftaran.tanggal.desc(), Pendaftaran.id.desc()).all()
    return [pendaftaran_out(p) for p in data]


@router.get("/pendaftaran/{pid}")
def detail(pid: int, user: User = Depends(dokter_only), db: Session = Depends(get_db)):
    """Informasi pendaftaran pasien."""
    dokter = _profil_dokter(user)
    p = db.get(Pendaftaran, pid)
    if not p or p.dokter_id != dokter.id:
        raise HTTPException(404, "Data pendaftaran tidak ditemukan.")
    return pendaftaran_out(p)
