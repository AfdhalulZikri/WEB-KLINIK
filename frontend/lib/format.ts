import type { Status } from "./types";

export const STATUS: Status[] = ["Menunggu", "Dikonfirmasi", "Selesai", "Dibatalkan"];
export const HARI = ["Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu", "Minggu"];

export function rupiah(n: number): string {
  return "Rp " + Math.round(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
}

/** "2026-11-09" -> "09-11-2026" */
export function tgl(iso: string | null | undefined): string {
  if (!iso) return "-";
  const [y, m, d] = iso.slice(0, 10).split("-");
  return `${d}-${m}-${y}`;
}

/** Tanggal hari ini (zona waktu perangkat) dalam format YYYY-MM-DD. */
export function todayISO(): string {
  const d = new Date();
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

/** Nama hari (Senin..Minggu) dari tanggal YYYY-MM-DD, atau "" jika tidak valid. */
export function namaHari(iso: string): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  if (!m) return "";
  const d = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
  if (Number.isNaN(d.getTime())) return "";
  return HARI[(d.getDay() + 6) % 7]; // getDay(): 0 = Minggu
}
