from datetime import date, datetime, time
from typing import List, Optional

from sqlalchemy import Date, DateTime, ForeignKey, Integer, String, Text, Time
from sqlalchemy.orm import Mapped, mapped_column, relationship

from .database import Base
from .utils import HARI


class User(Base):
    """Tabel Users (SRS 9.1). role: pasien | dokter | admin.
    Kolom nomor_telepon ditambahkan karena halaman registrasi (SRS 11.1) memintanya."""

    __tablename__ = "users"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    nama: Mapped[str] = mapped_column(String(100))
    email: Mapped[str] = mapped_column(String(120), unique=True, index=True)
    password: Mapped[str] = mapped_column(String(255))
    role: Mapped[str] = mapped_column(String(20), default="pasien")
    nomor_telepon: Mapped[Optional[str]] = mapped_column(String(20), nullable=True)

    pendaftaran: Mapped[List["Pendaftaran"]] = relationship(
        back_populates="pasien", cascade="all, delete-orphan", passive_deletes=True
    )
    dokter: Mapped[Optional["Dokter"]] = relationship(back_populates="user", uselist=False)


class Dokter(Base):
    """Tabel Dokter (SRS 9.2). user_id ditambahkan agar dokter bisa login (SRS 3.3)."""

    __tablename__ = "dokter"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    nama: Mapped[str] = mapped_column(String(100))
    spesialisasi: Mapped[str] = mapped_column(String(100))
    nomor_telepon: Mapped[Optional[str]] = mapped_column(String(20), nullable=True)
    user_id: Mapped[Optional[int]] = mapped_column(
        ForeignKey("users.id", ondelete="SET NULL"), unique=True, nullable=True
    )

    user: Mapped[Optional["User"]] = relationship(back_populates="dokter")
    jadwal: Mapped[List["Jadwal"]] = relationship(
        back_populates="dokter", cascade="all, delete-orphan", passive_deletes=True
    )
    pendaftaran: Mapped[List["Pendaftaran"]] = relationship(back_populates="dokter")

    @property
    def jadwal_urut(self) -> List["Jadwal"]:
        return sorted(self.jadwal, key=lambda j: (HARI.index(j.hari), j.jam_mulai))

    @property
    def hari_praktik(self) -> List[str]:
        return sorted({j.hari for j in self.jadwal}, key=HARI.index)


class Layanan(Base):
    """Tabel Layanan (SRS 9.3)."""

    __tablename__ = "layanan"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    nama_layanan: Mapped[str] = mapped_column(String(100))
    deskripsi: Mapped[str] = mapped_column(Text, default="")
    harga: Mapped[int] = mapped_column(Integer, default=0)

    pendaftaran: Mapped[List["Pendaftaran"]] = relationship(back_populates="layanan")


class Jadwal(Base):
    """Tabel Jadwal (SRS 9.4)."""

    __tablename__ = "jadwal"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    dokter_id: Mapped[int] = mapped_column(ForeignKey("dokter.id", ondelete="CASCADE"))
    hari: Mapped[str] = mapped_column(String(10))
    jam_mulai: Mapped[time] = mapped_column(Time)
    jam_selesai: Mapped[time] = mapped_column(Time)

    dokter: Mapped["Dokter"] = relationship(back_populates="jadwal")


class Pendaftaran(Base):
    """Tabel Pendaftaran (SRS 9.5). status: Menunggu | Dikonfirmasi | Selesai | Dibatalkan."""

    __tablename__ = "pendaftaran"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    pasien_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"))
    dokter_id: Mapped[int] = mapped_column(ForeignKey("dokter.id"))
    layanan_id: Mapped[int] = mapped_column(ForeignKey("layanan.id"))
    tanggal: Mapped[date] = mapped_column(Date)
    keluhan: Mapped[str] = mapped_column(Text)
    status: Mapped[str] = mapped_column(String(20), default="Menunggu")
    dibuat: Mapped[datetime] = mapped_column(DateTime, default=datetime.now)

    pasien: Mapped["User"] = relationship(back_populates="pendaftaran")
    dokter: Mapped["Dokter"] = relationship(back_populates="pendaftaran")
    layanan: Mapped["Layanan"] = relationship(back_populates="pendaftaran")
