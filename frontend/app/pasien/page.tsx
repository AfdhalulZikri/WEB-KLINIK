"use client";

import Link from "next/link";
import { useAuth } from "@/components/AuthProvider";
import RequireRole from "@/components/RequireRole";
import { Alert, Badge, Empty, Loading, PageHead } from "@/components/ui";
import { useApi } from "@/lib/hooks";
import { STATUS, tgl } from "@/lib/format";
import type { Pendaftaran, PasienDashboard } from "@/lib/types";

function Tabel({ data }: { data: Pendaftaran[] }) {
  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr>
            <th>Tanggal</th>
            <th>Dokter</th>
            <th>Layanan</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {data.map((p) => (
            <tr key={p.id}>
              <td>{tgl(p.tanggal)}</td>
              <td>{p.dokter.nama}</td>
              <td>{p.layanan.nama_layanan}</td>
              <td>
                <Badge status={p.status} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function Content() {
  const { user } = useAuth();
  const { data, error, loading } = useApi<PasienDashboard>("/api/pasien/dashboard");

  if (!data) return error ? <Alert>{error}</Alert> : loading ? <Loading /> : null;

  return (
    <>
      <PageHead title={`Halo, ${user?.nama ?? ""}`}>
        <Link className="btn" href="/pasien/daftar">
          + Daftar Konsultasi
        </Link>
      </PageHead>

      <div className="grid cols-4 section">
        <div className="card stat">
          <div className="num">{data.total}</div>
          <div className="lbl">Total pendaftaran</div>
        </div>
        {STATUS.filter((s) => s !== "Dibatalkan").map((s) => (
          <div className="card stat" key={s}>
            <div className="num">{data.hitung[s]}</div>
            <div className="lbl">{s}</div>
          </div>
        ))}
      </div>

      <section className="section">
        <h2>Kunjungan Mendatang</h2>
        {data.mendatang.length ? <Tabel data={data.mendatang} /> : <Empty>Belum ada kunjungan mendatang.</Empty>}
      </section>

      <section className="section">
        <div className="section-head">
          <h2>Pendaftaran Terbaru</h2>
          <Link href="/pasien/riwayat">Lihat semua</Link>
        </div>
        {data.terbaru.length ? <Tabel data={data.terbaru} /> : <Empty>Anda belum pernah mendaftar.</Empty>}
      </section>
    </>
  );
}

export default function PasienDashboardPage() {
  return (
    <RequireRole roles={["pasien"]}>
      <Content />
    </RequireRole>
  );
}
