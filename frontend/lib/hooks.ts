"use client";

import { useCallback, useEffect, useState } from "react";
import { api, errMsg } from "./api";
import type { Info } from "./types";

/** Ambil data dari API saat komponen tampil. Berikan path=null untuk menunda pengambilan. */
export function useApi<T>(path: string | null) {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(path !== null);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    if (path === null) return;
    let alive = true;
    setLoading(true);
    api<T>(path)
      .then((d) => {
        if (alive) {
          setData(d);
          setError("");
        }
      })
      .catch((e: unknown) => {
        if (alive) setError(errMsg(e));
      })
      .finally(() => {
        if (alive) setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, [path, tick]);

  const reload = useCallback(() => setTick((t) => t + 1), []);
  return { data, error, loading, reload };
}

const DEFAULT_INFO: Info = { nama: "Klinik", alamat: "", telepon: "", jam: "" };
let infoPromise: Promise<Info> | null = null;

/** Informasi klinik (FR-03), diambil sekali lalu dipakai ulang. */
export function useInfo(): Info {
  const [info, setInfo] = useState<Info>(DEFAULT_INFO);
  useEffect(() => {
    let alive = true;
    if (!infoPromise) {
      infoPromise = api<Info>("/api/info").catch((e: unknown) => {
        infoPromise = null; // coba lagi di pemanggilan berikutnya
        throw e;
      });
    }
    infoPromise.then((i) => alive && setInfo(i)).catch(() => undefined);
    return () => {
      alive = false;
    };
  }, []);
  return info;
}
