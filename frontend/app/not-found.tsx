import Link from "next/link";

export default function NotFound() {
  return (
    <div className="card error-box">
      <div className="code">404</div>
      <p>Halaman tidak ditemukan.</p>
      <Link className="btn" href="/">
        Kembali ke Beranda
      </Link>
    </div>
  );
}
