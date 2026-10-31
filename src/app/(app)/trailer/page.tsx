import Link from "next/link";
import { getPolicies, getStorage, getTrailer, requireBoat } from "@/lib/data";
import { fmtDate, money } from "@/lib/format";
import { Empty, Field, FormActions, Input, PageHeader, Row, Section, Textarea } from "@/components/ui";
import { deleteTrailer, saveTrailer } from "../boat/actions";

export default async function TrailerPage({ searchParams }: PageProps<"/trailer">) {
  const sp = await searchParams;
  const boat = await requireBoat();
  const t = await getTrailer(boat.id);
  const [pol, sto] = await Promise.all([getPolicies(boat.id), getStorage(boat.id)]);
  const trailerPol = pol.filter((p) => p.covers !== "boat");
  const trailerSto = sto.filter((s) => s.target !== "boat");

  if (sp.edit || !t) {
    return (
      <>
        <PageHeader eyebrow="Trailer" title={t ? "Edit trailer" : "Add a trailer"} />
        <form action={saveTrailer} className="card max-w-3xl p-5">
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Make"><Input name="make" value={t?.make} /></Field>
            <Field label="Model"><Input name="model" value={t?.model} /></Field>
            <Field label="Year"><Input name="year" type="number" value={t?.year} /></Field>
            <Field label="VIN"><Input name="vin" value={t?.vin} /></Field>
            <Field label="Axles"><Input name="axles" type="number" value={t?.axles} /></Field>
            <Field label="Capacity (lb)"><Input name="capacityLbs" type="number" value={t?.capacityLbs} /></Field>
            <Field label="Tire size"><Input name="tireSize" value={t?.tireSize} placeholder="ST225/75R15" /></Field>
            <Field label="Tire pressure"><Input name="tirePressure" value={t?.tirePressure} placeholder="65 psi" /></Field>
            <Field label="Brakes"><Input name="brakeType" value={t?.brakeType} placeholder="Hydraulic disc, both axles" /></Field>
            <Field label="Last bearing service"><Input name="lastBearingService" type="date" value={t?.lastBearingService} /></Field>
            <Field label="Registration no."><Input name="registrationNo" value={t?.registrationNo} /></Field>
            <Field label="Registration expires"><Input name="registrationExpires" type="date" value={t?.registrationExpires} /></Field>
            <Field label="Notes" className="sm:col-span-2"><Textarea name="notes" value={t?.notes} /></Field>
          </div>
          <FormActions cancelHref="/trailer" deleteAction={t ? deleteTrailer : undefined} deleteLabel="Remove trailer" />
        </form>
      </>
    );
  }

  return (
    <>
      <PageHeader eyebrow="Trailer" title={[t.year, t.make, t.model].filter(Boolean).join(" ") || "Trailer"} actions={<Link href="/trailer?edit=1" className="btn primary">Edit</Link>} />
      <div className="grid gap-3 lg:grid-cols-2">
        <Section title="Identity">
          <Row k="VIN" v={t.vin} />
          <Row k="axles" v={t.axles} />
          <Row k="capacity" v={t.capacityLbs ? `${t.capacityLbs.toLocaleString()} lb` : null} />
          <Row k="tires" v={[t.tireSize, t.tirePressure].filter(Boolean).join(" · ") || null} />
          <Row k="brakes" v={t.brakeType} />
          <Row k="reg." v={t.registrationNo ? `${t.registrationNo}${t.registrationExpires ? ` · exp ${fmtDate(t.registrationExpires)}` : ""}` : null} />
          <Row k="notes" v={t.notes} />
        </Section>
        <div className="space-y-3">
          <Section title="Maintenance" actions={<Link href={`/service?new=1&target=trailer:${t.id}`} className="text-xs text-accent">log service →</Link>}>
            <Row k="bearings" v={t.lastBearingService ? fmtDate(t.lastBearingService) : null} />
            <p className="mt-2 text-xs text-muted"><Link href={`/service?target=trailer:${t.id}`} className="text-accent">Trailer service history →</Link></p>
          </Section>
          <Section title="Insurance" actions={<Link href="/insurance" className="text-xs text-accent">→</Link>}>
            {trailerPol.length ? trailerPol.map((p) => <div key={p.id} className="text-sm">{p.carrier} · {p.covers === "both" ? "rider on boat policy" : "standalone"} · renews {fmtDate(p.renews)}</div>) : <Empty>No policy covers the trailer.</Empty>}
          </Section>
          <Section title="Storage" actions={<Link href="/storage" className="text-xs text-accent">→</Link>}>
            {trailerSto.length ? trailerSto.map((s) => <div key={s.id} className="text-sm">{s.kind.replace("_", " ")} · {s.locationName}{s.cost != null ? ` · ${money(s.cost)}/${s.billingPeriod}` : ""}</div>) : <Empty>No storage recorded for the trailer.</Empty>}
          </Section>
        </div>
      </div>
    </>
  );
}
