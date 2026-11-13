from datetime import date
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy import func
from sqlalchemy.orm import Session

from ..deps import get_db, require
from ..models import Dokter, Jadwal, Layanan, Pendaftaran, User
from ..security import hash_password
from ..serializers import dokter_out, jadwal_out, layanan_out, pendaftaran_out, user_out
from ..utils import HARI, STATUS, parse_time, valid_email

router = APIRouter(prefix="/api/admin", tags=["Admin"])
admin_only = require("admin")


# ------------------------------------------------------------------ skema input
class PasienIn(BaseModel):
    nama: str = ""
    email: str = ""
    nomor_telepon: Optional[str] = None
    password: Optional[str] = None


class DokterIn(BaseModel):
    nama: str = ""
    spesialisasi: str = ""
    nomor_telepon: Optional[str] = None
    email: str = ""
    password: Optional[str] = None


class LayananIn(BaseModel):
    nama_layanan: str = ""
    deskripsi: str = ""
    harga: int = 0


class JadwalIn(BaseModel):
    dokter_id: int
    hari: str = ""
    jam_mulai: str = ""
    jam_selesai: str = ""


class StatusIn(BaseModel):
    status: str = ""


# ------------------------------------------------------------------ helper
def _cek_akun(db: Session, nama: str, email: str, password: Optional[str],
              wajib_password: bool, abaikan_id: Optional[int] = None) -> str:
    """Validasi data akun; mengembalikan email yang sudah dinormalisasi."""
    email = email.strip().lower()
    if not nama.strip():
        raise HTTPException(400, "Nama wajib diisi.")
    if not valid_email(email):
        raise HTTPException(400, "Email tidak valid.")
    if (wajib_password or password) and len(password or "") < 6:
        raise HTTPException(400, "Password minimal 6 karakter.")
    q = db.query(User).filter(User.email == email)
    if abaikan_id:
        q = q.filter(User.id != abaikan_id)
    if q.first():
        raise HTTPException(409, "Email sudah dipakai akun lain.")
    return email


def _ambil(db: Session, model, obj_id: int, nama: str):
    obj = db.get(model, obj_id)
    if obj is None:
        raise HTTPException(404, f"{nama} tidak ditemukan.")
    return obj


# ------------------------------------------------------------------ dashboard
@router.get("/dashboard")
def dashboard(user: User = Depends(admin_only), db: Session = Depends(get_db)):
    per_status = dict(
        db.query(Pendaftaran.status, func.count(Pendaftaran.id)).group_by(Pendaftaran.status).all()
    )
    terbaru = db.query(Pendaftaran).order_by(Pendaftaran.id.desc()).limit(8).all()
    return {
        "tanggal": date.today().isoformat(),
        "stat": {
            "pasien": db.query(User).filter(User.role == "pasien").count(),
            "dokter": db.query(Dokter).count(),
            "layanan": db.query(Layanan).count(),
            "pendaftaran": db.query(Pendaftaran).count(),
        },
        "per_status": {s: per_status.get(s, 0) for s in STATUS},
        "terbaru": [pendaftaran_out(p) for p in terbaru],
    }


# ------------------------------------------------------------------ pasien (FR-10)
@router.get("/pasien")
def pasien_list(q: str = "", user: User = Depends(admin_only), db: Session = Depends(get_db)):
    query = db.query(User).filter(User.role == "pasien")
    if q.strip():
        like = f"%{q.strip()}%"
        query = query.filter(User.nama.ilike(like) | User.email.ilike(like))
    hasil = []
    for p in query.order_by(User.nama).all():
        row = user_out(p)
        row["jumlah_pendaftaran"] = len(p.pendaftaran)
        hasil.append(row)
    return hasil


@router.post("/pasien", status_code=201)
def pasien_buat(data: PasienIn, user: User = Depends(admin_only), db: Session = Depends(get_db)):
    email = _cek_akun(db, data.nama, data.email, data.password, True)
    p = User(nama=data.nama.strip(), email=email, password=hash_password(data.password or ""),
             role="pasien", nomor_telepon=(data.nomor_telepon or "").strip() or None)
    db.add(p)
    db.commit()
    return user_out(p)


@router.get("/pasien/{uid}")
def pasien_detail(uid: int, user: User = Depends(admin_only), db: Session = Depends(get_db)):
    p = _ambil(db, User, uid, "Pasien")
    if p.role != "pasien":
        raise HTTPException(404, "Pasien tidak ditemukan.")
    return user_out(p)


@router.put("/pasien/{uid}")
def pasien_ubah(uid: int, data: PasienIn, user: User = Depends(admin_only),
                db: Session = Depends(get_db)):
    p = _ambil(db, User, uid, "Pasien")
    if p.role != "pasien":
        raise HTTPException(404, "Pasien tidak ditemukan.")
    p.email = _cek_akun(db, data.nama, data.email, data.password, False, abaikan_id=uid)
    p.nama = data.nama.strip()
    p.nomor_telepon = (data.nomor_telepon or "").strip() or None
    if data.password:
        p.password = hash_password(data.password)
    db.commit()
    return user_out(p)


