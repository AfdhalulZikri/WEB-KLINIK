"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "./AuthProvider";
import { useInfo } from "@/lib/hooks";

const MENU: Record<string, { href: string; label: string }[]> = {
  pasien: [
    { href: "/pasien", label: "Dashboard" },
    { href: "/pasien/daftar", label: "Daftar Konsultasi" },
    { href: "/pasien/riwayat", label: "Riwayat" },
    { href: "/pasien/profil", label: "Profil" },
  ],
  admin: [
    { href: "/admin", label: "Dashboard" },
    { href: "/admin/pasien", label: "Pasien" },
    { href: "/admin/dokter", label: "Dokter" },
    { href: "/admin/layanan", label: "Layanan" },
    { href: "/admin/jadwal", label: "Jadwal" },
    { href: "/admin/pendaftaran", label: "Pendaftaran" },
  ],
  dokter: [
    { href: "/praktik", label: "Dashboard" },
    { href: "/praktik/jadwal", label: "Jadwal Praktik" },
    { href: "/praktik/pasien", label: "Daftar Pasien" },
  ],
};

export default function Navbar() {
  const { user, logout } = useAuth();
  const info = useInfo();
  const router = useRouter();
  const submenu = user ? MENU[user.role] : undefined;

  return (
    <>
      <header className="topbar">
        <div className="container">
          <Link className="brand" href="/">
            &#10010; {info.nama}
          </Link>
          <nav className="nav">
            <Link href="/">Beranda</Link>
            <Link href="/layanan">Layanan</Link>
            <Link href="/dokter">Dokter</Link>
            {user ? (
              <>
                <span className="who">
                  {user.nama} ({user.role})
                </span>
                <button
                  className="linklike"
                  type="button"
                  onClick={() => {
                    logout();
                    router.push("/");
                  }}
                >
                  Keluar
                </button>
              </>
            ) : (
              <>
                <Link href="/login">Masuk</Link>
                <Link href="/register">Daftar Akun</Link>
              </>
            )}
          </nav>
        </div>
      </header>
      {submenu ? (
        <div className="subnav">
          <div className="container">
            {submenu.map((m) => (
              <Link key={m.href} href={m.href}>
                {m.label}
              </Link>
            ))}
          </div>
        </div>
      ) : null}
    </>
  );
}
