"use client";

import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import RequireRole from "@/components/RequireRole";
import { Empty, FlashView, Loading, PageHead } from "@/components/ui";
import type { FlashMsg } from "@/components/ui";
import { api, errMsg } from "@/lib/api";
import { useApi } from "@/lib/hooks";
import { STATUS, tgl } from "@/lib/format";
import type { Pendaftaran } from "@/lib/types";

function buildQuery(status: string, q: string): string {
  const p = new URLSearchParams();
  if (status) p.set("status", status);
  if (q.trim()) p.set("q", q.trim());
  const s = p.toString();
  return s ? `?${s}` : "";
}

function Content() {
  const [status, setStatus] = useState("");
  const [q, setQ] = useState("");
  const [query, setQuery] = useState("");
  const [flash, setFlash] = useState<FlashMsg | null>(null);

  // Tautan dari dashboard: /admin/pendaftaran?status=Menunggu
  useEffect(() => {
    const s = new URLSearchParams(window.location.search).get("status");
    if (s && STATUS.some((x) => x === s)) {
      setStatus(s);
      setQuery(buildQuery(s, ""));
    }
  }, []);

  const { data, error, loading, reload } = useApi<Pendaftaran[]>(`/api/admin/pendaftaran${query}`);

  function onFilter(e: FormEvent) {
    e.preventDefault();
    setQuery(buildQuery(status, q));
  }

  function reset() {
    setStatus("");
    setQ("");
    setQuery("");
  }

  async function ubahStatus(id: number, baru: string) {
    try {
      await api(`/api/admin/pendaftaran/${id}/status`, { method: "PUT", body: { status: baru } });
      setFlash({ kind: "success", text: `Status pendaftaran #${id} diubah menjadi ${baru}.` });
      reload();
    } catch (e) {
      setFlash({ kind: "error", text: errMsg(e) });
      reload();
    }
  }

  async function hapus(id: number) {
    if (!window.confirm("Hapus data pendaftaran ini?")) return;
    try {
      await api(`/api/admin/pendaftaran/${id}`, { method: "DELETE" });
      setFlash({ kind: "success", text: "Data pendaftaran dihapus." });
      reload();
    } catch (e) {
      setFlash({ kind: "error", text: errMsg(e) });
    }
  }

  return (
    <>
      <PageHead title="Data Pendaftaran" />
      <FlashView flash={flash ?? (error ? { kind: "error", text: error } : null)} />

      <form className="filters" onSubmit={onFilter}>
        <input type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Cari nama pasien" />
        <select value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="">Semua status</option>
          {STATUS.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
        <button className="btn btn-sm" type="submit">
          Filter
        </button>
        {query ? (
          <button className="btn btn-ghost btn-sm" type="button" onClick={reset}>
            Reset
          </button>
        ) : null}
      </form>

      {!data ? (
        loading ? <Loading /> : null
      ) : data.length === 0 ? (
        <Empty>Tidak ada data pendaftaran.</Empty>
      ) : (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>#</th>
                <th>Tanggal</th>
                <th>Pasien</th>
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
                  <td>{p.id}</td>
                  <td>{tgl(p.tanggal)}</td>
                  <td>
                    {p.pasien.nama}
                    <small>{p.pasien.nomor_telepon || ""}</small>
                  </td>
                  <td>{p.dokter.nama}</td>
                  <td>{p.layanan.nama_layanan}</td>
                  <td>{p.keluhan}</td>
                  <td>
                    <select
                      className="inline-select"
                      aria-label={`Status pendaftaran ${p.id}`}
                      value={p.status}
                      onChange={(e) => ubahStatus(p.id, e.target.value)}
                    >
                      {STATUS.map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td>
                    <button className="btn btn-danger btn-sm" type="button" onClick={() => hapus(p.id)}>
                      Hapus
                    </button>
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

export default function AdminPendaftaranPage() {
  return (
    <RequireRole roles={["admin"]}>
      <Content />
    </RequireRole>
  );
}
