const BASE = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000").replace(/\/+$/, "");
const TOKEN_KEY = "klinik_token";

export function getToken(): string | null {
  try {
    return window.localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

export function setToken(token: string): void {
  try {
    window.localStorage.setItem(TOKEN_KEY, token);
  } catch {
    /* penyimpanan diblokir: login hanya bertahan sampai halaman dimuat ulang */
  }
}

export function clearToken(): void {
  try {
    window.localStorage.removeItem(TOKEN_KEY);
  } catch {
    /* abaikan */
  }
}

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

export function errMsg(e: unknown): string {
  return e instanceof Error ? e.message : "Terjadi kesalahan.";
}

interface Options {
  method?: string;
  body?: unknown;
}

/** Panggil REST API backend. Token login (jika ada) dikirim lewat header Authorization. */
export async function api<T>(path: string, opts: Options = {}): Promise<T> {
  const headers: Record<string, string> = {};
  const token = getToken();
  if (token) headers["Authorization"] = `Bearer ${token}`;
  if (opts.body !== undefined) headers["Content-Type"] = "application/json";

  let res: Response;
  try {
    res = await fetch(`${BASE}${path}`, {
      method: opts.method || "GET",
      headers,
      body: opts.body !== undefined ? JSON.stringify(opts.body) : undefined,
      cache: "no-store",
    });
  } catch {
    throw new ApiError(
      "Tidak dapat terhubung ke server. Pastikan backend berjalan dan NEXT_PUBLIC_API_URL benar.",
      0
    );
  }

  let data: unknown = null;
  try {
    data = await res.json();
  } catch {
    data = null;
  }

  if (!res.ok) {
    if (res.status === 401 && token && !path.startsWith("/api/auth/login")) {
      clearToken();
      window.dispatchEvent(new Event("klinik:unauthorized"));
    }
    const detail = (data as { detail?: unknown } | null)?.detail;
    throw new ApiError(
      typeof detail === "string" ? detail : `Terjadi kesalahan (${res.status}).`,
      res.status
    );
  }
  return data as T;
}
