import Link from "next/link";
import { getDocuments, getEngines, getSystems, requireBoat } from "@/lib/data";
import { fmtDate, money } from "@/lib/format";
import { Field, FormActions, Input, PageHeader, Row, Section, Textarea } from "@/components/ui";
import { saveBoat } from "./actions";

export default async function BoatPage({ searchParams }: PageProps<"/boat">) {
  const sp = await searchParams;
  const boat = await requireBoat();
  const [eng, sys, docs] = await Promise.all([getEngines(boat.id), getSystems(boat.id), getDocuments(boat.id, { attachedType: "boat" })]);

  if (sp.edit) {
    return (
      <>
        <PageHeader eyebrow="Boat" title="Edit boat profile" />
        <form action={saveBoat} className="card max-w-3xl p-5">
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Name" className="sm:col-span-2"><Input name="name" value={boat.name} required /></Field>
            <Field label="Make"><Input name="make" value={boat.make} /></Field>
            <Field label="Model"><Input name="model" value={boat.model} /></Field>
            <Field label="Year"><Input name="year" type="number" value={boat.year} /></Field>
            <Field label="HIN"><Input name="hin" value={boat.hin} /></Field>
            <Field label="Length (ft)"><Input name="lengthFt" type="number" step="0.1" value={boat.lengthFt} /></Field>
            <Field label="Beam (ft)"><Input name="beamFt" type="number" step="0.1" value={boat.beamFt} /></Field>
            <Field label="Hull type"><Input name="hullType" value={boat.hullType} placeholder="Deep-V, cat, displacement…" /></Field>
            <Field label="Hull material"><Input name="hullMaterial" value={boat.hullMaterial} placeholder="Fiberglass, aluminum…" /></Field>
            <Field label="Registration no."><Input name="registrationNo" value={boat.registrationNo} /></Field>
            <Field label="Registration expires"><Input name="registrationExpires" type="date" value={boat.registrationExpires} /></Field>
            <Field label="Home port"><Input name="homePort" value={boat.homePort} /></Field>
            <Field label="Purchase date"><Input name="purchaseDate" type="date" value={boat.purchaseDate} /></Field>
            <Field label="Purchase price"><Input name="purchasePrice" type="number" step="0.01" value={boat.purchasePrice} /></Field>
            <Field label="Notes" className="sm:col-span-2"><Textarea name="notes" value={boat.notes} /></Field>
          </div>
          <FormActions cancelHref="/boat" />
        </form>
      </>
    );
  }

  return (
    <>
      <PageHeader eyebrow="Boat" title={boat.name} actions={<Link href="/boat?edit=1" className="btn primary">Edit</Link>}>
        {[boat.year, boat.make, boat.model].filter(Boolean).join(" ")}
      </PageHeader>
      <div className="grid gap-3 lg:grid-cols-2">
        <Section title="Identity">
          <Row k="make / model" v={[boat.make, boat.model].filter(Boolean).join(" ") || null} />
          <Row k="year" v={boat.year} />
          <Row k="HIN" v={boat.hin} />
          <Row k="hull" v={[boat.hullType, boat.hullMaterial].filter(Boolean).join(" · ") || null} />
          <Row k="length / beam" v={boat.lengthFt || boat.beamFt ? `${boat.lengthFt ?? "?"} ft / ${boat.beamFt ?? "?"} ft` : null} />
          <Row k="home port" v={boat.homePort} />
        </Section>
        <Section title="Registration & purchase">
          <Row k="reg. no." v={boat.registrationNo} />
          <Row k="reg. expires" v={boat.registrationExpires ? fmtDate(boat.registrationExpires) : null} />
          <Row k="purchased" v={boat.purchaseDate ? `${fmtDate(boat.purchaseDate)}${boat.purchasePrice ? ` · ${money(boat.purchasePrice)}` : ""}` : null} />
          <Row k="notes" v={boat.notes} />
        </Section>
        <Section title={`Engines (${eng.length})`} actions={<Link href="/engines" className="text-xs text-accent">manage →</Link>}>
          {eng.length ? (
            <ul className="text-sm">{eng.map((e) => <li key={e.id}>{[e.year, e.make, e.model].filter(Boolean).join(" ")} · {e.currentHours} h</li>)}</ul>
          ) : <span className="text-sm text-muted">No engines yet.</span>}
        </Section>
        <Section title={`Systems (${sys.length})`} actions={<Link href="/systems" className="text-xs text-accent">manage →</Link>}>
          {sys.length ? <p className="text-sm">{sys.slice(0, 8).map((s) => s.name).join(" · ")}{sys.length > 8 ? " · …" : ""}</p> : <span className="text-sm text-muted">No systems yet.</span>}
        </Section>
        <Section title="Documents attached to the boat" actions={<Link href="/documents?new=1&attach=boat:" className="text-xs text-accent">attach →</Link>} className="lg:col-span-2">
          {docs.length ? (
            <ul className="flex flex-wrap gap-2 text-sm">{docs.map((d) => <li key={d.id}><Link href={`/documents/${d.id}`} className="chip low hover:text-fg">{d.kind} · {d.title}</Link></li>)}</ul>
          ) : <span className="text-sm text-muted">Nothing attached.</span>}
        </Section>
      </div>
    </>
  );
}
