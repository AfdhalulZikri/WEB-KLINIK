from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from ..config import KLINIK
from ..deps import get_db
from ..models import Dokter, Layanan
from ..serializers import dokter_out, layanan_out

router = APIRouter(prefix="/api", tags=["Publik"])


@router.get("/info")
def info():
    """FR-03: informasi klinik."""
    return KLINIK


@router.get("/layanan")
def daftar_layanan(db: Session = Depends(get_db)):
    """FR-04: daftar layanan."""
    data = db.query(Layanan).order_by(Layanan.nama_layanan).all()
    return [layanan_out(l) for l in data]


@router.get("/dokter")
def daftar_dokter(db: Session = Depends(get_db)):
    """FR-05 & FR-06: daftar dokter beserta jadwal praktiknya."""
    data = db.query(Dokter).order_by(Dokter.nama).all()
    return [dokter_out(d) for d in data]
