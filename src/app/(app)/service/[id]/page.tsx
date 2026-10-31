import Link from "next/link";
import { notFound } from "next/navigation";
import { getDocuments, getIssue, getIssues, getServiceEntry, requireBoat, targetNames, targetOptions } from "@/lib/data";
import { fmtDate, label, money } from "@/lib/format";
import { PageHeader, Row, Section, SourceBadge } from "@/components/ui";
import { ServiceForm } from "../form";
import { deleteService, updateService } from "../actions";

export default async function ServiceDetail({ params, searchParams }: PageProps<"/service/[id]">) {
  const { id } = await params;
  const sp = await searchParams;
  const boat = await requireBoat();
  const e = await getServiceEntry(id);
  if (!e) notFound();
  const [name, targets, openIssues, docs, resolves] = await Promise.all([
    targetNames(boat.id), targetOptions(boat.id), getIssues(boat.id), getDocuments(boat.id, { attachedType: "service_entry", attachedId: id }), e.resolvesIssueId ? getIssue(e.resolvesIssueId) : null,
  ]);

  if (sp.edit) {
    return (
      <>
        <PageHeader eyebrow="Service log" title="Edit entry" />
        <ServiceForm action={updateService} entry={e} targets={targets} openIssues={openIssues} cancelHref={`/service/${id}`} deleteAction={deleteService} />
      </>
    );
  }
  const parts = e.parts ?? [];
  return (
    <>
      <PageHeader eyebrow={`Service log · ${label(e.kind)}`} title={e.title} actions={<Link href={`/service/${id}?edit=1`} className="btn primary">Edit</Link>}>
        {fmtDate(e.date)} · {name(e.targetType, e.targetId)}{e.performedBy ? ` · ${e.performedBy}` : ""} <SourceBadge source={e.source} />
      </PageHeader>
      <div className="grid gap-3 lg:grid-cols-2">
        <Section title="Details">
          {e.description && <p className="mb-3 whitespace-pre-wrap text-sm">{e.description}</p>}
          <Row k="engine hours" v={e.engineHoursAt} />
          <Row k="labor" v={e.laborCost != null ? money(e.laborCost, { cents: true }) : null} />
          <Row k="total" v={e.totalCost != null ? money(e.totalCost, { cents: true }) : null} />
          <Row k="resolves" v={resolves ? <Link href={`/issues/${resolves.id}`} className="text-accent">{resolves.title}</Link> : null} />
        </Section>
        <Section title={`Parts (${parts.length})`}>
          {parts.length ? (
            <table className="tbl">
              <thead><tr><th>Part</th><th>No.</th><th className="num">Qty</th><th className="num">Cost</th></tr></thead>
              <tbody>{parts.map((p, i) => <tr key={i}><td>{p.name}</td><td className="font-mono text-xs">{p.partNo ?? "—"}</td><td className="num">{p.qty ?? 1}</td><td className="num">{p.cost != null ? money(p.cost, { cents: true }) : "—"}</td></tr>)}</tbody>
            </table>
          ) : <span className="text-sm text-muted">No parts listed.</span>}
        </Section>
        <Section title="Attachments" actions={<Link href={`/documents?new=1&attach=service_entry:${id}`} className="text-xs text-accent">+ attach</Link>} className="lg:col-span-2">
          {docs.length ? <ul className="flex flex-wrap gap-2 text-sm">{docs.map((d) => <li key={d.id}><Link href={`/documents/${d.id}`} className="chip low hover:text-fg">{d.kind} · {d.title}</Link></li>)}</ul> : <span className="text-sm text-muted">None.</span>}
        </Section>
      </div>
    </>
  );
}
