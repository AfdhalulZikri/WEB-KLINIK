"use client";

import { useState } from "react";
import type { FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";
import { Alert, Field } from "@/components/ui";
import { errMsg } from "@/lib/api";

export default function RegisterPage() {
  const { register } = useAuth();
  const router = useRouter();
  const [nama, setNama] = useState("");
  const [email, setEmail] = useState("");
  const [telepon, setTelepon] = useState("");
  const [password, setPassword] = useState("");
  const [konfirmasi, setKonfirmasi] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    if (password.length < 6) return setError("Password minimal 6 karakter.");
    if (password !== konfirmasi) return setError("Konfirmasi password tidak sama.");
    setBusy(true);
    try {
      await register({ nama: nama.trim(), email: email.trim(), nomor_telepon: telepon.trim(), password });
      router.replace("/pasien");
    } catch (err) {
      setError(errMsg(err));
      setBusy(false);
    }
  }

  return (
    <div className="card narrow">
      <h1>Buat Akun Pasien</h1>
      {error ? <Alert>{error}</Alert> : null}
      <form onSubmit={onSubmit}>
        <Field label="Nama lengkap *">
          <input value={nama} onChange={(e) => setNama(e.target.value)} required />
        </Field>
        <Field label="Email *">
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </Field>
        <Field label="Nomor telepon">
          <input type="tel" value={telepon} onChange={(e) => setTelepon(e.target.value)} />
        </Field>
        <Field label="Password *" help="Minimal 6 karakter.">
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoComplete="new-password"
          />
        </Field>
        <Field label="Konfirmasi password *">
          <input
            type="password"
            value={konfirmasi}
            onChange={(e) => setKonfirmasi(e.target.value)}
            required
            autoComplete="new-password"
          />
        </Field>
        <div className="actions">
          <button className="btn" type="submit" disabled={busy}>
            {busy ? "Memproses..." : "Daftar"}
          </button>
          <Link href="/login">Sudah punya akun?</Link>
        </div>
      </form>
    </div>
  );
}
