"use client";

import { useState } from "react";
import type { FormEvent } from "react";
import RequireRole from "@/components/RequireRole";
import { Alert, Empty, Field, FlashView, Loading, PageHead } from "@/components/ui";
import type { FlashMsg } from "@/components/ui";
import { api, errMsg } from "@/lib/api";
import { useApi } from "@/lib/hooks";
import { rupiah } from "@/lib/format";
import type { Layanan } from "@/lib/types";

function LayananForm({ initial, onDone, onCancel }: { initial: Layanan | null; onDone: (msg: string) => void; onCancel: () => void }) {
  const [nama, setNama] = useState(initial?.nama_layanan ?? "");
  const [deskripsi, setDeskripsi] = useState(initial?.deskripsi ?? "");
  const [harga, setHarga] = useState(initial ? String(initial.harga) : "");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      const body = { nama_layanan: nama, deskripsi, harga: Number(harga) };
      if (initial) {
        await api(`/api/admin/layanan/${initial.id}`, { method: "PUT", body });
        onDone("Layanan diperbarui.");
      } else {
        await api("/api/admin/layanan", { method: "POST", body });
        onDone("Layanan ditambahkan.");
      }
    } catch (err) {
      setError(errMsg(err));
      setBusy(false);
    }
  }

  return (
    <div className="card formcard">
      <h2>{initial ? "Edit Layanan" : "Tambah Layanan"}</h2>
      {error ? <Alert>{error}</Alert> : null}
      <form onSubmit={onSubmit}>
        <div className="formrow">
          <Field label="Nama layanan *">
            <input value={nama} onChange={(e) => setNama(e.target.value)} required />
          </Field>
          <Field label="Harga (Rp) *">
            <input type="number" min={0} value={harga} onChange={(e) => setHarga(e.target.value)} required />
          </Field>
        </div>
        <Field label="Deskripsi">
          <textarea rows={3} value={deskripsi} onChange={(e) => setDeskripsi(e.target.value)} />
        </Field>
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
  const { data, error, loading, reload } = useApi<Layanan[]>("/api/admin/layanan");
  const [editing, setEditing] = useState<Layanan | "baru" | null>(null);
  const [flash, setFlash] = useState<FlashMsg | null>(null);

  async function hapus(l: Layanan) {
    if (!window.confirm(`Hapus layanan ${l.nama_layanan}?`)) return;
    try {
      await api(`/api/admin/layanan/${l.id}`, { method: "DELETE" });
      setFlash({ kind: "success", text: "Layanan dihapus." });
      reload();
    } catch (e) {
      setFlash({ kind: "error", text: errMsg(e) });
    }
  }

  return (
    <>
      <PageHead title="Data Layanan">
        <button className="btn" type="button" onClick={() => setEditing("baru")}>
          + Tambah Layanan
        </button>
      </PageHead>
      <FlashView flash={flash ?? (error ? { kind: "error", text: error } : null)} />

      {editing ? (
        <LayananForm
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
        <Empty>Belum ada layanan.</Empty>
      ) : (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Layanan</th>
                <th>Deskripsi</th>
                <th>Harga</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {data.map((l) => (
                <tr key={l.id}>
                  <td>{l.nama_layanan}</td>
                  <td>{l.deskripsi}</td>
                  <td>{rupiah(l.harga)}</td>
                  <td className="actions">
                    <button className="btn btn-ghost btn-sm" type="button" onClick={() => setEditing(l)}>
                      Edit
                    </button>
                    <button className="btn btn-danger btn-sm" type="button" onClick={() => hapus(l)}>
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

export default function AdminLayananPage() {
  return (
    <RequireRole roles={["admin"]}>
      <Content />
    </RequireRole>
  );
}
