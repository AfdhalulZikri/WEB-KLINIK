"""Ubah objek database menjadi dict JSON (waktu 'HH:MM', tanggal ISO)."""
from .models import Dokter, Jadwal, Layanan, Pendaftaran, User
from .utils import hhmm


def user_out(u: User) -> dict:
    return {
        "id": u.id,
        "nama": u.nama,
        "email": u.email,
        "role": u.role,
        "nomor_telepon": u.nomor_telepon,
    }


def layanan_out(l: Layanan) -> dict:
    return {
        "id": l.id,
        "nama_layanan": l.nama_layanan,
        "deskripsi": l.deskripsi or "",
        "harga": l.harga,
    }


def jadwal_out(j: Jadwal) -> dict:
    return {
        "id": j.id,
        "dokter_id": j.dokter_id,
        "hari": j.hari,
        "jam_mulai": hhmm(j.jam_mulai),
        "jam_selesai": hhmm(j.jam_selesai),
    }


def dokter_out(d: Dokter, admin: bool = False) -> dict:
    data = {
        "id": d.id,
        "nama": d.nama,
        "spesialisasi": d.spesialisasi,
        "nomor_telepon": d.nomor_telepon,
        "hari_praktik": d.hari_praktik,
        "jadwal": [jadwal_out(j) for j in d.jadwal_urut],
    }
    if admin:
        data["email"] = d.user.email if d.user else None
    return data


def pendaftaran_out(p: Pendaftaran) -> dict:
    return {
        "id": p.id,
        "tanggal": p.tanggal.isoformat(),
        "keluhan": p.keluhan,
        "status": p.status,
        "dibuat": p.dibuat.isoformat() if p.dibuat else None,
        "pasien": {
            "id": p.pasien.id,
            "nama": p.pasien.nama,
            "email": p.pasien.email,
            "nomor_telepon": p.pasien.nomor_telepon,
        },
        "dokter": {
            "id": p.dokter.id,
            "nama": p.dokter.nama,
            "spesialisasi": p.dokter.spesialisasi,
        },
        "layanan": {
            "id": p.layanan.id,
            "nama_layanan": p.layanan.nama_layanan,
            "harga": p.layanan.harga,
        },
    }