@router.delete("/pasien/{uid}")
def pasien_hapus(uid: int, user: User = Depends(admin_only), db: Session = Depends(get_db)):
    p = _ambil(db, User, uid, "Pasien")
    if p.role != "pasien":
        raise HTTPException(404, "Pasien tidak ditemukan.")
    db.delete(p)  # riwayat pendaftaran pasien ikut terhapus (ON DELETE CASCADE)
    db.commit()
    return {"ok": True}


# ------------------------------------------------------------------ dokter (FR-11)
@router.get("/dokter")
def dokter_list(user: User = Depends(admin_only), db: Session = Depends(get_db)):
    return [dokter_out(d, admin=True) for d in db.query(Dokter).order_by(Dokter.nama).all()]


@router.post("/dokter", status_code=201)
def dokter_buat(data: DokterIn, user: User = Depends(admin_only), db: Session = Depends(get_db)):
    email = _cek_akun(db, data.nama, data.email, data.password, True)
    if not data.spesialisasi.strip():
        raise HTTPException(400, "Spesialisasi wajib diisi.")
    telp = (data.nomor_telepon or "").strip() or None
    akun = User(nama=data.nama.strip(), email=email, password=hash_password(data.password or ""),
                role="dokter", nomor_telepon=telp)
    d = Dokter(nama=data.nama.strip(), spesialisasi=data.spesialisasi.strip(),
               nomor_telepon=telp, user=akun)
    db.add(d)
    db.commit()
    return dokter_out(d, admin=True)


@router.get("/dokter/{did}")
def dokter_detail(did: int, user: User = Depends(admin_only), db: Session = Depends(get_db)):
    return dokter_out(_ambil(db, Dokter, did, "Dokter"), admin=True)


@router.put("/dokter/{did}")
def dokter_ubah(did: int, data: DokterIn, user: User = Depends(admin_only),
                db: Session = Depends(get_db)):
    d = _ambil(db, Dokter, did, "Dokter")
    if not d.user and not data.password:
        raise HTTPException(400, "Dokter ini belum punya akun login; isi password untuk membuatnya.")
    email = _cek_akun(db, data.nama, data.email, data.password, d.user is None,
                      abaikan_id=d.user_id)
    if not data.spesialisasi.strip():
        raise HTTPException(400, "Spesialisasi wajib diisi.")
    telp = (data.nomor_telepon or "").strip() or None
    d.nama, d.spesialisasi, d.nomor_telepon = data.nama.strip(), data.spesialisasi.strip(), telp
    if d.user:
        d.user.nama, d.user.email, d.user.nomor_telepon = d.nama, email, telp
        if data.password:
            d.user.password = hash_password(data.password)
    else:
        d.user = User(nama=d.nama, email=email, password=hash_password(data.password or ""),
                      role="dokter", nomor_telepon=telp)
    db.commit()
    return dokter_out(d, admin=True)


@router.delete("/dokter/{did}")
def dokter_hapus(did: int, user: User = Depends(admin_only), db: Session = Depends(get_db)):
    d = _ambil(db, Dokter, did, "Dokter")
    if d.pendaftaran:
        raise HTTPException(409, "Dokter tidak bisa dihapus karena sudah memiliki data pendaftaran.")
    akun = d.user
    db.delete(d)
    db.flush()
    if akun:
        db.delete(akun)
    db.commit()
    return {"ok": True}


# ------------------------------------------------------------------ layanan (FR-12)
def _cek_layanan(data: LayananIn) -> None:
    if not data.nama_layanan.strip():
        raise HTTPException(400, "Nama layanan wajib diisi.")
    if data.harga < 0:
        raise HTTPException(400, "Harga tidak boleh negatif.")


@router.get("/layanan")
def layanan_list(user: User = Depends(admin_only), db: Session = Depends(get_db)):
    return [layanan_out(l) for l in db.query(Layanan).order_by(Layanan.nama_layanan).all()]


@router.post("/layanan", status_code=201)
def layanan_buat(data: LayananIn, user: User = Depends(admin_only), db: Session = Depends(get_db)):
    _cek_layanan(data)
    l = Layanan(nama_layanan=data.nama_layanan.strip(), deskripsi=data.deskripsi.strip(),
                harga=data.harga)
    db.add(l)
    db.commit()
    return layanan_out(l)


@router.put("/layanan/{lid}")
def layanan_ubah(lid: int, data: LayananIn, user: User = Depends(admin_only),
                 db: Session = Depends(get_db)):
    l = _ambil(db, Layanan, lid, "Layanan")
    _cek_layanan(data)
    l.nama_layanan, l.deskripsi, l.harga = data.nama_layanan.strip(), data.deskripsi.strip(), data.harga
    db.commit()
    return layanan_out(l)


