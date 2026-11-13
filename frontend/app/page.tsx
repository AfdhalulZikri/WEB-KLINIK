"use client";

import Link from "next/link";
import { useAuth } from "@/components/AuthProvider";
import { Alert, Empty, Loading } from "@/components/ui";
import { useApi, useInfo } from "@/lib/hooks";
import { rupiah } from "@/lib/format";
import type { Dokter, Layanan } from "@/lib/types";

export default function HomePage() {
  const { user } = useAuth();
  const info = useInfo();
  const layanan = useApi<Layanan[]>("/api/layanan");
  const dokter = useApi<Dokter[]>("/api/dokter");

  return (
    <>
      <section className="hero">
        <h1>Daftar ke dokter, tanpa antre di loket.</h1>
        <p>Lihat layanan dan jadwal dokter, lalu daftar konsultasi secara online dari rumah.</p>
        <div className="actions">
          {user?.role === "pasien" ? (
            <Link className="btn btn-light" href="/pasien/daftar">
              Daftar Konsultasi
            </Link>
          ) : null}
          {!user ? (
            <Link className="btn btn-light" href="/register">
              Buat Akun &amp; Daftar
            </Link>
          ) : null}
        </div>
        <div className="info">
          <span>&#128205; {info.alamat}</span>
          <span>&#128222; {info.telepon}</span>
          <span>&#128339; {info.jam}</span>
        </div>
      </section>

      <section className="section">
        <div className="section-head">
          <h2>Layanan Kami</h2>
          <Link href="/layanan">Lihat semua</Link>
        </div>
        {layanan.error ? <Alert>{layanan.error}</Alert> : null}
        {!layanan.data ? (
          layanan.loading ? <Loading /> : null
        ) : layanan.data.length === 0 ? (
          <Empty>Belum ada layanan.</Empty>
        ) : (
          <div className="grid cols-3">
            {layanan.data.slice(0, 6).map((l) => (
              <div className="card" key={l.id}>
                <h2>{l.nama_layanan}</h2>
                <p className="muted">{l.deskripsi}</p>
                <strong>{rupiah(l.harga)}</strong>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="section">
        <div className="section-head">
          <h2>Dokter</h2>
          <Link href="/dokter">Lihat semua</Link>
        </div>
        {dokter.error ? <Alert>{dokter.error}</Alert> : null}
        {!dokter.data ? (
          dokter.loading ? <Loading /> : null
        ) : dokter.data.length === 0 ? (
          <Empty>Belum ada dokter.</Empty>
        ) : (
          <div className="grid cols-3">
            {dokter.data.slice(0, 6).map((d) => (
              <div className="card" key={d.id}>
                <h2>{d.nama}</h2>
                <p className="muted">{d.spesialisasi}</p>
                {d.hari_praktik.length ? (
                  d.hari_praktik.map((h) => (
                    <span className="chip" key={h}>
                      {h}
                    </span>
                  ))
                ) : (
                  <span className="muted">Jadwal belum tersedia</span>
                )}
              </div>
            ))}
          </div>
        )}
      </section>
    </>
  );
}
