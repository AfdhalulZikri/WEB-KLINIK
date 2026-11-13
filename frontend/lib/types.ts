// Bentuk data yang dikirim backend (lihat backend/app/serializers.py).

export type Role = "pasien" | "dokter" | "admin";
export type Status = "Menunggu" | "Dikonfirmasi" | "Selesai" | "Dibatalkan";

export interface User {
  id: number;
  nama: string;
  email: string;
  role: Role;
  nomor_telepon: string | null;
}

export interface PasienRow extends User {
  jumlah_pendaftaran: number;
}

export interface Info {
  nama: string;
  alamat: string;
  telepon: string;
  jam: string;
}

export interface Layanan {
  id: number;
  nama_layanan: string;
  deskripsi: string;
  harga: number;
}

export interface Jadwal {
  id: number;
  dokter_id: number;
  hari: string;
  jam_mulai: string; // "HH:MM"
  jam_selesai: string; // "HH:MM"
}

export interface Dokter {
  id: number;
  nama: string;
  spesialisasi: string;
  nomor_telepon: string | null;
  hari_praktik: string[];
  jadwal: Jadwal[];
  email?: string | null; // hanya dikirim ke admin
}

export interface Pendaftaran {
  id: number;
  tanggal: string; // "YYYY-MM-DD"
  keluhan: string;
  status: Status;
  dibuat: string | null;
  pasien: { id: number; nama: string; email: string; nomor_telepon: string | null };
  dokter: { id: number; nama: string; spesialisasi: string };
  layanan: { id: number; nama_layanan: string; harga: number };
}

export interface TokenResponse {
  access_token: string;
  token_type: string;
  user: User;
}

export type Hitung = Record<Status, number>;

export interface PasienDashboard {
  total: number;
  hitung: Hitung;
  mendatang: Pendaftaran[];
  terbaru: Pendaftaran[];
}

export interface AdminDashboard {
  tanggal: string;
  stat: { pasien: number; dokter: number; layanan: number; pendaftaran: number };
  per_status: Hitung;
  terbaru: Pendaftaran[];
}

export interface DokterDashboard {
  dokter: Dokter;
  hari_ini: string;
  tanggal_hari_ini: string;
  jadwal_hari_ini: Jadwal[];
  pasien_hari_ini: Pendaftaran[];
  hitung: Hitung;
}

export interface DokterJadwal {
  dokter: Dokter;
  jadwal: Jadwal[];
}
