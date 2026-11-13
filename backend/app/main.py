import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from sqlalchemy.exc import IntegrityError

from .config import CORS_ORIGIN_REGEX, FRONTEND_URLS, KLINIK
from .database import Base, SessionLocal, engine
from .routers import admin, auth, dokter, pasien, public
from .seed import seed

log = logging.getLogger("klinik")


@asynccontextmanager
async def lifespan(app: FastAPI):
    Base.metadata.create_all(bind=engine)
    try:
        with SessionLocal() as db:
            seed(db)
    except IntegrityError:
        # Dua instance menyemai data bersamaan (mis. serverless); salah satunya cukup.
        log.warning("Seed dilewati: data awal sudah dibuat oleh proses lain.")
    yield


app = FastAPI(title=f"API {KLINIK['nama']}", version="1.0.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=FRONTEND_URLS,
    allow_origin_regex=CORS_ORIGIN_REGEX,
    allow_credentials=False,  # autentikasi memakai header Authorization (Bearer), bukan cookie
    allow_methods=["*"],
    allow_headers=["*"],
)

for r in (public.router, auth.router, pasien.router, admin.router, dokter.router):
    app.include_router(r)


@app.get("/", tags=["Publik"])
def root():
    return {"layanan": "REST API Klinik", "dokumentasi": "/docs"}


@app.get("/api/health", tags=["Publik"])
def health():
    return {"status": "ok"}


@app.exception_handler(RequestValidationError)
async def validation_error(request: Request, exc: RequestValidationError):
    """Ubah error validasi Pydantic menjadi satu pesan {"detail": "..."} yang mudah ditampilkan."""
    pesan = []
    for err in exc.errors():
        lokasi = [str(x) for x in err.get("loc", []) if x not in ("body", "query", "path")]
        pesan.append(f"{'.'.join(lokasi) or 'data'}: {err.get('msg', 'tidak valid')}")
    return JSONResponse(status_code=422, content={"detail": "Data tidak valid - " + "; ".join(pesan)})
