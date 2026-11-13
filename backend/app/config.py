import os

from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL", "").strip()
if not DATABASE_URL:
    raise RuntimeError(
        "DATABASE_URL belum diatur. Salin .env.example menjadi .env lalu isi dengan "
        "connection string PostgreSQL, contoh: "
        "postgresql+psycopg2://postgres:password@localhost:5432/klinik"
    )
# Heroku/Render/Neon kadang memakai skema "postgres://" atau "postgresql://"
if DATABASE_URL.startswith("postgres://"):
    DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql+psycopg2://", 1)
elif DATABASE_URL.startswith("postgresql://"):
    DATABASE_URL = DATABASE_URL.replace("postgresql://", "postgresql+psycopg2://", 1)
if not DATABASE_URL.startswith("postgresql"):
    raise RuntimeError("Aplikasi ini hanya mendukung PostgreSQL (sesuai SRS).")

SECRET_KEY = os.getenv("SECRET_KEY", "dev-only-ganti-di-produksi-0123456789abcdef")
TOKEN_EXPIRE_HOURS = int(os.getenv("TOKEN_EXPIRE_HOURS", "12"))

FRONTEND_URLS = [
    u.strip().rstrip("/")
    for u in os.getenv("FRONTEND_URL", "http://localhost:3000").split(",")
    if u.strip()
]
CORS_ORIGIN_REGEX = os.getenv("CORS_ORIGIN_REGEX", "").strip() or None

KLINIK = {
    "nama": os.getenv("KLINIK_NAMA", "Klinik Sehat Sentosa"),
    "alamat": os.getenv("KLINIK_ALAMAT", "Jl. Teuku Umar No. 10, Banda Aceh"),
    "telepon": os.getenv("KLINIK_TELEPON", "(0651) 123456"),
    "jam": os.getenv("KLINIK_JAM", "Senin - Sabtu, 08.00 - 20.00 WIB"),
}
