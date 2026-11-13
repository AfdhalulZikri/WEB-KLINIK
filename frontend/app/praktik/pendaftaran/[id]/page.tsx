"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import RequireRole from "@/components/RequireRole";
import { Alert, Badge, Loading } from "@/components/ui";
import { useApi } from "@/lib/hooks";
import { rupiah, tgl } from "@/lib/format";
import type { Pendaftaran } from "@/lib/types";

function Content() {
  const params = useParams();
  const raw = params?.id;
  const id = Array.isArray(raw) ? raw[0] : raw;
  const { data, error, loading } = useApi<Pendaftaran>(id ? `/api/praktik/pendaftaran/${id}` : null);

  return (
    <div className="card narrow">
      <h1>Detail Pendaftaran {id ? `#${id}` : ""}</h1>
      {error ? <Alert>{error}</Alert> : null}
      {!data ? (
        loading ? <Loading /> : null
      ) : (
        <dl className="detail">
          <dt>Pasien</dt>
          <dd>{data.pasien.nama}</dd>
          <dt>Email</dt>
          <dd>{data.pasien.email}</dd>
          <dt>Telepon</dt>
          <dd>{data.pasien.nomor_telepon || "-"}</dd>
          <dt>Tanggal kunjungan</dt>
          <dd>{tgl(data.tanggal)}</dd>
          <dt>Layanan</dt>
          <dd>
            {data.layanan.nama_layanan} ({rupiah(data.layanan.harga)})
          </dd>
          <dt>Keluhan</dt>
          <dd>{data.keluhan}</dd>
          <dt>Status</dt>
          <dd>
            <Badge status={data.status} />
          </dd>
          <dt>Didaftarkan pada</dt>
          <dd>{data.dibuat ? `${tgl(data.dibuat)} ${data.dibuat.slice(11, 16)}` : "-"}</dd>
        </dl>
      )}
      <p style={{ marginTop: "1.25rem" }}>
        <Link className="btn btn-ghost" href="/praktik/pasien">
          &larr; Kembali
        </Link>
      </p>
    </div>
  );
}

export default function DokterDetailPage() {
  return (
    <RequireRole roles={["dokter"]}>
      <Content />
    </RequireRole>
  );
}
