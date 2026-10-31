import Link from "next/link";
import { getEngines, getIntervals, intervalStatus, requireBoat } from "@/lib/data";
import { fmtDate } from "@/lib/format";
import { Empty, Field, FormActions, Input, PageHeader, Section, Select, Textarea } from "@/components/ui";
import { deleteEngine, deleteInterval, saveEngine, saveInterval, setHours } from "./actions";

export default async function EnginesPage({ searchParams }: PageProps<"/engines">) {
  const sp = await searchParams;
  const boat = await requireBoat();
  const eng = await getEngines(boat.id);
  const ivs = await getIntervals(eng.map((e) => e.id));
  const editing = typeof sp.edit === "string" ? eng.find((e) => e.id === sp.edit) : undefined;
  const showForm = sp.new || editing;
  const ivEditing = typeof sp.interval === "string" ? ivs.find((i) => i.id === sp.interval) : undefined;
  const ivNewFor = typeof sp.addInterval === "string" ? sp.addInterval : undefined;

  return (
    <>
      <PageHeader eyebrow="Engines" title="Engines" actions={<Link href="/engines?new=1" className="btn primary">+ Add engine</Link>}>
        Hours drive the service reminders, so keep the hour meter current.
      </PageHeader>

      {showForm && (
        <form action={saveEngine} className="card mb-4 max-w-3xl p-5">
          <div className="eyebrow mb-3">{editing ? "Edit engine" : "New engine"}</div>
          {editing && <input type="hidden" name="id" value={editing.id} />}
          <div className="grid gap-3 sm:grid-cols-3">
            <Field label="Make"><Input name="make" value={editing?.make} placeholder="Yamaha" /></Field>
            <Field label="Model"><Input name="model" value={editing?.model} placeholder="F300" /></Field>
            <Field label="Year"><Input name="year" type="number" value={editing?.year} /></Field>
            <Field label="Serial"><Input name="serial" value={editing?.serial} /></Field>
            <Field label="HP"><Input name="hp" type="number" value={editing?.hp} /></Field>
            <Field label="Drive"><Select name="driveType" value={editing?.driveType} options={["outboard", "inboard", "sterndrive", "jet", "pod"]} allowEmpty="—" /></Field>
            <Field label="Fuel"><Select name="fuelType" value={editing?.fuelType} options={["gas", "diesel", "electric"]} allowEmpty="—" /></Field>
            <Field label="Prop"><Input name="prop" value={editing?.prop} placeholder="15¼ × 19 SS" /></Field>
            <Field label="Gear ratio"><Input name="gearRatio" value={editing?.gearRatio} placeholder="1.75:1" /></Field>
            {!editing && <Field label="Current hours"><Input name="currentHours" type="number" step="0.1" /></Field>}
            <Field label="Notes" className="sm:col-span-3"><Textarea name="notes" value={editing?.notes} /></Field>
          </div>
          <FormActions cancelHref="/engines" deleteAction={editing ? deleteEngine : undefined} />
        </form>
      )}

      {eng.length === 0 && !showForm && <Empty action={<Link href="/engines?new=1" className="btn">Add the first engine</Link>}>No engines on file.</Empty>}

      <div className="space-y-4">
        {eng.map((e) => {
          const mine = ivs.filter((i) => i.engineId === e.id).map((i) => intervalStatus(i, e));
          return (
            <Section
              key={e.id}
              title={[e.year, e.make, e.model].filter(Boolean).join(" ") || "Engine"}
              actions={
                <div className="flex gap-2">
                  <Link href={`/service?target=engine:${e.id}`} className="text-xs text-accent">history</Link>
                  <Link href={`/engines?edit=${e.id}`} className="text-xs text-accent">edit</Link>
                </div>
              }
            >
              <div className="grid gap-4 md:grid-cols-[1fr_220px]">
                <div className="text-sm">
                  <div className="text-muted">
                    {[e.hp && `${e.hp} hp`, e.driveType, e.fuelType, e.serial && `sn ${e.serial}`].filter(Boolean).join(" · ")}
                  </div>
                  {(e.prop || e.gearRatio) && <div className="mt-1">{[e.prop && `prop ${e.prop}`, e.gearRatio && `ratio ${e.gearRatio}`].filter(Boolean).join(" · ")}</div>}
                  {e.notes && <p className="mt-2 text-muted">{e.notes}</p>}
                </div>
                <form action={setHours} className="card bg-soft p-3">
                  <input type="hidden" name="id" value={e.id} />
                  <div className="eyebrow">Hours</div>
                  <div className="tnum font-display text-2xl font-semibold">{e.currentHours}</div>
                  <div className="mb-2 text-xs text-muted">updated {fmtDate(e.hoursUpdatedAt)}</div>
                  <div className="flex gap-1">
                    <input name="hours" type="number" step="0.1" placeholder="new reading" className="input" aria-label="New hour reading" />
                    <button className="btn primary sm">Set</button>
                  </div>
                </form>
              </div>

              <div className="mt-4">
                <div className="mb-2 flex items-center justify-between">
                  <div className="eyebrow">Service intervals</div>
                  <Link href={`/engines?addInterval=${e.id}`} className="text-xs text-accent">+ interval</Link>
                </div>
                {mine.length === 0 && ivNewFor !== e.id ? (
                  <p className="text-xs text-muted">No intervals. Add e.g. &ldquo;Oil + filter every 100 h&rdquo; to get reminders.</p>
                ) : (
                  <div className="tbl-wrap">
                    <table className="tbl">
                      <thead><tr><th>Item</th><th>Every</th><th>Last</th><th>Next</th><th>Status</th><th></th></tr></thead>
                      <tbody>
                        {mine.map((s) => (
                          <tr key={s.interval.id}>
                            <td>{s.interval.item}</td>
                            <td className="text-muted">{[s.interval.everyHours && `${s.interval.everyHours} h`, s.interval.everyMonths && `${s.interval.everyMonths} mo`].filter(Boolean).join(" / ") || "—"}</td>
                            <td className="text-muted">{[s.interval.lastHours != null && `${s.interval.lastHours} h`, s.interval.lastDate && fmtDate(s.interval.lastDate)].filter(Boolean).join(" · ") || "—"}</td>
                            <td className="tnum">{[s.nextHours != null && `${s.nextHours} h`, s.nextDate && fmtDate(s.nextDate)].filter(Boolean).join(" · ") || "—"}</td>
                            <td>
                              <span className={`chip ${s.state === "overdue" ? "high" : s.state === "due" ? "med" : s.state === "ok" ? "ok" : "low"}`}>
                                {s.state === "overdue" ? (s.hoursLeft != null && s.hoursLeft < 0 ? `overdue ${Math.abs(s.hoursLeft)} h` : `overdue ${Math.abs(s.daysLeft ?? 0)} d`) : s.state === "due" ? (s.hoursLeft != null && s.hoursLeft <= 15 ? `due in ${s.hoursLeft} h` : `due in ${s.daysLeft} d`) : s.state === "ok" && s.hoursLeft != null ? `${s.hoursLeft} h left` : s.state}
                              </span>
                            </td>
                            <td className="text-right"><Link href={`/engines?interval=${s.interval.id}`} className="text-xs text-accent">edit</Link></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
                {(ivNewFor === e.id || (ivEditing && ivEditing.engineId === e.id)) && (
                  <form action={saveInterval} className="mt-3 rounded-md border border-line bg-soft p-3">
                    <input type="hidden" name="engineId" value={e.id} />
                    {ivEditing && <input type="hidden" name="id" value={ivEditing.id} />}
                    <div className="grid gap-2 sm:grid-cols-5">
                      <Field label="Item"><Input name="item" value={ivEditing?.item} placeholder="Oil + filter" required /></Field>
                      <Field label="Every (h)"><Input name="everyHours" type="number" step="1" value={ivEditing?.everyHours} /></Field>
                      <Field label="Every (months)"><Input name="everyMonths" type="number" value={ivEditing?.everyMonths} /></Field>
                      <Field label="Last done (h)"><Input name="lastHours" type="number" step="0.1" value={ivEditing?.lastHours} /></Field>
                      <Field label="Last done (date)"><Input name="lastDate" type="date" value={ivEditing?.lastDate} /></Field>
                    </div>
                    <div className="mt-2 flex gap-2">
                      <button className="btn primary sm">Save</button>
                      <Link href="/engines" className="btn sm">Cancel</Link>
                      {ivEditing && <button formAction={deleteInterval} className="btn danger sm ml-auto" formNoValidate>Delete</button>}
                    </div>
                  </form>
                )}
              </div>
            </Section>
          );
        })}
      </div>
    </>
  );
}
