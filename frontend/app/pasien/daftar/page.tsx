"use client";

import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import RequireRole from "@/components/RequireRole";
import { Alert, Field, Loading } from "@/components/ui";
import { api, errMsg } from "@/lib/api";
import { useApi } from "@/lib/hooks";
import { namaHari, rupiah, todayISO } from "@/lib/format";
import type { Dokter, Layanan, Pendaftaran } from "@/lib/types";

function Content() {
  const router = useRouter();
  const dokterReq = useApi<Dokter[]>("/api/dokter");
  const layananReq = useApi<Layanan[]>("/api/layanan");

  const [dokterId, setDokterId] = useState("");
  const [layananId, setLayananId] = useState("");
  const [tanggal, setTanggal] = useState("");
  const [keluhan, setKeluhan] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  // Tautan dari halaman Dokter: /pasien/daftar?dokter_id=3
  useEffect(() => {
    const id = new URLSearchParams(window.location.search).get("dokter_id");
    if (id) setDokterId(id);
  }, []);

  if (!dokterReq.data || !layananReq.data) {
    const err = dokterReq.error || layananReq.error;
    return err ? <Alert>{err}</Alert> : <Loading />;
  }

  const dokterList = dokterReq.data.filter((d) => d.jadwal.length > 0);
  const terpilih = dokterList.find((d) => String(d.id) === dokterId);
  const hari = namaHari(tanggal);
  const hariCocok = terpilih && hari ? terpilih.hari_praktik.includes(hari) : true;

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      await api<Pendaftaran>("/api/pasien/pendaftaran", {
        method: "POST",
        body: {
          dokter_id: Number(dokterId),
          layanan_id: Number(layananId),
          tanggal,
          keluhan,
        },
      });
      router.replace("/pasien/riwayat");
    } catch (err) {
      setError(errMsg(err));
      setBusy(false);
    }
  }

  return (
    <div className="card narrow">
      <h1>Pendaftaran Konsultasi</h1>
      {error ? <Alert>{error}</Alert> : null}
      <form onSubmit={onSubmit}>
        <Field label="Dokter *">
          <select value={dokterId} onChange={(e) => setDokterId(e.target.value)} required>
            <option value="">- pilih dokter -</option>
            {dokterList.map((d) => (
              <option key={d.id} value={d.id}>
                {d.nama} - {d.spesialisasi}
              </option>
            ))}
          </select>
        </Field>

        {terpilih ? (
          <p className="muted" style={{ marginTop: "-.5rem" }}>
            Jadwal praktik:{" "}
            {terpilih.jadwal.map((j) => `${j.hari} ${j.jam_mulai}-${j.jam_selesai}`).join(", ")}
          </p>
        ) : null}

        <Field label="Layanan *">
          <select value={layananId} onChange={(e) => setLayananId(e.target.value)} required>
            <option value="">- pilih layanan -</option>
            {layananReq.data.map((l) => (
              <option key={l.id} value={l.id}>
                {l.nama_layanan} - {rupiah(l.harga)}
              </option>
            ))}
          </select>
        </Field>

        <Field label="Tanggal kunjungan *" help="Pilih tanggal yang jatuh pada hari praktik dokter.">
          <input type="date" value={tanggal} min={todayISO()} onChange={(e) => setTanggal(e.target.value)} required />
        </Field>
        {!hariCocok ? (
          <Alert>
            {terpilih?.nama} tidak praktik pada hari {hari}. Hari praktik: {terpilih?.hari_praktik.join(", ")}.
          </Alert>
        ) : null}

        <Field label="Keluhan *">
          <textarea rows={4} value={keluhan} onChange={(e) => setKeluhan(e.target.value)} required />
        </Field>

        <div className="actions">
          <button className="btn" type="submit" disabled={busy || !hariCocok}>
            {busy ? "Mengirim..." : "Kirim Pendaftaran"}
          </button>
          <Link className="btn btn-ghost" href="/pasien">
            Batal
          </Link>
        </div>
      </form>
    </div>
  );
}

export default function DaftarPage() {
  return (
    <RequireRole roles={["pasien"]}>
      <Content />
    </RequireRole>
  );
}
