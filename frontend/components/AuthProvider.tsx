"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import type { ReactNode } from "react";
import { api, clearToken, getToken, setToken } from "@/lib/api";
import type { Role, TokenResponse, User } from "@/lib/types";

export interface RegisterData {
  nama: string;
  email: string;
  nomor_telepon: string;
  password: string;
}

interface AuthState {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<User>;
  register: (data: RegisterData) => Promise<User>;
  logout: () => void;
  setUser: (u: User | null) => void;
}

const AuthContext = createContext<AuthState>({
  user: null,
  loading: true,
  login: async () => {
    throw new Error("AuthProvider belum dipasang");
  },
  register: async () => {
    throw new Error("AuthProvider belum dipasang");
  },
  logout: () => undefined,
  setUser: () => undefined,
});

export function useAuth(): AuthState {
  return useContext(AuthContext);
}

/** Halaman utama tiap role setelah login. */
export function homeFor(role: Role): string {
  if (role === "admin") return "/admin";
  if (role === "dokter") return "/praktik";
  return "/pasien";
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Pulihkan sesi dari token yang tersimpan.
  useEffect(() => {
    if (!getToken()) {
      setLoading(false);
      return;
    }
    api<User>("/api/auth/me")
      .then(setUser)
      .catch(() => clearToken())
      .finally(() => setLoading(false));
  }, []);

  // Token ditolak server (kedaluwarsa/tidak valid) -> anggap logout.
  useEffect(() => {
    const onUnauthorized = () => setUser(null);
    window.addEventListener("klinik:unauthorized", onUnauthorized);
    return () => window.removeEventListener("klinik:unauthorized", onUnauthorized);
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const res = await api<TokenResponse>("/api/auth/login", { method: "POST", body: { email, password } });
    setToken(res.access_token);
    setUser(res.user);
    return res.user;
  }, []);

  const register = useCallback(async (data: RegisterData) => {
    const res = await api<TokenResponse>("/api/auth/register", { method: "POST", body: data });
    setToken(res.access_token);
    setUser(res.user);
    return res.user;
  }, []);

  const logout = useCallback(() => {
    clearToken();
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, setUser }}>
      {children}
    </AuthContext.Provider>
  );
}
