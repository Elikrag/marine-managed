import Link from "next/link";
import type { Storage } from "@/db";
import { getStorage, requireBoat } from "@/lib/data";
import { fmtDate, money, STORAGE_KINDS } from "@/lib/format";
import { Empty, Field, FormActions, Input, PageHeader, Select, Textarea } from "@/components/ui";
import { deleteStorage, saveStorage } from "./actions";

function Table({ items }: { items: Storage[] }) {
return (
  <div className="card tbl-wrap">
    <table className="tbl">
      <thead><tr><th>What</th><th>Kind</th><th>Where</th><th>Season</th><th className="num">Cost</th><th>Contact</th><th></th></tr></thead>
      <tbody>
        {items.map((r) => (
          <tr key={r.id}>
            <td>{r.target}</td>
            <td className="text-muted">{r.kind.replace("_", " ")}</td>
            <td className="font-medium">{r.locationName}{r.address && <div className="text-xs font-normal text-muted">{r.address}</div>}{r.notes && <div className="text-xs font-normal text-muted">{r.notes}</div>}</td>
            <td className="whitespace-nowrap text-muted">{r.seasonStart || r.seasonEnd ? `${fmtDate(r.seasonStart)} → ${fmtDate(r.seasonEnd)}` : "ongoing"}</td>
            <td className="num">{r.cost != null ? `${money(r.cost)} / ${r.billingPeriod}` : "—"}</td>
            <td className="text-muted">{r.contact ?? "—"}</td>
            <td className="text-right"><Link href={`/storage?edit=${r.id}`} className="text-xs text-accent">edit</Link></td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);
}

export default async function StoragePage({ searchParams }: PageProps<"/storage">) {
  const sp = await searchParams;
  const boat = await requireBoat();
  const rows = await getStorage(boat.id);
  const editing = typeof sp.edit === "string" ? rows.find((r) => r.id === sp.edit) : undefined;
  const showForm = sp.new || editing;
  const today = new Date().toISOString().slice(0, 10);
  const current = rows.filter((r) => (!r.seasonStart || r.seasonStart <= today) && (!r.seasonEnd || r.seasonEnd >= today));
  const past = rows.filter((r) => !current.includes(r));


  return (
    <>
      <PageHeader eyebrow="Storage" title="Storage" actions={<Link href="/storage?new=1" className="btn primary">+ Add arrangement</Link>}>
        Seasonal is the norm, so each record carries a date range. Costs flow into the ledger.
      </PageHeader>
      {showForm && (
        <form action={saveStorage} className="card mb-4 max-w-3xl p-5">
          <div className="eyebrow mb-3">{editing ? "Edit" : "New arrangement"}</div>
          {editing && <input type="hidden" name="id" value={editing.id} />}
          <div className="grid gap-3 sm:grid-cols-3">
            <Field label="For"><Select name="target" value={editing?.target ?? "boat"} options={["boat", "trailer", "both"]} /></Field>
            <Field label="Kind"><Select name="kind" value={editing?.kind ?? "slip"} options={STORAGE_KINDS} /></Field>
            <Field label="Location name"><Input name="locationName" value={editing?.locationName} placeholder="Conanicut Marina, slip B-14" required /></Field>
            <Field label="Address" className="sm:col-span-2"><Input name="address" value={editing?.address} /></Field>
            <Field label="Contact"><Input name="contact" value={editing?.contact} /></Field>
            <Field label="Cost"><Input name="cost" type="number" step="0.01" value={editing?.cost} /></Field>
            <Field label="Per"><Select name="billingPeriod" value={editing?.billingPeriod ?? "season"} options={["season", "month", "year"]} /></Field>
            <div />
            <Field label="Season start"><Input name="seasonStart" type="date" value={editing?.seasonStart} /></Field>
            <Field label="Season end"><Input name="seasonEnd" type="date" value={editing?.seasonEnd} /></Field>
            <Field label="Notes" className="sm:col-span-3"><Textarea name="notes" value={editing?.notes} rows={2} /></Field>
          </div>
          <FormActions cancelHref="/storage" deleteAction={editing ? deleteStorage : undefined} />
        </form>
      )}
      {rows.length === 0 && !showForm ? (
        <Empty action={<Link href="/storage?new=1" className="btn">Add where the boat lives</Link>}>No storage recorded.</Empty>
      ) : (
        <>
          {current.length > 0 && <><div className="eyebrow mb-2">Current</div><Table items={current} /></>}
          {past.length > 0 && <><div className="eyebrow mb-2 mt-5">Other / past</div><Table items={past} /></>}
        </>
      )}
    </>
  );
}
