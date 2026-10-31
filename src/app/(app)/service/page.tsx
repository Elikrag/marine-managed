import Link from "next/link";
import { getEngines, getIssues, getServiceEntries, requireBoat, splitTarget, targetNames, targetOptions } from "@/lib/data";
import { KINDS, label, money, shortDate } from "@/lib/format";
import { Empty, FilterLink, PageHeader, SourceBadge } from "@/components/ui";
import { ServiceForm } from "./form";
import { createService } from "./actions";

export default async function ServicePage({ searchParams }: PageProps<"/service">) {
  const sp = await searchParams;
  const boat = await requireBoat();
  const kind = typeof sp.kind === "string" ? sp.kind : "";
  const target = typeof sp.target === "string" ? sp.target : "";
  const year = typeof sp.year === "string" ? sp.year : "";
  const q = typeof sp.q === "string" ? sp.q : "";
  const t = splitTarget(target || null);
  const [rows, all, name, targets, openIssues, eng] = await Promise.all([
    getServiceEntries(boat.id, { kind: kind || undefined, targetType: target ? t.targetType : undefined, targetId: target ? t.targetId ?? undefined : undefined, year: year || undefined, q: q || undefined }),
    getServiceEntries(boat.id), targetNames(boat.id), targetOptions(boat.id), getIssues(boat.id, { status: ["open", "monitoring", "scheduled"] }), getEngines(boat.id),
  ]);
  const years = [...new Set(all.map((r) => r.date.slice(0, 4)))].sort().reverse();
  const qs = (patch: Record<string, string>) => {
    const p = new URLSearchParams({ kind, target, year, q, ...patch });
    for (const [k, v] of [...p.entries()]) if (!v) p.delete(k);
    const s = p.toString();
    return "/service" + (s ? `?${s}` : "");
  };
  const defHours = target.startsWith("engine:") ? eng.find((e) => e.id === t.targetId)?.currentHours : eng[0]?.currentHours;

  return (
    <>
      <PageHeader eyebrow="Service log" title="Service log" actions={<Link href={qs({ new: "1" })} className="btn primary">+ New entry</Link>} />

      {sp.new && (
        <div className="mb-5">
          <ServiceForm action={createService} targets={targets} openIssues={openIssues} defaults={{ target: target || undefined, resolves: typeof sp.resolves === "string" ? sp.resolves : undefined, hours: defHours }} cancelHref={qs({})} />
        </div>
      )}

      <form className="mb-3 flex flex-wrap items-center gap-1.5" action="/service">
        {target && <input type="hidden" name="target" value={target} />}
        <FilterLink href={qs({ kind: "" })} active={!kind}>all kinds</FilterLink>
        {KINDS.map((k) => <FilterLink key={k} href={qs({ kind: k })} active={kind === k}>{k}</FilterLink>)}
        <span className="mx-1 text-line">|</span>
        <FilterLink href={qs({ year: "" })} active={!year}>all years</FilterLink>
        {years.map((y) => <FilterLink key={y} href={qs({ year: y })} active={year === y}>{y}</FilterLink>)}
        {target && <span className="chip solid">{name(t.targetType, t.targetId)} <Link href={qs({ target: "" })} className="ml-1">×</Link></span>}
        <input name="q" defaultValue={q} placeholder="search…" className="input ml-auto max-w-[180px] py-1 text-xs" />
      </form>

      {rows.length === 0 ? (
        <Empty action={<Link href={qs({ new: "1" })} className="btn">Log the first entry</Link>}>No service entries match.</Empty>
      ) : (
        <div className="card tbl-wrap">
          <table className="tbl">
            <thead><tr><th>Date</th><th>Kind</th><th>Target</th><th>Title</th><th>By</th><th className="num">Hours</th><th className="num">Cost</th></tr></thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id}>
                  <td className="whitespace-nowrap font-mono text-xs">{r.date}</td>
                  <td className="text-muted">{label(r.kind)}</td>
                  <td className="text-muted">{name(r.targetType, r.targetId)}</td>
                  <td><Link href={`/service/${r.id}`} className="font-medium hover:underline">{r.title}</Link> <SourceBadge source={r.source} /></td>
                  <td className="text-muted">{r.performedBy ?? "—"}</td>
                  <td className="num text-muted">{r.engineHoursAt ?? "—"}</td>
                  <td className="num">{money(r.totalCost)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <p className="mt-2 text-xs text-muted">{rows.length} entries · {money(rows.reduce((s, r) => s + (r.totalCost ?? 0), 0))} · last {rows[0] ? shortDate(rows[0].date) : "—"}</p>
    </>
  );
}
