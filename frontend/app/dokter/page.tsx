"use client";

import Link from "next/link";
import { useAuth } from "@/components/AuthProvider";
import { Alert, Empty, Loading, PageHead } from "@/components/ui";
import { useApi } from "@/lib/hooks";
import type { Dokter } from "@/lib/types";

export default function DokterPage() {
  const { user } = useAuth();
  const { data, error, loading } = useApi<Dokter[]>("/api/dokter");

  return (
    <>
      <PageHead title="Dokter & Jadwal Praktik" />
      {error ? <Alert>{error}</Alert> : null}
      {!data ? (
        loading ? <Loading /> : null
      ) : data.length === 0 ? (
        <Empty>Belum ada dokter.</Empty>
      ) : (
        <div className="grid cols-2">
          {data.map((d) => (
            <div className="card" key={d.id}>
              <h2>{d.nama}</h2>
              <p className="muted">{d.spesialisasi}</p>
              {d.jadwal.length ? (
                <>
                  <table>
                    <tbody>
                      {d.jadwal.map((j) => (
                        <tr key={j.id}>
                          <td>{j.hari}</td>
                          <td>
                            {j.jam_mulai} - {j.jam_selesai}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <p>
                    {user?.role === "pasien" ? (
                      <Link className="btn btn-sm" href={`/pasien/daftar?dokter_id=${d.id}`}>
                        Daftar ke dokter ini
                      </Link>
                    ) : null}
                    {!user ? (
                      <Link className="btn btn-sm" href="/login?next=/pasien/daftar">
                        Masuk untuk mendaftar
                      </Link>
                    ) : null}
                  </p>
                </>
              ) : (
                <p className="muted">Jadwal belum tersedia.</p>
              )}
            </div>
          ))}
        </div>
      )}
    </>
  );
}
