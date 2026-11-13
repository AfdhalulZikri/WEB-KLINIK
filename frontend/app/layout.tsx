import "./globals.css";
import type { Metadata } from "next";
import type { ReactNode } from "react";
import { AuthProvider } from "@/components/AuthProvider";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export const metadata: Metadata = {
  title: "Sistem Informasi Klinik",
  description: "Pendaftaran dan manajemen layanan klinik berbasis web.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="id">
      <body>
        <AuthProvider>
          <Navbar />
          <main>
            <div className="container">{children}</div>
          </main>
          <Footer />
        </AuthProvider>
      </body>
    </html>
  );
}
