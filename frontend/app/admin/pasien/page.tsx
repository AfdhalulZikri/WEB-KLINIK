"use client";

import { useState } from "react";
import type { FormEvent } from "react";
import RequireRole from "@/components/RequireRole";
import { Alert, Empty, Field, FlashView, Loading, PageHead } from "@/components/ui";
import type { FlashMsg } from "@/components/ui";
import { api, errMsg } from "@/lib/api";
import { useApi } from "@/lib/hooks";
import type { PasienRow } from "@/lib/types";

function PasienForm({ initial, onDone, onCancel }: { initial: PasienRow | null; onDone: (msg: string) => void; onCancel: () => void }) {
  const [nama, setNama] = useState(initial?.nama ?? "");
  const [email, setEmail] = useState(initial?.email ?? "");
  const [telepon, setTelepon] = useState(initial?.nomor_telepon ?? "");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      const body = { nama, email, nomor_telepon: telepon, password: password || null };
      if (initial) {
        await api(`/api/admin/pasien/${initial.id}`, { method: "PUT", body });
        onDone("Data pasien diperbarui.");
      } else {
        await api("/api/admin/pasien", { method: "POST", body });
        onDone("Pasien ditambahkan.");
      }
    } catch (err) {
      setError(errMsg(err));
      setBusy(false);
    }
  }

  return (
    <div className="card formcard">
      <h2>{initial ? "Edit Pasien" : "Tambah Pasien"}</h2>
      {error ? <Alert>{error}</Alert> : null}
      <form onSubmit={onSubmit}>
        <div className="formrow">
          <Field label="Nama lengkap *">
            <input value={nama} onChange={(e) => setNama(e.target.value)} required />
          </Field>
          <Field label="Email *">
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </Field>
          <Field label="Nomor telepon">
            <input value={telepon} onChange={(e) => setTelepon(e.target.value)} />
          </Field>
          <Field label={initial ? "Password baru" : "Password *"} help={initial ? "Kosongkan jika tidak diubah." : "Minimal 6 karakter."}>
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
  const [q, setQ] = useState("");
  const [query, setQuery] = useState("");
  const { data, error, loading, reload } = useApi<PasienRow[]>(`/api/admin/pasien?q=${encodeURIComponent(query)}`);
  const [editing, setEditing] = useState<PasienRow | "baru" | null>(null);
  const [flash, setFlash] = useState<FlashMsg | null>(null);

  async function hapus(p: PasienRow) {
    if (!window.confirm(`Hapus pasien ${p.nama} beserta seluruh riwayat pendaftarannya?`)) return;
    try {
      await api(`/api/admin/pasien/${p.id}`, { method: "DELETE" });
      setFlash({ kind: "success", text: "Pasien dan riwayat pendaftarannya dihapus." });
      reload();
    } catch (e) {
      setFlash({ kind: "error", text: errMsg(e) });
    }
  }

  return (
    <>
      <PageHead title="Data Pasien">
        <button className="btn" type="button" onClick={() => setEditing("baru")}>
          + Tambah Pasien
        </button>
      </PageHead>
      <FlashView flash={flash ?? (error ? { kind: "error", text: error } : null)} />

      {editing ? (
        <PasienForm
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

      <form
        className="filters"
        onSubmit={(e) => {
          e.preventDefault();
          setQuery(q);
        }}
      >
        <input type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Cari nama / email" />
        <button className="btn btn-sm" type="submit">
          Cari
        </button>
        {query ? (
          <button
            className="btn btn-ghost btn-sm"
            type="button"
            onClick={() => {
              setQ("");
              setQuery("");
            }}
          >
            Reset
          </button>
        ) : null}
      </form>

      {!data ? (
        loading ? <Loading /> : null
      ) : data.length === 0 ? (
        <Empty>Tidak ada data pasien.</Empty>
      ) : (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Nama</th>
                <th>Email</th>
                <th>Telepon</th>
                <th>Pendaftaran</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {data.map((p) => (
                <tr key={p.id}>
                  <td>{p.nama}</td>
                  <td>{p.email}</td>
                  <td>{p.nomor_telepon || "-"}</td>
                  <td>{p.jumlah_pendaftaran}</td>
                  <td className="actions">
                    <button className="btn btn-ghost btn-sm" type="button" onClick={() => setEditing(p)}>
                      Edit
                    </button>
                    <button className="btn btn-danger btn-sm" type="button" onClick={() => hapus(p)}>
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

export default function AdminPasienPage() {
  return (
    <RequireRole roles={["admin"]}>
      <Content />
    </RequireRole>
  );
}
