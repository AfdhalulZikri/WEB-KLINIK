"use client";

import Link from "next/link";
import RequireRole from "@/components/RequireRole";
import { Alert, Badge, Empty, Loading, PageHead } from "@/components/ui";
import { useApi } from "@/lib/hooks";
import { STATUS, tgl } from "@/lib/format";
import type { AdminDashboard } from "@/lib/types";

function Content() {
  const { data, error, loading } = useApi<AdminDashboard>("/api/admin/dashboard");
  if (!data) return error ? <Alert>{error}</Alert> : loading ? <Loading /> : null;

  const kartu: [string, number][] = [
    ["Pasien", data.stat.pasien],
    ["Dokter", data.stat.dokter],
    ["Layanan", data.stat.layanan],
    ["Pendaftaran", data.stat.pendaftaran],
  ];

  return (
    <>
      <PageHead title="Dashboard Admin">
        <span className="muted">{tgl(data.tanggal)}</span>
      </PageHead>

      <div className="grid cols-4 section">
        {kartu.map(([label, n]) => (
          <div className="card stat" key={label}>
            <div className="num">{n}</div>
            <div className="lbl">{label}</div>
          </div>
        ))}
      </div>

      <div className="grid cols-4 section">
        {STATUS.map((s) => (
          <Link className="card stat" key={s} href={`/admin/pendaftaran?status=${s}`}>
            <div className="num">{data.per_status[s]}</div>
            <div className="lbl">
              <Badge status={s} />
            </div>
          </Link>
        ))}
      </div>

      <section className="section">
        <div className="section-head">
          <h2>Pendaftaran Terbaru</h2>
          <Link href="/admin/pendaftaran">Kelola semua</Link>
        </div>
        {data.terbaru.length ? (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>#</th>
                  <th>Pasien</th>
                  <th>Dokter</th>
                  <th>Layanan</th>
                  <th>Tanggal</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {data.terbaru.map((p) => (
                  <tr key={p.id}>
                    <td>{p.id}</td>
                    <td>{p.pasien.nama}</td>
                    <td>{p.dokter.nama}</td>
                    <td>{p.layanan.nama_layanan}</td>
                    <td>{tgl(p.tanggal)}</td>
                    <td>
                      <Badge status={p.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <Empty>Belum ada pendaftaran.</Empty>
        )}
      </section>
    </>
  );
}

export default function AdminDashboardPage() {
  return (
    <RequireRole roles={["admin"]}>
      <Content />
    </RequireRole>
  );
}
