-- Skema PostgreSQL sesuai SRS bagian 9 (Rancangan Database).
-- Aplikasi membuat tabel ini otomatis saat pertama dijalankan (SQLAlchemy create_all);
-- file ini disediakan sebagai dokumentasi / untuk dijalankan manual lewat pgAdmin atau psql.
--
-- Tambahan di luar SRS (dengan alasan):
--   users.nomor_telepon : halaman registrasi (SRS 11.1) meminta nomor telepon.
--   dokter.user_id      : agar dokter bisa login (SRS 3.3 & FR-02).
--   pendaftaran.dibuat  : waktu pendaftaran dibuat.

CREATE TABLE IF NOT EXISTS users (
    id             SERIAL PRIMARY KEY,
    nama           VARCHAR(100) NOT NULL,
    email          VARCHAR(120) NOT NULL UNIQUE,
    password       VARCHAR(255) NOT NULL,
    role           VARCHAR(20)  NOT NULL DEFAULT 'pasien'
                   CHECK (role IN ('pasien', 'dokter', 'admin')),
    nomor_telepon  VARCHAR(20)
);

CREATE TABLE IF NOT EXISTS dokter (
    id             SERIAL PRIMARY KEY,
    nama           VARCHAR(100) NOT NULL,
    spesialisasi   VARCHAR(100) NOT NULL,
    nomor_telepon  VARCHAR(20),
    user_id        INTEGER UNIQUE REFERENCES users(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS layanan (
    id             SERIAL PRIMARY KEY,
    nama_layanan   VARCHAR(100) NOT NULL,
    deskripsi      TEXT NOT NULL DEFAULT '',
    harga          INTEGER NOT NULL DEFAULT 0 CHECK (harga >= 0)
);

CREATE TABLE IF NOT EXISTS jadwal (
    id             SERIAL PRIMARY KEY,
    dokter_id      INTEGER NOT NULL REFERENCES dokter(id) ON DELETE CASCADE,
    hari           VARCHAR(10) NOT NULL
                   CHECK (hari IN ('Senin','Selasa','Rabu','Kamis','Jumat','Sabtu','Minggu')),
    jam_mulai      TIME NOT NULL,
    jam_selesai    TIME NOT NULL,
    CHECK (jam_selesai > jam_mulai)
);

CREATE TABLE IF NOT EXISTS pendaftaran (
    id             SERIAL PRIMARY KEY,
    pasien_id      INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    dokter_id      INTEGER NOT NULL REFERENCES dokter(id),
    layanan_id     INTEGER NOT NULL REFERENCES layanan(id),
    tanggal        DATE NOT NULL,
    keluhan        TEXT NOT NULL,
    status         VARCHAR(20) NOT NULL DEFAULT 'Menunggu'
                   CHECK (status IN ('Menunggu','Dikonfirmasi','Selesai','Dibatalkan')),
    dibuat         TIMESTAMP NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS ix_pendaftaran_pasien ON pendaftaran(pasien_id);
CREATE INDEX IF NOT EXISTS ix_pendaftaran_dokter_tanggal ON pendaftaran(dokter_id, tanggal);
CREATE INDEX IF NOT EXISTS ix_jadwal_dokter ON jadwal(dokter_id);
