"use client";

import { useState } from "react";
import type { FormEvent } from "react";
import Link from "next/link";
import RequireRole from "@/components/RequireRole";
import { Alert, Badge, Empty, Loading, PageHead } from "@/components/ui";
import { useApi } from "@/lib/hooks";
import { STATUS, tgl } from "@/lib/format";
import type { Pendaftaran } from "@/lib/types";

function Content() {
  const [status, setStatus] = useState("");
  const [tanggal, setTanggal] = useState("");
  const [query, setQuery] = useState("");

  const { data, error, loading } = useApi<Pendaftaran[]>(`/api/praktik/pendaftaran${query}`);

  function onFilter(e: FormEvent) {
    e.preventDefault();
    const p = new URLSearchParams();
    if (status) p.set("status", status);
    if (tanggal) p.set("tanggal", tanggal);
    const s = p.toString();
    setQuery(s ? `?${s}` : "");
  }

  function reset() {
    setStatus("");
    setTanggal("");
    setQuery("");
  }

  return (
    <>
      <PageHead title="Daftar Pasien Terdaftar" />
      <form className="filters" onSubmit={onFilter}>
        <input type="date" value={tanggal} onChange={(e) => setTanggal(e.target.value)} />
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

      {error ? <Alert>{error}</Alert> : null}
      {!data ? (
        loading ? <Loading /> : null
      ) : data.length === 0 ? (
        <Empty>Tidak ada data pendaftaran.</Empty>
      ) : (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Tanggal</th>
                <th>Pasien</th>
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
      )}
    </>
  );
}

export default function DokterPasienPage() {
  return (
    <RequireRole roles={["dokter"]}>
      <Content />
    </RequireRole>
  );
}
