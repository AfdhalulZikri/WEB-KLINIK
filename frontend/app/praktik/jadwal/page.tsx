"use client";

import RequireRole from "@/components/RequireRole";
import { Alert, Empty, Loading, PageHead } from "@/components/ui";
import { useApi } from "@/lib/hooks";
import type { DokterJadwal } from "@/lib/types";

function Content() {
  const { data, error, loading } = useApi<DokterJadwal>("/api/praktik/jadwal");
  if (!data) return error ? <Alert>{error}</Alert> : loading ? <Loading /> : null;

  return (
    <>
      <PageHead title="Jadwal Praktik" />
      {data.jadwal.length ? (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Hari</th>
                <th>Jam</th>
              </tr>
            </thead>
            <tbody>
              {data.jadwal.map((j) => (
                <tr key={j.id}>
                  <td>{j.hari}</td>
                  <td>
                    {j.jam_mulai} - {j.jam_selesai}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <Empty>Jadwal praktik belum diatur. Hubungi admin.</Empty>
      )}
    </>
  );
}

export default function DokterJadwalPage() {
  return (
    <RequireRole roles={["dokter"]}>
      <Content />
    </RequireRole>
  );
}
