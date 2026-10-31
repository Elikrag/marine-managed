import Link from "next/link";
import { getDocuments, getPolicies, getTrailer, requireBoat } from "@/lib/data";
import { daysUntil, fmtDate, money } from "@/lib/format";
import { Empty, Field, FormActions, Input, PageHeader, Row, Section, Select, Textarea } from "@/components/ui";
import { deletePolicy, savePolicy } from "./actions";

export default async function InsurancePage({ searchParams }: PageProps<"/insurance">) {
  const sp = await searchParams;
  const boat = await requireBoat();
  const [pol, trailer, docs] = await Promise.all([getPolicies(boat.id), getTrailer(boat.id), getDocuments(boat.id, { attachedType: "policy" })]);
  const editing = typeof sp.edit === "string" ? pol.find((p) => p.id === sp.edit) : undefined;
  const showForm = sp.new || editing;

  return (
    <>
      <PageHeader eyebrow="Insurance" title="Insurance & registration" actions={<Link href="/insurance?new=1" className="btn primary">+ Add policy</Link>}>
        Anything renewing within 60 days shows on the overview.
      </PageHeader>

      {showForm && (
        <form action={savePolicy} className="card mb-4 max-w-3xl p-5">
          <div className="eyebrow mb-3">{editing ? "Edit policy" : "New policy"}</div>
          {editing && <input type="hidden" name="id" value={editing.id} />}
          <div className="grid gap-3 sm:grid-cols-3">
            <Field label="Covers"><Select name="covers" value={editing?.covers ?? "boat"} options={["boat", "trailer", "both"]} /></Field>
            <Field label="Carrier"><Input name="carrier" value={editing?.carrier} required /></Field>
            <Field label="Policy no."><Input name="policyNo" value={editing?.policyNo} /></Field>
            <Field label="Premium"><Input name="premium" type="number" step="0.01" value={editing?.premium} /></Field>
            <Field label="Per"><Select name="billingPeriod" value={editing?.billingPeriod ?? "year"} options={["year", "6 months", "month"]} /></Field>
            <Field label="Agent / contact"><Input name="agentContact" value={editing?.agentContact} /></Field>
            <Field label="Term starts"><Input name="starts" type="date" value={editing?.starts} /></Field>
            <Field label="Renews"><Input name="renews" type="date" value={editing?.renews} /></Field>
            <div />
            <Field label="Hull value"><Input name="hullValue" type="number" value={editing?.hullValue} /></Field>
            <Field label="Liability limit"><Input name="liabilityLimit" type="number" value={editing?.liabilityLimit} /></Field>
            <Field label="Deductible"><Input name="deductible" type="number" value={editing?.deductible} /></Field>
            <Field label="Coverage summary" className="sm:col-span-3"><Textarea name="coverageSummary" value={editing?.coverageSummary} rows={2} placeholder="Agreed value, towing, nav limits, lay-up period…" /></Field>
          </div>
          <FormActions cancelHref="/insurance" deleteAction={editing ? deletePolicy : undefined} />
        </form>
      )}

      <div className="grid gap-3 lg:grid-cols-2">
        {pol.length === 0 && !showForm && <div className="lg:col-span-2"><Empty action={<Link href="/insurance?new=1" className="btn">Add a policy</Link>}>No policies on file.</Empty></div>}
        {pol.map((p) => {
          const d = daysUntil(p.renews);
          const pdocs = docs.filter((x) => x.attachedId === p.id);
          return (
            <Section key={p.id} title={`${p.covers} · ${p.carrier}`} actions={<Link href={`/insurance?edit=${p.id}`} className="text-xs text-accent">edit</Link>}>
              <div className={`tnum mb-2 font-display text-xl font-semibold ${d != null && d < 30 ? "text-warn" : ""}`}>
                {p.renews ? `Renews ${fmtDate(p.renews)}${d != null ? ` · ${d} d` : ""}` : "No renewal date"}
              </div>
              <Row k="policy no." v={p.policyNo} />
              <Row k="premium" v={p.premium != null ? `${money(p.premium)} / ${p.billingPeriod}` : null} />
              <Row k="hull value" v={p.hullValue != null ? money(p.hullValue) : null} />
              <Row k="liability" v={p.liabilityLimit != null ? money(p.liabilityLimit) : null} />
              <Row k="deductible" v={p.deductible != null ? money(p.deductible) : null} />
              <Row k="agent" v={p.agentContact} />
              <Row k="coverage" v={p.coverageSummary} />
              <Row k="documents" v={<span className="flex flex-wrap gap-1">{pdocs.map((x) => <Link key={x.id} href={`/documents/${x.id}`} className="chip low hover:text-fg">{x.title}</Link>)}<Link href={`/documents?new=1&attach=policy:${p.id}`} className="chip accent">+ attach</Link></span>} />
            </Section>
          );
        })}
        <Section title="Registrations">
          <Row k="boat" v={boat.registrationNo ? `${boat.registrationNo} · expires ${fmtDate(boat.registrationExpires)}` : <Link href="/boat?edit=1" className="text-accent">add on boat profile</Link>} />
          <Row k="trailer" v={trailer?.registrationNo ? `${trailer.registrationNo} · expires ${fmtDate(trailer.registrationExpires)}` : <Link href="/trailer?edit=1" className="text-accent">add on trailer profile</Link>} />
        </Section>
      </div>
    </>
  );
}
