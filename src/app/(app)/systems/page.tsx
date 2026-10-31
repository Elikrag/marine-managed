import Link from "next/link";
import { getIssues, getServiceEntries, getSystems, requireBoat } from "@/lib/data";
import { fmtDate, SYSTEM_CATEGORIES } from "@/lib/format";
import { Empty, Field, FilterLink, FormActions, Input, PageHeader, Select, Textarea } from "@/components/ui";
import { deleteSystem, saveSystem } from "./actions";

export default async function SystemsPage({ searchParams }: PageProps<"/systems">) {
  const sp = await searchParams;
  const boat = await requireBoat();
  const [all, svc, iss] = await Promise.all([getSystems(boat.id), getServiceEntries(boat.id, { targetType: "system" }), getIssues(boat.id, { status: ["open", "monitoring", "scheduled"], targetType: "system" })]);
  const cat = typeof sp.category === "string" ? sp.category : "";
  const rows = cat ? all.filter((s) => s.category === cat) : all;
  const editing = typeof sp.edit === "string" ? all.find((s) => s.id === sp.edit) : undefined;
  const showForm = sp.new || editing;
  const lastService = (id: string) => svc.find((s) => s.targetId === id)?.date;
  const openCount = (id: string) => iss.filter((i) => i.targetId === id).length;

  return (
    <>
      <PageHeader eyebrow="Systems" title="Systems inventory" actions={<Link href="/systems?new=1" className="btn primary">+ Add system</Link>}>
        Anything with a make, model or serial worth remembering. This is what Claude leans on when troubleshooting.
      </PageHeader>

      {showForm && (
        <form action={saveSystem} className="card mb-4 max-w-3xl p-5">
          <div className="eyebrow mb-3">{editing ? "Edit system" : "New system"}</div>
          {editing && <input type="hidden" name="id" value={editing.id} />}
          <div className="grid gap-3 sm:grid-cols-3">
            <Field label="Category"><Select name="category" value={editing?.category ?? "electrical"} options={SYSTEM_CATEGORIES} /></Field>
            <Field label="Name" className="sm:col-span-2"><Input name="name" value={editing?.name} placeholder="Bilge pump (aft)" required /></Field>
            <Field label="Make"><Input name="make" value={editing?.make} /></Field>
            <Field label="Model"><Input name="model" value={editing?.model} /></Field>
            <Field label="Serial"><Input name="serial" value={editing?.serial} /></Field>
            <Field label="Installed"><Input name="installedOn" type="date" value={editing?.installedOn} /></Field>
            <Field label="Notes" className="sm:col-span-2"><Textarea name="notes" value={editing?.notes} rows={2} placeholder="Wiring, location, quirks…" /></Field>
          </div>
          <FormActions cancelHref="/systems" deleteAction={editing ? deleteSystem : undefined} />
        </form>
      )}

      <div className="mb-3 flex flex-wrap gap-1.5">
        <FilterLink href="/systems" active={!cat}>all</FilterLink>
        {SYSTEM_CATEGORIES.filter((c) => all.some((s) => s.category === c)).map((c) => (
          <FilterLink key={c} href={`/systems?category=${c}`} active={cat === c}>{c}</FilterLink>
        ))}
      </div>

      {rows.length === 0 ? (
        <Empty action={<Link href="/systems?new=1" className="btn">Add a system</Link>}>Nothing here yet.</Empty>
      ) : (
        <div className="card tbl-wrap">
          <table className="tbl">
            <thead><tr><th>Category</th><th>Name</th><th>Make / model</th><th>Serial</th><th>Installed</th><th>Last service</th><th>Issues</th><th></th></tr></thead>
            <tbody>
              {rows.map((s) => (
                <tr key={s.id}>
                  <td className="text-muted">{s.category}</td>
                  <td className="font-medium">{s.name}{s.notes && <div className="text-xs font-normal text-muted">{s.notes}</div>}</td>
                  <td>{[s.make, s.model].filter(Boolean).join(" ") || "—"}</td>
                  <td className="font-mono text-xs">{s.serial ?? "—"}</td>
                  <td className="text-muted">{fmtDate(s.installedOn)}</td>
                  <td><Link href={`/service?target=system:${s.id}`} className="text-accent">{lastService(s.id) ? fmtDate(lastService(s.id)) : "—"}</Link></td>
                  <td>{openCount(s.id) ? <Link href={`/issues?target=system:${s.id}`} className="chip high">{openCount(s.id)}</Link> : "—"}</td>
                  <td className="text-right whitespace-nowrap">
                    <Link href={`/service?new=1&target=system:${s.id}`} className="mr-2 text-xs text-accent">log</Link>
                    <Link href={`/systems?edit=${s.id}`} className="text-xs text-accent">edit</Link>
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
