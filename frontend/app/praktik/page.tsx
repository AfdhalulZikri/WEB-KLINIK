"use client";

import Link from "next/link";
import RequireRole from "@/components/RequireRole";
import { Alert, Badge, Empty, Loading, PageHead } from "@/components/ui";
import { useApi } from "@/lib/hooks";
import { STATUS } from "@/lib/format";
import type { DokterDashboard } from "@/lib/types";

function Content() {
  const { data, error, loading } = useApi<DokterDashboard>("/api/praktik/dashboard");
  if (!data) return error ? <Alert>{error}</Alert> : loading ? <Loading /> : null;

  return (
    <>
      <PageHead title={data.dokter.nama}>
        <span className="muted">{data.dokter.spesialisasi}</span>
      </PageHead>

      <div className="grid cols-4 section">
        {STATUS.map((s) => (
          <div className="card stat" key={s}>
            <div className="num">{data.hitung[s]}</div>
            <div className="lbl">{s}</div>
          </div>
        ))}
      </div>

      <section className="section">
        <h2>Praktik Hari Ini ({data.hari_ini})</h2>
        {data.jadwal_hari_ini.length ? (
          <p>
            {data.jadwal_hari_ini.map((j) => (
              <span className="chip" key={j.id}>
                {j.jam_mulai} - {j.jam_selesai}
              </span>
            ))}
          </p>
        ) : (
          <p className="muted">Tidak ada jadwal praktik hari ini.</p>
        )}

        {data.pasien_hari_ini.length ? (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Pasien</th>
                  <th>Layanan</th>
                  <th>Keluhan</th>
                  <th>Status</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {data.pasien_hari_ini.map((p) => (
                  <tr key={p.id}>
                    <td>{p.pasien.nama}</td>
                    <td>{p.layanan.nama_layanan}</td>
                    <td>{p.keluhan}</td>
                    <td>
                      <Badge status={p.status} />
                    </td>
                    <td>
                      <Link className="btn btn-ghost btn-sm" href={`/praktik/pendaftaran/${p.id}`}>
                        Detail
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <Empty>Belum ada pasien terdaftar untuk hari ini.</Empty>
        )}
      </section>
    </>
  );
}

export default function DokterDashboardPage() {
  return (
    <RequireRole roles={["dokter"]}>
      <Content />
    </RequireRole>
  );
}
