import Link from "next/link";
import { getCosts, getCostSummary, getEngines, requireBoat } from "@/lib/data";
import { COST_CATEGORIES, money, today } from "@/lib/format";
import { Empty, Field, FilterLink, Input, PageHeader, Section, Select, SourceBadge, Stat } from "@/components/ui";
import { createCost, deleteCost } from "./actions";

const MONTHS = ["J", "F", "M", "A", "M", "J", "J", "A", "S", "O", "N", "D"];

export default async function CostsPage({ searchParams }: PageProps<"/costs">) {
  const sp = await searchParams;
  const boat = await requireBoat();
  const year = typeof sp.year === "string" ? sp.year : new Date().getFullYear().toString();
  const cat = typeof sp.category === "string" ? sp.category : "";
  const [sum, rows, eng] = await Promise.all([getCostSummary(boat.id, year), getCosts(boat.id, { year, category: cat || undefined }), getEngines(boat.id)]);
  const years = sum.byYear.map(([y]) => y).reverse();
  if (!years.includes(year)) years.unshift(year);
  const hours = eng.reduce((s, e) => s + e.currentHours, 0);
  const max = Math.max(1, ...sum.byMonth);
  const top = sum.byCategory[0];
  const qs = (p: Record<string, string>) => { const u = new URLSearchParams({ year, category: cat, ...p }); for (const [k, v] of [...u.entries()]) if (!v) u.delete(k); return `/costs?${u}`; };

  return (
    <>
      <PageHeader eyebrow="Costs" title="Costs" actions={<Link href={qs({ new: "1" })} className="btn primary">+ Manual entry</Link>}>
        Service, insurance and storage post here automatically. Add fuel and odds and ends by hand.
      </PageHeader>

      {sp.new && (
        <form action={createCost} className="card mb-4 max-w-3xl p-5">
          <div className="grid gap-3 sm:grid-cols-5">
            <Field label="Date"><Input name="date" type="date" value={today()} required /></Field>
            <Field label="Category"><Select name="category" value="fuel" options={COST_CATEGORIES} /></Field>
            <Field label="Amount"><Input name="amount" type="number" step="0.01" required /></Field>
            <Field label="Vendor"><Input name="vendor" /></Field>
            <Field label="Note"><Input name="note" placeholder="38 gal" /></Field>
          </div>
          <div className="mt-3 flex gap-2"><button className="btn primary">Add</button><Link href={qs({})} className="btn">Cancel</Link></div>
        </form>
      )}

      <div className="mb-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat label={`Total ${year}`} value={money(sum.ytd)} />
        <Stat label="Lifetime" value={money(sum.lifetime)} sub={boat.purchaseDate ? `since ${boat.purchaseDate.slice(0, 4)}` : undefined} />
        <Stat label="Per engine hour" value={hours ? money(sum.lifetime / hours) : "—"} sub="lifetime ÷ hours" />
        <Stat label="Top category" value={top ? top[0] : "—"} sub={top ? `${money(top[1])} · ${Math.round((top[1] / sum.ytd) * 100)}%` : undefined} />
      </div>

      <div className="mb-4 grid gap-3 lg:grid-cols-2">
        <Section title={`By month · ${year}`}>
          <div className="flex h-28 items-end gap-1.5 border-b border-line px-1">
            {sum.byMonth.map((v, i) => (
              <div key={i} className="flex h-full flex-1 flex-col items-center justify-end" title={money(v)}>
                <div className="w-full rounded-t-sm bg-accent" style={{ height: `${(v / max) * 100}%`, opacity: v ? 0.85 : 0.15, minHeight: 2 }} />
              </div>
            ))}
          </div>
          <div className="flex gap-1.5 px-1 pt-1 font-mono text-[10px] text-muted">{MONTHS.map((m, i) => <span key={i} className="flex-1 text-center">{m}</span>)}</div>
        </Section>
        <Section title={`By category · ${year}`}>
          {sum.byCategory.length === 0 ? <Empty>No costs this year.</Empty> : (
            <table className="tbl">
              <tbody>
                {sum.byCategory.map(([c, v]) => (
                  <tr key={c}>
                    <td><Link href={qs({ category: c })} className="hover:underline">{c}</Link></td>
                    <td className="w-1/2"><div className="h-2 rounded-sm bg-fg/80" style={{ width: `${(v / sum.byCategory[0][1]) * 100}%` }} /></td>
                    <td className="num">{money(v)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Section>
      </div>

      <div className="mb-3 flex flex-wrap items-center gap-1.5">
        {years.map((y) => <FilterLink key={y} href={qs({ year: y })} active={year === y}>{y}</FilterLink>)}
        <span className="mx-1 text-line">|</span>
        <FilterLink href={qs({ category: "" })} active={!cat}>all</FilterLink>
        {COST_CATEGORIES.map((c) => <FilterLink key={c} href={qs({ category: c })} active={cat === c}>{c}</FilterLink>)}
      </div>
      {rows.length === 0 ? <Empty>No entries.</Empty> : (
        <div className="card tbl-wrap">
          <table className="tbl">
            <thead><tr><th>Date</th><th>Category</th><th>Vendor</th><th>Note</th><th className="num">Amount</th><th>Linked</th><th></th></tr></thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id}>
                  <td className="font-mono text-xs">{r.date}</td>
                  <td className="text-muted">{r.category}</td>
                  <td>{r.vendor ?? "—"}</td>
                  <td>{r.note ?? "—"} <SourceBadge source={r.source} /></td>
                  <td className="num">{money(r.amount, { cents: true })}</td>
                  <td className="text-xs text-muted">
                    {r.linkedType === "service_entry" && r.linkedId ? <Link href={`/service/${r.linkedId}`} className="text-accent">service</Link> : r.linkedType === "policy" ? <Link href="/insurance" className="text-accent">policy</Link> : r.linkedType === "storage" ? <Link href="/storage" className="text-accent">storage</Link> : "manual"}
                  </td>
                  <td className="text-right">
                    {(r.linkedType === "manual" || !r.linkedType) && (
                      <form action={deleteCost}><input type="hidden" name="id" value={r.id} /><button className="text-xs text-muted hover:text-crit">delete</button></form>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