@router.delete("/layanan/{lid}")
def layanan_hapus(lid: int, user: User = Depends(admin_only), db: Session = Depends(get_db)):
    l = _ambil(db, Layanan, lid, "Layanan")
    if l.pendaftaran:
        raise HTTPException(409, "Layanan tidak bisa dihapus karena sudah dipakai pendaftaran.")
    db.delete(l)
    db.commit()
    return {"ok": True}


# ------------------------------------------------------------------ jadwal (FR-13)
def _cek_jadwal(db: Session, data: JadwalIn, abaikan_id: Optional[int] = None):
    if not db.get(Dokter, data.dokter_id):
        raise HTTPException(400, "Dokter tidak ditemukan.")
    if data.hari not in HARI:
        raise HTTPException(400, "Hari tidak valid.")
    mulai, selesai = parse_time(data.jam_mulai), parse_time(data.jam_selesai)
    if not mulai or not selesai:
        raise HTTPException(400, "Format jam harus HH:MM.")
    if selesai <= mulai:
        raise HTTPException(400, "Jam selesai harus lebih besar dari jam mulai.")
    q = db.query(Jadwal).filter(Jadwal.dokter_id == data.dokter_id, Jadwal.hari == data.hari)
    if abaikan_id:
        q = q.filter(Jadwal.id != abaikan_id)
    if any(j.jam_mulai < selesai and mulai < j.jam_selesai for j in q):
        raise HTTPException(409, "Jadwal bertabrakan dengan jadwal lain dokter ini di hari yang sama.")
    return mulai, selesai


@router.get("/jadwal")
def jadwal_list(user: User = Depends(admin_only), db: Session = Depends(get_db)):
    """Jadwal dikelompokkan per dokter."""
    return [dokter_out(d) for d in db.query(Dokter).order_by(Dokter.nama).all()]


@router.post("/jadwal", status_code=201)
def jadwal_buat(data: JadwalIn, user: User = Depends(admin_only), db: Session = Depends(get_db)):
    mulai, selesai = _cek_jadwal(db, data)
    j = Jadwal(dokter_id=data.dokter_id, hari=data.hari, jam_mulai=mulai, jam_selesai=selesai)
    db.add(j)
    db.commit()
    return jadwal_out(j)


@router.get("/jadwal/{jid}")
def jadwal_detail(jid: int, user: User = Depends(admin_only), db: Session = Depends(get_db)):
    return jadwal_out(_ambil(db, Jadwal, jid, "Jadwal"))


@router.put("/jadwal/{jid}")
def jadwal_ubah(jid: int, data: JadwalIn, user: User = Depends(admin_only),
                db: Session = Depends(get_db)):
    j = _ambil(db, Jadwal, jid, "Jadwal")
    mulai, selesai = _cek_jadwal(db, data, abaikan_id=jid)
    j.dokter_id, j.hari, j.jam_mulai, j.jam_selesai = data.dokter_id, data.hari, mulai, selesai
    db.commit()
    return jadwal_out(j)


@router.delete("/jadwal/{jid}")
def jadwal_hapus(jid: int, user: User = Depends(admin_only), db: Session = Depends(get_db)):
    db.delete(_ambil(db, Jadwal, jid, "Jadwal"))
    db.commit()
    return {"ok": True}


# ------------------------------------------------------------------ pendaftaran (FR-14)
@router.get("/pendaftaran")
def pendaftaran_list(status: str = "", q: str = "", user: User = Depends(admin_only),
                     db: Session = Depends(get_db)):
    query = db.query(Pendaftaran).join(User, Pendaftaran.pasien_id == User.id)
    if status in STATUS:
        query = query.filter(Pendaftaran.status == status)
    if q.strip():
        query = query.filter(User.nama.ilike(f"%{q.strip()}%"))
    data = query.order_by(Pendaftaran.tanggal.desc(), Pendaftaran.id.desc()).all()
    return [pendaftaran_out(p) for p in data]


@router.put("/pendaftaran/{pid}/status")
def pendaftaran_status(pid: int, data: StatusIn, user: User = Depends(admin_only),
                       db: Session = Depends(get_db)):
    p = _ambil(db, Pendaftaran, pid, "Pendaftaran")
    if data.status not in STATUS:
        raise HTTPException(400, "Status harus salah satu dari: " + ", ".join(STATUS) + ".")
    p.status = data.status
    db.commit()
    return pendaftaran_out(p)


@router.delete("/pendaftaran/{pid}")
def pendaftaran_hapus(pid: int, user: User = Depends(admin_only), db: Session = Depends(get_db)):
    db.delete(_ambil(db, Pendaftaran, pid, "Pendaftaran"))
    db.commit()
    return {"ok": True}
