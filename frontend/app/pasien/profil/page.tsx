"use client";

import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import Link from "next/link";
import { useAuth } from "@/components/AuthProvider";
import RequireRole from "@/components/RequireRole";
import { Alert, Field, FlashView } from "@/components/ui";
import type { FlashMsg } from "@/components/ui";
import { api, errMsg } from "@/lib/api";
import type { User } from "@/lib/types";

function Content() {
  const { user, setUser } = useAuth();
  const [nama, setNama] = useState("");
  const [telepon, setTelepon] = useState("");
  const [passwordBaru, setPasswordBaru] = useState("");
  const [flash, setFlash] = useState<FlashMsg | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (user) {
      setNama(user.nama);
      setTelepon(user.nomor_telepon ?? "");
    }
  }, [user]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setFlash(null);
    setBusy(true);
    try {
      const u = await api<User>("/api/pasien/profil", {
        method: "PUT",
        body: { nama, nomor_telepon: telepon, password_baru: passwordBaru || null },
      });
      setUser(u);
      setPasswordBaru("");
      setFlash({ kind: "success", text: "Profil berhasil diperbarui." });
    } catch (err) {
      setFlash({ kind: "error", text: errMsg(err) });
    }
    setBusy(false);
  }

  return (
    <div className="card narrow">
      <h1>Profil Saya</h1>
      <p className="muted">Email: {user?.email}</p>
      <FlashView flash={flash} />
      {!user ? <Alert>Data pengguna tidak tersedia.</Alert> : null}
      <form onSubmit={onSubmit}>
        <Field label="Nama lengkap *">
          <input value={nama} onChange={(e) => setNama(e.target.value)} required />
        </Field>
        <Field label="Nomor telepon">
          <input type="tel" value={telepon} onChange={(e) => setTelepon(e.target.value)} />
        </Field>
        <Field label="Password baru" help="Kosongkan jika tidak ingin mengganti password (minimal 6 karakter).">
          <input
            type="password"
            value={passwordBaru}
            onChange={(e) => setPasswordBaru(e.target.value)}
            autoComplete="new-password"
          />
        </Field>
        <div className="actions">
          <button className="btn" type="submit" disabled={busy}>
            {busy ? "Menyimpan..." : "Simpan"}
          </button>
          <Link className="btn btn-ghost" href="/pasien">
            Kembali
          </Link>
        </div>
      </form>
    </div>
  );
}

export default function ProfilPage() {
  return (
    <RequireRole roles={["pasien"]}>
      <Content />
    </RequireRole>
  );
}
