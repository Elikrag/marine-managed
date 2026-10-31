export function money(n: number | null | undefined, opts: { cents?: boolean } = {}) {
  if (n == null || Number.isNaN(n)) return "—";
  return n.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: opts.cents ? 2 : 0,
  });
}

export function fmtDate(s: string | null | undefined) {
  if (!s) return "—";
  const d = new Date(s.length === 10 ? s + "T00:00:00" : s);
  if (Number.isNaN(d.getTime())) return s;
  return d.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
}

export function shortDate(s: string | null | undefined) {
  if (!s) return "—";
  const d = new Date(s.length === 10 ? s + "T00:00:00" : s);
  if (Number.isNaN(d.getTime())) return s;
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export function today() {
  return new Date().toISOString().slice(0, 10);
}

export function daysUntil(s: string | null | undefined): number | null {
  if (!s) return null;
  const d = new Date(s.length === 10 ? s + "T00:00:00" : s);
  if (Number.isNaN(d.getTime())) return null;
  return Math.round((d.getTime() - Date.now()) / 86400000);
}

export function num(v: FormDataEntryValue | null | undefined): number | null {
  if (v == null) return null;
  const s = String(v).trim().replace(/[$,]/g, "");
  if (!s) return null;
  const n = Number(s);
  return Number.isFinite(n) ? n : null;
}

export function str(v: FormDataEntryValue | null | undefined): string | null {
  if (v == null) return null;
  const s = String(v).trim();
  return s ? s : null;
}

export function int(v: FormDataEntryValue | null | undefined): number | null {
  const n = num(v);
  return n == null ? null : Math.round(n);
}

export const KINDS = ["maintenance", "repair", "upgrade", "inspection", "winterize", "commission"] as const;
export const ISSUE_STATUSES = ["open", "monitoring", "scheduled", "resolved", "wont_fix"] as const;
export const SEVERITIES = ["low", "med", "high", "safety"] as const;
export const COST_CATEGORIES = ["service", "parts", "fuel", "insurance", "storage", "registration", "upgrade", "other"] as const;
export const SYSTEM_CATEGORIES = ["electrical", "plumbing", "fuel", "steering", "electronics", "canvas", "safety", "hull", "other"] as const;
export const DOC_KINDS = ["manual", "receipt", "photo", "policy", "registration", "other"] as const;
export const STORAGE_KINDS = ["slip", "mooring", "dry_stack", "yard", "driveway", "garage", "other"] as const;

export function label(s: string) {
  return s.replace(/_/g, " ");
}
