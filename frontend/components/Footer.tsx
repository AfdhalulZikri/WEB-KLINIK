"use client";

import { useInfo } from "@/lib/hooks";

export default function Footer() {
  const info = useInfo();
  return (
    <footer>
      <div className="container">
        {info.nama} &middot; {info.alamat} &middot; {info.telepon}
      </div>
    </footer>
  );
}
