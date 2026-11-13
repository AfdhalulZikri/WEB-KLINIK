"use client";

import { useState } from "react";
import type { FormEvent } from "react";
import RequireRole from "@/components/RequireRole";
import { Alert, Empty, Field, FlashView, Loading, PageHead } from "@/components/ui";
import type { FlashMsg } from "@/components/ui";
import { api, errMsg } from "@/lib/api";
import { useApi } from "@/lib/hooks";
import { HARI } from "@/lib/format";
import type { Dokter, Jadwal } from "@/lib/types";

/** Jadwal yang sedang diisi: id kosong = jadwal baru. */
interface Draft {
  id: number | null;
  dokter_id: string;
  hari: string;
  jam_mulai: string;
  jam_selesai: string;
}

function JadwalForm({ draft, dokter, onDone, onCancel }: { draft: Draft; dokter: Dokter[]; onDone: (msg: string) => void; onCancel: () => void }) {
  const [dokterId, setDokterId] = useState(draft.dokter_id);
  const [hari, setHari] = useState(draft.hari);
  const [mulai, setMulai] = useState(draft.jam_mulai);
  const [selesai, setSelesai] = useState(draft.jam_selesai);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      const body = { dokter_id: Number(dokterId), hari, jam_mulai: mulai, jam_selesai: selesai };
      if (draft.id !== null) {
        await api(`/api/admin/jadwal/${draft.id}`, { method: "PUT", body });
        onDone("Jadwal diperbarui.");
      } else {
        await api("/api/admin/jadwal", { method: "POST", body });
        onDone("Jadwal ditambahkan.");
      }
    } catch (err) {
      setError(errMsg(err));
      setBusy(false);
    }
  }

  return (
    <div className="card formcard">
      <h2>{draft.id !== null ? "Edit Jadwal" : "Tambah Jadwal"}</h2>
      {error ? <Alert>{error}</Alert> : null}
      <form onSubmit={onSubmit}>
        <div className="formrow">
          <Field label="Dokter *">
            <select value={dokterId} onChange={(e) => setDokterId(e.target.value)} required>
              <option value="">- pilih dokter -</option>
              {dokter.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.nama} - {d.spesialisasi}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Hari *">
            <select value={hari} onChange={(e) => setHari(e.target.value)} required>
              <option value="">- pilih hari -</option>
              {HARI.map((h) => (
                <option key={h} value={h}>
                  {h}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Jam mulai *">
            <input type="time" value={mulai} onChange={(e) => setMulai(e.target.value)} required />
          </Field>
          <Field label="Jam selesai *">
            <input type="time" value={selesai} onChange={(e) => setSelesai(e.target.value)} required />
          </Field>
        </div>
        <div className="actions">
          <button className="btn" type="submit" disabled={busy}>
            {busy ? "Menyimpan..." : "Simpan"}
          </button>
          <button className="btn btn-ghost" type="button" onClick={onCancel}>
            Batal
          </button>
        </div>
      </form>
    </div>
  );
}

function Content() {
  const { data, error, loading, reload } = useApi<Dokter[]>("/api/admin/jadwal");
  const [draft, setDraft] = useState<Draft | null>(null);
  const [flash, setFlash] = useState<FlashMsg | null>(null);

  function baru(dokterId: number | null) {
    setDraft({ id: null, dokter_id: dokterId === null ? "" : String(dokterId), hari: "", jam_mulai: "08:00", jam_selesai: "12:00" });
  }

  function ubah(j: Jadwal) {
    setDraft({ id: j.id, dokter_id: String(j.dokter_id), hari: j.hari, jam_mulai: j.jam_mulai, jam_selesai: j.jam_selesai });
  }

  async function hapus(j: Jadwal) {
    if (!window.confirm(`Hapus jadwal ${j.hari} ${j.jam_mulai}-${j.jam_selesai}?`)) return;
    try {
      await api(`/api/admin/jadwal/${j.id}`, { method: "DELETE" });
      setFlash({ kind: "success", text: "Jadwal dihapus." });
      reload();
    } catch (e) {
      setFlash({ kind: "error", text: errMsg(e) });
    }
  }

  return (
    <>
      <PageHead title="Jadwal Dokter">
        <button className="btn" type="button" onClick={() => baru(null)}>
          + Tambah Jadwal
        </button>
      </PageHead>
      <FlashView flash={flash ?? (error ? { kind: "error", text: error } : null)} />

      {draft && data ? (
        <JadwalForm
          key={`${draft.id ?? "baru"}-${draft.dokter_id}`}
          draft={draft}
          dokter={data}
          onCancel={() => setDraft(null)}
          onDone={(msg) => {
            setDraft(null);
            setFlash({ kind: "success", text: msg });
            reload();
          }}
        />
      ) : null}

      {!data ? (
        loading ? <Loading /> : null
      ) : data.length === 0 ? (
        <Empty>Belum ada dokter. Tambahkan dokter terlebih dahulu.</Empty>
      ) : (
        data.map((d) => (
          <div className="card section" key={d.id}>
            <div className="section-head">
              <div>
                <h2>{d.nama}</h2>
                <span className="muted">{d.spesialisasi}</span>
              </div>
              <button className="btn btn-ghost btn-sm" type="button" onClick={() => baru(d.id)}>
                + Jadwal
              </button>
            </div>
            {d.jadwal.length ? (
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Hari</th>
                      <th>Jam</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {d.jadwal.map((j) => (
                      <tr key={j.id}>
                        <td>{j.hari}</td>
                        <td>
                          {j.jam_mulai} - {j.jam_selesai}
                        </td>
                        <td className="actions">
                          <button className="btn btn-ghost btn-sm" type="button" onClick={() => ubah(j)}>
                            Edit
                          </button>
                          <button className="btn btn-danger btn-sm" type="button" onClick={() => hapus(j)}>
                            Hapus
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="muted">Belum ada jadwal.</p>
            )}
          </div>
        ))
      )}
    </>
  );
}

export default function AdminJadwalPage() {
  return (
    <RequireRole roles={["admin"]}>
      <Content />
    </RequireRole>
  );
}
