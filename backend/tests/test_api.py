"""Tes alur utama REST API terhadap PostgreSQL KHUSUS TEST (isinya akan DIHAPUS).

Cara menjalankan (dari folder backend):
    createdb klinik_test
    # Windows (cmd):   set TEST_DATABASE_URL=postgresql+psycopg2://postgres:PASSWORD@localhost:5432/klinik_test
    # Mac/Linux:       export TEST_DATABASE_URL=postgresql+psycopg2://postgres:PASSWORD@localhost:5432/klinik_test
    python tests/test_api.py
"""
import os
import sys
from datetime import date, timedelta
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT))
os.chdir(ROOT)

_test_url = os.getenv("TEST_DATABASE_URL")
if not _test_url:
    sys.exit("Atur TEST_DATABASE_URL ke database PostgreSQL khusus test (isinya akan dihapus).")
os.environ["DATABASE_URL"] = _test_url
os.environ["SECRET_KEY"] = "kunci-untuk-pengujian-yang-cukup-panjang-123456"

from fastapi.testclient import TestClient  # noqa: E402

from app.database import Base, engine  # noqa: E402
from app.main import app  # noqa: E402
from app.utils import HARI  # noqa: E402


def tanggal_hari(nama_hari: str) -> str:
    d = date.today()
    while HARI[d.weekday()] != nama_hari:
        d += timedelta(days=1)
    return d.isoformat()


def auth(token: str) -> dict:
    return {"Authorization": f"Bearer {token}"}


def login(c, email, password):
    r = c.post("/api/auth/login", json={"email": email, "password": password})
    assert r.status_code == 200, r.text
    return r.json()["access_token"]


