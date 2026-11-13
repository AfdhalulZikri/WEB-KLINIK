"use client";

import { useState } from "react";
import type { FormEvent } from "react";
import RequireRole from "@/components/RequireRole";
import { Alert, Empty, Field, FlashView, Loading, PageHead } from "@/components/ui";
import type { FlashMsg } from "@/components/ui";
import { api, errMsg } from "@/lib/api";
import { useApi } from "@/lib/hooks";
import type { Dokter } from "@/lib/types";

function DokterForm({ initial, onDone, onCancel }: { initial: Dokter | null; onDone: (msg: string) => void; onCancel: () => void }) {
  const [nama, setNama] = useState(initial?.nama ?? "");
  const [spesialisasi, setSpesialisasi] = useState(initial?.spesialisasi ?? "");
  const [telepon, setTelepon] = useState(initial?.nomor_telepon ?? "");
  const [email, setEmail] = useState(initial?.email ?? "");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      const body = { nama, spesialisasi, nomor_telepon: telepon, email, password: password || null };
      if (initial) {
        await api(`/api/admin/dokter/${initial.id}`, { method: "PUT", body });
        onDone("Data dokter diperbarui.");
      } else {
        await api("/api/admin/dokter", { method: "POST", body });
        onDone("Dokter ditambahkan. Atur jadwal praktiknya di menu Jadwal.");
      }
    } catch (err) {
      setError(errMsg(err));
      setBusy(false);
    }
  }

  return (
    <div className="card formcard">
      <h2>{initial ? "Edit Dokter" : "Tambah Dokter"}</h2>
      {error ? <Alert>{error}</Alert> : null}
      <form onSubmit={onSubmit}>
        <div className="formrow">
          <Field label="Nama dokter *">
            <input value={nama} onChange={(e) => setNama(e.target.value)} required />
          </Field>
          <Field label="Spesialisasi *">
            <input value={spesialisasi} onChange={(e) => setSpesialisasi(e.target.value)} required />
          </Field>
          <Field label="Nomor telepon">
            <input value={telepon} onChange={(e) => setTelepon(e.target.value)} />
          </Field>
          <Field label="Email login *">
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </Field>
          <Field label={initial ? "Password login baru" : "Password login *"} help={initial ? "Kosongkan jika tidak diubah." : "Minimal 6 karakter."}>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required={!initial}
              autoComplete="new-password"
            />
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
  const { data, error, loading, reload } = useApi<Dokter[]>("/api/admin/dokter");
  const [editing, setEditing] = useState<Dokter | "baru" | null>(null);
  const [flash, setFlash] = useState<FlashMsg | null>(null);

  async function hapus(d: Dokter) {
    if (!window.confirm(`Hapus ${d.nama}?`)) return;
    try {
      await api(`/api/admin/dokter/${d.id}`, { method: "DELETE" });
      setFlash({ kind: "success", text: "Dokter dihapus." });
      reload();
    } catch (e) {
      setFlash({ kind: "error", text: errMsg(e) });
    }
  }

  return (
    <>
      <PageHead title="Data Dokter">
        <button className="btn" type="button" onClick={() => setEditing("baru")}>
          + Tambah Dokter
        </button>
      </PageHead>
      <FlashView flash={flash ?? (error ? { kind: "error", text: error } : null)} />

      {editing ? (
        <DokterForm
          key={editing === "baru" ? "baru" : editing.id}
          initial={editing === "baru" ? null : editing}
          onCancel={() => setEditing(null)}
          onDone={(msg) => {
            setEditing(null);
            setFlash({ kind: "success", text: msg });
            reload();
          }}
        />
      ) : null}

      {!data ? (
        loading ? <Loading /> : null
      ) : data.length === 0 ? (
        <Empty>Belum ada dokter.</Empty>
      ) : (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Nama</th>
                <th>Spesialisasi</th>
                <th>Telepon</th>
                <th>Email login</th>
                <th>Hari praktik</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {data.map((d) => (
                <tr key={d.id}>
                  <td>{d.nama}</td>
                  <td>{d.spesialisasi}</td>
                  <td>{d.nomor_telepon || "-"}</td>
                  <td>{d.email || "-"}</td>
                  <td>
                    {d.hari_praktik.length ? (
                      d.hari_praktik.map((h) => (
                        <span className="chip" key={h}>
                          {h}
                        </span>
                      ))
                    ) : (
                      <span className="muted">-</span>
                    )}
                  </td>
                  <td className="actions">
                    <button className="btn btn-ghost btn-sm" type="button" onClick={() => setEditing(d)}>
                      Edit
                    </button>
                    <button className="btn btn-danger btn-sm" type="button" onClick={() => hapus(d)}>
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

export default function AdminDokterPage() {
  return (
    <RequireRole roles={["admin"]}>
      <Content />
    </RequireRole>
  );
}
