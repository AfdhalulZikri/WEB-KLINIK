"use client";

import { Alert, Empty, Loading, PageHead } from "@/components/ui";
import { useApi } from "@/lib/hooks";
import { rupiah } from "@/lib/format";
import type { Layanan } from "@/lib/types";

export default function LayananPage() {
  const { data, error, loading } = useApi<Layanan[]>("/api/layanan");

  return (
    <>
      <PageHead title="Daftar Layanan" />
      {error ? <Alert>{error}</Alert> : null}
      {!data ? (
        loading ? <Loading /> : null
      ) : data.length === 0 ? (
        <Empty>Belum ada layanan.</Empty>
      ) : (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Layanan</th>
                <th>Deskripsi</th>
                <th>Harga</th>
              </tr>
            </thead>
            <tbody>
              {data.map((l) => (
                <tr key={l.id}>
                  <td>
                    <strong>{l.nama_layanan}</strong>
                  </td>
                  <td>{l.deskripsi}</td>
                  <td>{rupiah(l.harga)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
