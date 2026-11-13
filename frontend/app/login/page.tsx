"use client";

import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { homeFor, useAuth } from "@/components/AuthProvider";
import { Alert, Field } from "@/components/ui";
import { errMsg } from "@/lib/api";

/** Hanya terima tujuan di situs ini (cegah open redirect). */
function safeNext(): string {
  const next = new URLSearchParams(window.location.search).get("next") || "";
  return next.startsWith("/") && !next.startsWith("//") ? next : "";
}

export default function LoginPage() {
  const { user, login } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  // Sudah login -> langsung ke dashboard.
  useEffect(() => {
    if (user) router.replace(safeNext() || homeFor(user.role));
  }, [user, router]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      const u = await login(email.trim(), password);
      router.replace(safeNext() || homeFor(u.role));
    } catch (err) {
      setError(errMsg(err));
      setBusy(false);
    }
  }

  return (
    <div className="card narrow">
      <h1>Masuk</h1>
      {error ? <Alert>{error}</Alert> : null}
      <form onSubmit={onSubmit}>
        <Field label="Email">
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required autoFocus />
        </Field>
        <Field label="Password">
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
        </Field>
        <div className="actions">
          <button className="btn" type="submit" disabled={busy}>
            {busy ? "Memproses..." : "Masuk"}
          </button>
          <Link href="/register">Belum punya akun?</Link>
        </div>
      </form>
    </div>
  );
}
