# Sistem Informasi Pendaftaran & Manajemen Layanan Klinik Berbasis Web

Implementasi **SRS Kelompok 4** dengan tech stack persis seperti SRS bagian 7:

```
USER -> Next.js (Frontend, TypeScript) -> REST API -> FastAPI (Backend, Python) -> PostgreSQL
```

| Bagian   | Teknologi                           | Folder      |
|----------|-------------------------------------|-------------|
| Frontend | Next.js 14 (App Router) + TypeScript | `frontend/` |
| Backend  | FastAPI + SQLAlchemy + PyJWT        | `backend/`  |
| Database | PostgreSQL                          | `backend/schema.sql` |

Tabel kesesuaian lengkap dengan SRS (FR-01 s.d. FR-16): lihat [`docs/KESESUAIAN_SRS.md`](docs/KESESUAIAN_SRS.md).

---

## 1. Menjalankan di komputer sendiri

Prasyarat: **Python 3.10+**, **Node.js 18.17+** (disarankan 20), dan **PostgreSQL** yang sudah berjalan.

### a. Database
Buat database kosong bernama `klinik` (tabel dibuat otomatis oleh backend):
```bash
createdb klinik            # atau buat lewat pgAdmin
```

### b. Backend (port 8000)
```bash
cd backend
python -m venv .venv
source .venv/bin/activate          # Windows: .venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env               # Windows: copy .env.example .env
# edit .env -> isi DATABASE_URL (password PostgreSQL Anda) dan SECRET_KEY
python run.py
```
Buka http://127.0.0.1:8000/docs untuk dokumentasi interaktif REST API.
Tabel dan data contoh dibuat otomatis saat pertama dijalankan.

### c. Frontend (port 3000)
Di terminal lain:
```bash
cd frontend
cp .env.local.example .env.local   # Windows: copy .env.local.example .env.local
npm install
npm run dev
```
Buka http://localhost:3000

### Akun contoh (dibuat otomatis, **ganti sebelum dipakai sungguhan**)

| Role   | Email                | Password  |
|--------|----------------------|-----------|
| Admin  | admin@klinik.local   | admin123  |
| Dokter | dokter1@klinik.local | dokter123 |
| Dokter | dokter2@klinik.local | dokter123 |
| Dokter | dokter3@klinik.local | dokter123 |
| Pasien | pasien@klinik.local  | pasien123 |

Pasien baru bisa mendaftar sendiri lewat halaman **Daftar Akun**.

---

## 2. Pengujian

```bash
# Backend (butuh database PostgreSQL KHUSUS TEST, isinya dihapus tiap tes)
createdb klinik_test
export TEST_DATABASE_URL=postgresql+psycopg2://postgres:PASSWORD@localhost:5432/klinik_test
cd backend && python tests/test_api.py

# Frontend
cd frontend && npm run typecheck && npm run build
```

---

## 3. Deploy agar bisa diakses publik (Vercel + Neon)

Backend dan frontend dideploy sebagai **dua project Vercel** dari repo GitHub yang sama
(sesuai SRS: Version Control = Git & GitHub).

1. **Database**: buat database PostgreSQL gratis di [Neon](https://neon.tech) (atau Supabase). Salin connection string
   (`postgresql://...`). SQLite tidak dipakai dan tidak bisa dipakai di Vercel.
2. **Upload** folder ini ke GitHub (file `.env` tidak ikut: sudah ada di `.gitignore`).
3. **Backend**: di vercel.com pilih *Add New > Project*, pilih repo, atur **Root Directory = `backend`**.
   Isi Environment Variables:
   - `DATABASE_URL` = connection string Neon
   - `SECRET_KEY` = string acak panjang (wajib)
   - `FRONTEND_URL` = (isi setelah langkah 4, mis. `https://klinik-anda.vercel.app`)
   - opsional: `KLINIK_NAMA`, `KLINIK_ALAMAT`, `KLINIK_TELEPON`, `KLINIK_JAM`

   Deploy, lalu catat URL-nya (mis. `https://klinik-api.vercel.app`). Cek `https://.../api/health`.
4. **Frontend**: buat project Vercel kedua dari repo yang sama, **Root Directory = `frontend`**, dengan variabel
   `NEXT_PUBLIC_API_URL` = URL backend (tanpa garis miring di akhir). Deploy.
5. Kembali ke project **backend**, isi `FRONTEND_URL` dengan URL frontend, lalu **Redeploy** (agar CORS mengizinkan).
6. Login sebagai admin dan **ganti password semua akun contoh**.

> Alternatif: backend juga bisa dideploy ke Render/Railway (perintah start: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`).

---

## 4. Struktur proyek

```
klinik-srs/
├── backend/
│   ├── run.py  schema.sql  requirements.txt  .env.example
│   ├── app/
│   │   ├── main.py            # aplikasi FastAPI, CORS, error handler
│   │   ├── config.py  database.py  models.py  security.py  deps.py
│   │   ├── serializers.py  seed.py  utils.py
│   │   └── routers/           # public, auth, pasien, admin, dokter
│   └── tests/test_api.py
├── frontend/
│   ├── app/                   # halaman: /, /layanan, /dokter, /login, /register,
│   │                          #   /pasien/*, /admin/*, /praktik/*
│   ├── components/            # AuthProvider, Navbar, Footer, RequireRole, ui
│   └── lib/                   # api.ts (klien REST), hooks.ts, types.ts, format.ts
└── docs/KESESUAIAN_SRS.md
```

## 5. Ringkasan REST API

| Area    | Endpoint (prefix `/api`)                                                                  |
|---------|-------------------------------------------------------------------------------------------|
| Publik  | `GET /info`, `GET /layanan`, `GET /dokter`                                                |
| Auth    | `POST /auth/register`, `POST /auth/login`, `GET /auth/me`                                 |
| Pasien  | `GET /pasien/dashboard`, `GET/PUT /pasien/profil`, `POST/GET /pasien/pendaftaran`, `POST /pasien/pendaftaran/{id}/batal` |
| Admin   | `/admin/dashboard`, CRUD `/admin/pasien`, `/admin/dokter`, `/admin/layanan`, `/admin/jadwal`; `GET /admin/pendaftaran`, `PUT /admin/pendaftaran/{id}/status`, `DELETE /admin/pendaftaran/{id}` |
| Dokter  | `GET /praktik/dashboard`, `/praktik/jadwal`, `/praktik/pendaftaran`, `/praktik/pendaftaran/{id}` |

Autentikasi memakai header `Authorization: Bearer <token>` (JWT, berlaku 12 jam secara default).

## 6. Catatan keamanan

- Password disimpan sebagai hash PBKDF2-SHA256 + salt (SRS 6.2), tidak pernah sebagai teks biasa.
- Hak akses dibatasi per role di sisi server (pasien/dokter/admin), bukan hanya disembunyikan di tampilan.
- Token login disimpan di `localStorage` browser. Ini praktik umum untuk SPA, tetapi rentan jika ada celah XSS;
  untuk keamanan lebih tinggi pertimbangkan cookie `HttpOnly`.
- Belum ada pembatasan percobaan login (rate limiting) dan belum ada migrasi skema (pertimbangkan Alembic).
- Selalu gunakan HTTPS di produksi dan ganti `SECRET_KEY` serta semua password akun contoh.
