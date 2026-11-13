"""Data awal (hanya dibuat jika tabel users masih kosong)."""
from datetime import time

from sqlalchemy.orm import Session

from .models import Dokter, Jadwal, Layanan, User
from .security import hash_password


def seed(db: Session) -> None:
    if db.query(User).count() > 0:
        return

    db.add(User(nama="Administrator", email="admin@klinik.local",
                password=hash_password("admin123"), role="admin"))
    db.add(User(nama="Pasien Contoh", email="pasien@klinik.local",
                password=hash_password("pasien123"), role="pasien",
                nomor_telepon="081234567890"))

    contoh_dokter = [
        ("dr. Aisyah Rahman", "Dokter Umum", "dokter1@klinik.local",
         [("Senin", 8, 12), ("Rabu", 8, 12), ("Jumat", 13, 17)]),
        ("dr. Budi Santoso, Sp.A", "Spesialis Anak", "dokter2@klinik.local",
         [("Selasa", 9, 14), ("Kamis", 9, 14)]),
        ("drg. Citra Lestari", "Dokter Gigi", "dokter3@klinik.local",
         [("Senin", 13, 18), ("Sabtu", 8, 13)]),
    ]
    for i, (nama, spes, email, jadwal) in enumerate(contoh_dokter, start=1):
        user = User(nama=nama, email=email, password=hash_password("dokter123"), role="dokter")
        dokter = Dokter(nama=nama, spesialisasi=spes, nomor_telepon=f"08111000{i:03d}", user=user)
        dokter.jadwal = [
            Jadwal(hari=h, jam_mulai=time(a), jam_selesai=time(b)) for h, a, b in jadwal
        ]
        db.add(dokter)

    db.add_all([
        Layanan(nama_layanan="Konsultasi Dokter Umum",
                deskripsi="Pemeriksaan dan konsultasi kesehatan umum.", harga=75000),
        Layanan(nama_layanan="Konsultasi Anak",
                deskripsi="Pemeriksaan tumbuh kembang dan penyakit anak.", harga=150000),
        Layanan(nama_layanan="Pemeriksaan Gigi",
                deskripsi="Pemeriksaan, pembersihan karang, dan konsultasi gigi.", harga=120000),
        Layanan(nama_layanan="Cek Laboratorium Dasar",
                deskripsi="Cek darah rutin, gula darah, dan kolesterol.", harga=100000),
    ])
    db.commit()