def main():
    Base.metadata.drop_all(bind=engine)  # mulai dari database test yang bersih

    with TestClient(app) as c:
        # ---------- publik (FR-03..06)
        assert c.get("/api/health").json() == {"status": "ok"}
        assert "nama" in c.get("/api/info").json()
        layanan = c.get("/api/layanan").json()
        dokter = c.get("/api/dokter").json()
        assert len(layanan) == 4 and len(dokter) == 3
        assert dokter[0]["jadwal"] and dokter[0]["hari_praktik"]

        # ---------- proteksi akses
        assert c.get("/api/admin/dashboard").status_code == 401
        assert c.get("/api/pasien/dashboard", headers=auth("token-palsu")).status_code == 401

        # ---------- registrasi (FR-01) + validasi
        r = c.post("/api/auth/register", json={"nama": "Budi", "email": "salah", "password": "rahasia1"})
        assert r.status_code == 400
        r = c.post("/api/auth/register", json={"nama": "Budi", "email": "budi@test.id", "password": "123"})
        assert r.status_code == 400
        r = c.post("/api/auth/register", json={"nama": "Budi", "email": "budi@test.id",
                                               "nomor_telepon": "0812", "password": "rahasia1"})
        assert r.status_code == 201, r.text
        tok_pasien = r.json()["access_token"]
        assert r.json()["user"]["role"] == "pasien" and "password" not in r.json()["user"]
        r = c.post("/api/auth/register", json={"nama": "Budi2", "email": "BUDI@test.id", "password": "rahasia1"})
        assert r.status_code == 409  # email duplikat (tidak peka huruf besar/kecil)

        # ---------- login (FR-02)
        assert c.post("/api/auth/login", json={"email": "budi@test.id", "password": "salah"}).status_code == 401
        assert c.get("/api/auth/me", headers=auth(tok_pasien)).json()["email"] == "budi@test.id"
        tok_admin = login(c, "admin@klinik.local", "admin123")
        tok_dokter = login(c, "dokter1@klinik.local", "dokter123")

        # ---------- batas role
        assert c.get("/api/admin/dashboard", headers=auth(tok_pasien)).status_code == 403
        assert c.get("/api/admin/dashboard", headers=auth(tok_dokter)).status_code == 403
        assert c.get("/api/pasien/dashboard", headers=auth(tok_admin)).status_code == 403

        # ---------- pendaftaran konsultasi (FR-07)
        # dokter 1 praktik Senin/Rabu/Jumat
        did = next(d["id"] for d in dokter if d["nama"] == "dr. Aisyah Rahman")
        lid = layanan[0]["id"]
        body = {"dokter_id": did, "layanan_id": lid, "keluhan": "Demam"}
        r = c.post("/api/pasien/pendaftaran", headers=auth(tok_pasien),
                   json={**body, "tanggal": tanggal_hari("Selasa")})
        assert r.status_code == 400 and "tidak praktik" in r.json()["detail"]
        r = c.post("/api/pasien/pendaftaran", headers=auth(tok_pasien),
                   json={**body, "tanggal": (date.today() - timedelta(days=7)).isoformat()})
        assert r.status_code == 400
        r = c.post("/api/pasien/pendaftaran", headers=auth(tok_pasien),
                   json={**body, "tanggal": tanggal_hari("Senin"), "keluhan": "  "})
        assert r.status_code == 400
        r = c.post("/api/pasien/pendaftaran", headers=auth(tok_pasien),
                   json={**body, "tanggal": tanggal_hari("Senin")})
        assert r.status_code == 201, r.text
        pid = r.json()["id"]
        assert r.json()["status"] == "Menunggu"
        r = c.post("/api/pasien/pendaftaran", headers=auth(tok_pasien),
                   json={**body, "tanggal": tanggal_hari("Senin")})
        assert r.status_code == 409  # duplikat

        # ---------- status & riwayat (FR-08, FR-09)
        riwayat = c.get("/api/pasien/pendaftaran", headers=auth(tok_pasien)).json()
        assert len(riwayat) == 1 and riwayat[0]["dokter"]["nama"] == "dr. Aisyah Rahman"
        dash = c.get("/api/pasien/dashboard", headers=auth(tok_pasien)).json()
        assert dash["total"] == 1 and dash["hitung"]["Menunggu"] == 1

        # ---------- pasien membatalkan lalu mendaftar lagi
        assert c.post(f"/api/pasien/pendaftaran/{pid}/batal", headers=auth(tok_pasien)).json()["status"] == "Dibatalkan"
        assert c.post(f"/api/pasien/pendaftaran/{pid}/batal", headers=auth(tok_pasien)).status_code == 400
        r = c.post("/api/pasien/pendaftaran", headers=auth(tok_pasien),
                   json={**body, "tanggal": tanggal_hari("Senin")})
        assert r.status_code == 201
        pid = r.json()["id"]

        # ---------- profil pasien
        r = c.put("/api/pasien/profil", headers=auth(tok_pasien),
                  json={"nama": "Budi Baru", "nomor_telepon": "0899"})
        assert r.json()["nama"] == "Budi Baru"

        # ---------- admin: pendaftaran (FR-14)
        lst = c.get("/api/admin/pendaftaran", headers=auth(tok_admin)).json()
        assert len(lst) == 2
        assert len(c.get("/api/admin/pendaftaran?status=Menunggu&q=budi", headers=auth(tok_admin)).json()) == 1
        r = c.put(f"/api/admin/pendaftaran/{pid}/status", headers=auth(tok_admin), json={"status": "Ngawur"})
        assert r.status_code == 400
        r = c.put(f"/api/admin/pendaftaran/{pid}/status", headers=auth(tok_admin), json={"status": "Dikonfirmasi"})
        assert r.json()["status"] == "Dikonfirmasi"
        # konfirmasi tidak bisa dibatalkan pasien
        assert c.post(f"/api/pasien/pendaftaran/{pid}/batal", headers=auth(tok_pasien)).status_code == 400

        # ---------- dokter (FR-15, FR-16)
        jd = c.get("/api/praktik/jadwal", headers=auth(tok_dokter)).json()
        assert len(jd["jadwal"]) == 3
        pas = c.get("/api/praktik/pendaftaran", headers=auth(tok_dokter)).json()
        assert {p["id"] for p in pas} == {p["id"] for p in lst}  # kedua pendaftaran milik dokter 1
        assert c.get(f"/api/praktik/pendaftaran/{pid}", headers=auth(tok_dokter)).json()["pasien"]["nama"] == "Budi Baru"
        assert c.get("/api/praktik/dashboard", headers=auth(tok_dokter)).status_code == 200
        tok_dokter2 = login(c, "dokter2@klinik.local", "dokter123")  # dokter lain tidak boleh melihat
        assert c.get(f"/api/praktik/pendaftaran/{pid}", headers=auth(tok_dokter2)).status_code == 404

        # ---------- admin: layanan (FR-12)
        r = c.post("/api/admin/layanan", headers=auth(tok_admin),
                   json={"nama_layanan": "Vaksin", "deskripsi": "x", "harga": 50000})
        assert r.status_code == 201
        lay_baru = r.json()["id"]
        assert c.post("/api/admin/layanan", headers=auth(tok_admin),
                      json={"nama_layanan": "", "harga": 1}).status_code == 400
        assert c.put(f"/api/admin/layanan/{lay_baru}", headers=auth(tok_admin),
                     json={"nama_layanan": "Vaksin Flu", "deskripsi": "y", "harga": 60000}).json()["harga"] == 60000
        assert c.delete(f"/api/admin/layanan/{lid}", headers=auth(tok_admin)).status_code == 409  # dipakai
        assert c.delete(f"/api/admin/layanan/{lay_baru}", headers=auth(tok_admin)).status_code == 200

        # ---------- admin: dokter + jadwal (FR-11, FR-13)
        r = c.post("/api/admin/dokter", headers=auth(tok_admin),
                   json={"nama": "dr. Baru", "spesialisasi": "Umum", "email": "baru@klinik.local", "password": "dokter123"})
        assert r.status_code == 201, r.text
        did_baru = r.json()["id"]
        j = {"dokter_id": did_baru, "hari": "Senin", "jam_mulai": "08:00", "jam_selesai": "12:00"}
        r = c.post("/api/admin/jadwal", headers=auth(tok_admin), json=j)
        assert r.status_code == 201, r.text
        jid = r.json()["id"]
        assert c.post("/api/admin/jadwal", headers=auth(tok_admin),
                      json={**j, "jam_mulai": "10:00", "jam_selesai": "14:00"}).status_code == 409  # bentrok
        assert c.post("/api/admin/jadwal", headers=auth(tok_admin),
                      json={**j, "jam_mulai": "12:00", "jam_selesai": "11:00"}).status_code == 400
        assert c.put(f"/api/admin/jadwal/{jid}", headers=auth(tok_admin),
                     json={**j, "jam_selesai": "13:00"}).json()["jam_selesai"] == "13:00"
        login(c, "baru@klinik.local", "dokter123")  # akun login dokter baru berfungsi
        assert c.delete(f"/api/admin/dokter/{did}", headers=auth(tok_admin)).status_code == 409  # punya pendaftaran
        assert c.delete(f"/api/admin/dokter/{did_baru}", headers=auth(tok_admin)).status_code == 200
        assert c.post("/api/auth/login", json={"email": "baru@klinik.local", "password": "dokter123"}).status_code == 401

        # ---------- admin: pasien (FR-10)
        r = c.post("/api/admin/pasien", headers=auth(tok_admin),
                   json={"nama": "Siti", "email": "siti@test.id", "password": "rahasia1"})
        assert r.status_code == 201
        sid = r.json()["id"]
        assert c.put(f"/api/admin/pasien/{sid}", headers=auth(tok_admin),
                     json={"nama": "Siti Aminah", "email": "siti@test.id"}).json()["nama"] == "Siti Aminah"
        assert any(p["email"] == "siti@test.id" for p in c.get("/api/admin/pasien?q=siti", headers=auth(tok_admin)).json())
        assert c.delete(f"/api/admin/pasien/{sid}", headers=auth(tok_admin)).status_code == 200

        # ---------- dashboard admin
        d = c.get("/api/admin/dashboard", headers=auth(tok_admin)).json()
        assert d["stat"]["pendaftaran"] == 2 and d["per_status"]["Dikonfirmasi"] == 1

        # hapus pendaftaran
        assert c.delete(f"/api/admin/pendaftaran/{pid}", headers=auth(tok_admin)).status_code == 200

        # validasi Pydantic -> pesan terbaca
        r = c.post("/api/pasien/pendaftaran", headers=auth(tok_pasien), json={"dokter_id": "abc"})
        assert r.status_code == 422 and "detail" in r.json()

    print("SEMUA TES API LULUS")


if __name__ == "__main__":
    main()
