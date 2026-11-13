"use client";

import { useEffect } from "react";
import type { ReactNode } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { homeFor, useAuth } from "./AuthProvider";
import { Loading } from "./ui";
import type { Role } from "@/lib/types";

/** Membatasi halaman untuk role tertentu; yang belum login diarahkan ke /login. */
export default function RequireRole({ roles, children }: { roles: Role[]; children: ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.replace(`/login?next=${encodeURIComponent(window.location.pathname)}`);
    }
  }, [loading, user, router]);

  if (loading || !user) return <Loading />;

  if (!roles.includes(user.role)) {
    return (
      <div className="card error-box">
        <div className="code">403</div>
        <p>Anda tidak punya akses ke halaman ini.</p>
        <Link className="btn" href={homeFor(user.role)}>
          Ke dashboard saya
        </Link>
      </div>
    );
  }
  return <>{children}</>;
}
