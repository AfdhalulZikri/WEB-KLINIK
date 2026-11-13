"use client";

import { useState } from "react";
import Link from "next/link";
import RequireRole from "@/components/RequireRole";
import { Badge, Empty, FlashView, Loading, PageHead } from "@/components/ui";
import type { FlashMsg } from "@/components/ui";
import { api, errMsg } from "@/lib/api";
import { useApi } from "@/lib/hooks";
import { tgl } from "@/lib/format";
import type { Pendaftaran } from "@/lib/types";

function Content() {
  const { data, error, loading, reload } = useApi<Pendaftaran[]>("/api/pasien/pendaftaran");
  const [flash, setFlash] = useState<FlashMsg | null>(null);

  async function batal(id: number) {
    if (!window.confirm("Batalkan pendaftaran ini?")) return;
    try {
      await api(`/api/pasien/pendaftaran/${id}/batal`, { method: "POST" });
      setFlash({ kind: "success", text: "Pendaftaran dibatalkan." });
      reload();
    } catch (e) {
      setFlash({ kind: "error", text: errMsg(e) });
    }
  }

  return (
    <>
      <PageHead title="Status & Riwayat Pendaftaran">
        <Link className="btn" href="/pasien/daftar">
          + Daftar Konsultasi
        </Link>
      </PageHead>
      <FlashView flash={flash ?? (error ? { kind: "error", text: error } : null)} />
      {!data ? (
        loading ? <Loading /> : null
      ) : data.length === 0 ? (
        <Empty>Belum ada riwayat pendaftaran.</Empty>
      ) : (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Tanggal</th>
                <th>Dokter</th>
                <th>Layanan</th>
                <th>Keluhan</th>
                <th>Status</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {data.map((p) => (
                <tr key={p.id}>
                  <td>{tgl(p.tanggal)}</td>
                  <td>
                    {p.dokter.nama}
                    <small>{p.dokter.spesialisasi}</small>
                  </td>
                  <td>{p.layanan.nama_layanan}</td>
                  <td>{p.keluhan}</td>
                  <td>
                    <Badge status={p.status} />
                  </td>
                  <td>
                    {p.status === "Menunggu" ? (
                      <button className="btn btn-danger btn-sm" type="button" onClick={() => batal(p.id)}>
                        Batalkan
                      </button>
                    ) : null}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}

export default function RiwayatPage() {
  return (
    <RequireRole roles={["pasien"]}>
      <Content />
    </RequireRole>
  );
}
