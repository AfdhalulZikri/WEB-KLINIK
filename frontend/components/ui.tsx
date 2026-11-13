import type { ReactNode } from "react";

export function Loading() {
  return <div className="empty">Memuat...</div>;
}

export function Alert({ kind = "error", children }: { kind?: "error" | "success"; children: ReactNode }) {
  return <div className={`flash ${kind}`}>{children}</div>;
}

export function Badge({ status }: { status: string }) {
  return <span className={`badge badge-${status.toLowerCase()}`}>{status}</span>;
}

export function Empty({ children }: { children: ReactNode }) {
  return <div className="card empty">{children}</div>;
}

export function PageHead({ title, children }: { title: string; children?: ReactNode }) {
  return (
    <div className="section-head">
      <h1>{title}</h1>
      {children}
    </div>
  );
}

/** Label + kolom isian (input/select/textarea dikirim sebagai children). */
export function Field({ label, help, children }: { label: string; help?: string; children: ReactNode }) {
  return (
    <label>
      {label}
      {children}
      {help ? <small>{help}</small> : null}
    </label>
  );
}

export interface FlashMsg {
  kind: "error" | "success";
  text: string;
}

export function FlashView({ flash }: { flash: FlashMsg | null }) {
  return flash ? <Alert kind={flash.kind}>{flash.text}</Alert> : null;
}
