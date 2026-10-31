import Link from "next/link";

export function PageHeader({ title, eyebrow, actions, children }: { title: React.ReactNode; eyebrow?: string; actions?: React.ReactNode; children?: React.ReactNode }) {
  return (
    <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
      <div className="min-w-0">
        {eyebrow && <div className="eyebrow mb-1">{eyebrow}</div>}
        <h1 className="text-2xl font-semibold">{title}</h1>
        {children && <p className="mt-1 max-w-[65ch] text-sm text-muted">{children}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  );
}

export function Stat({ label, value, sub, tone }: { label: string; value: React.ReactNode; sub?: React.ReactNode; tone?: "ok" | "warn" | "crit" }) {
  const t = tone === "crit" ? "text-crit" : tone === "warn" ? "text-warn" : tone === "ok" ? "text-ok" : "";
  return (
    <div className="card min-w-0 p-4">
      <div className="eyebrow">{label}</div>
      <div className={`tnum mt-1 font-display text-2xl font-semibold ${t}`}>{value}</div>
      {sub && <div className="mt-0.5 truncate text-xs text-muted">{sub}</div>}
    </div>
  );
}

export function Section({ title, actions, children, className = "" }: { title?: React.ReactNode; actions?: React.ReactNode; children: React.ReactNode; className?: string }) {
  return (
    <section className={`card min-w-0 ${className}`}>
      {(title || actions) && (
        <div className="flex items-center justify-between gap-2 border-b border-line px-4 py-2.5">
          <div className="eyebrow">{title}</div>
          {actions}
        </div>
      )}
      <div className="p-4">{children}</div>
    </section>
  );
}

export function Empty({ children, action }: { children: React.ReactNode; action?: React.ReactNode }) {
  return (
    <div className="rounded-md border border-dashed border-line px-4 py-8 text-center text-sm text-muted">
      <div>{children}</div>
      {action && <div className="mt-3">{action}</div>}
    </div>
  );
}

export function Field({ label, children, className = "" }: { label: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={`min-w-0 ${className}`}>
      <label className="label">{label}</label>
      {children}
    </div>
  );
}

export function Row({ k, v }: { k: string; v: React.ReactNode }) {
  return (
    <div className="field-row">
      <b>{k}</b>
      <span className="min-w-0 break-words">{v ?? "—"}</span>
    </div>
  );
}

export function SevChip({ s }: { s: string }) {
  return <span className={`chip ${s}`}>{s}</span>;
}
export function StatusChip({ s }: { s: string }) {
  const cls = s === "resolved" ? "ok" : s === "open" ? "high" : s === "monitoring" ? "med" : s === "scheduled" ? "accent" : "low";
  return <span className={`chip ${cls}`}>{s.replace("_", " ")}</span>;
}

export function Select({ name, value, options, id, allowEmpty, className = "" }: { name: string; value?: string | null; options: readonly (string | { value: string; label: string })[]; id?: string; allowEmpty?: string; className?: string }) {
  return (
    <select name={name} id={id ?? name} defaultValue={value ?? ""} className={`select ${className}`}>
      {allowEmpty !== undefined && <option value="">{allowEmpty}</option>}
      {options.map((o) => {
        const v = typeof o === "string" ? o : o.value;
        const l = typeof o === "string" ? o.replace(/_/g, " ") : o.label;
        return (
          <option key={v} value={v}>
            {l}
          </option>
        );
      })}
    </select>
  );
}

export function Input({ name, value, type = "text", placeholder, id, required, step }: { name: string; value?: string | number | null; type?: string; placeholder?: string; id?: string; required?: boolean; step?: string }) {
  return <input name={name} id={id ?? name} type={type} defaultValue={value ?? ""} placeholder={placeholder} required={required} step={step} className="input" />;
}

export function Textarea({ name, value, placeholder, id, rows }: { name: string; value?: string | null; placeholder?: string; id?: string; rows?: number }) {
  return <textarea name={name} id={id ?? name} defaultValue={value ?? ""} placeholder={placeholder} rows={rows} className="textarea" />;
}

export function FilterLink({ href, active, children }: { href: string; active: boolean; children: React.ReactNode }) {
  return (
    <Link href={href} className={`chip ${active ? "solid" : "low"} hover:text-fg`}>
      {children}
    </Link>
  );
}

export function FormActions({ cancelHref, submit = "Save", deleteAction, deleteLabel = "Delete" }: { cancelHref: string; submit?: string; deleteAction?: (f: FormData) => Promise<void>; deleteLabel?: string }) {
  return (
    <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-line pt-4">
      <button className="btn primary">{submit}</button>
      <Link href={cancelHref} className="btn">Cancel</Link>
      {deleteAction && (
        <button formAction={deleteAction} className="btn danger ml-auto" formNoValidate>
          {deleteLabel}
        </button>
      )}
    </div>
  );
}

export function SourceBadge({ source }: { source: string }) {
  return source === "mcp" ? <span className="chip accent">via claude</span> : null;
}
