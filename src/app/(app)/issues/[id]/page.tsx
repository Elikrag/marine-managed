import Link from "next/link";
import { notFound } from "next/navigation";
import { getIssue, getIssueNotes, getServiceEntries, requireBoat, targetNames, targetOptions } from "@/lib/data";
import { fmtDate, ISSUE_STATUSES, money } from "@/lib/format";
import { PageHeader, Row, Section, Select, SevChip, StatusChip } from "@/components/ui";
import { IssueForm } from "../form";
import { addNote, deleteIssue, deleteNote, setStatus, updateIssueAction } from "../actions";

export default async function IssueDetail({ params, searchParams }: PageProps<"/issues/[id]">) {
  const { id } = await params;
  const sp = await searchParams;
  const boat = await requireBoat();
  const issue = await getIssue(id);
  if (!issue) notFound();
  const [notes, name, targets, svc] = await Promise.all([getIssueNotes(id), targetNames(boat.id), targetOptions(boat.id), getServiceEntries(boat.id)]);
  const linked = svc.filter((s) => s.resolvesIssueId === id);

  if (sp.edit) {
    return (
      <>
        <PageHeader eyebrow="Issue" title="Edit issue" />
        <IssueForm action={updateIssueAction} issue={issue} targets={targets} cancelHref={`/issues/${id}`} deleteAction={deleteIssue} />
      </>
    );
  }

  return (
    <>
      <PageHeader
        eyebrow={`Issue · ${name(issue.targetType, issue.targetId)}`}
        title={<span className="flex flex-wrap items-center gap-2">{issue.title} <SevChip s={issue.severity} /></span>}
        actions={
          <>
            <form action={setStatus} className="flex items-center gap-1">
              <input type="hidden" name="id" value={id} />
              <Select name="status" value={issue.status} options={ISSUE_STATUSES} className="py-1.5" />
              <button className="btn">Set</button>
            </form>
            <Link href={`/issues/${id}?edit=1`} className="btn primary">Edit</Link>
          </>
        }
      />
      <div className="grid gap-3 lg:grid-cols-[1fr_320px]">
        <div className="space-y-3">
          <Section title="Notes / diagnosis thread">
            {notes.length === 0 && <p className="mb-3 text-sm text-muted">No notes yet. Record what you observe, or ask Claude to look into it.</p>}
            <ol className="space-y-3">
              {notes.map((n) => (
                <li key={n.id} className={`rounded-md border p-3 text-sm ${n.author === "claude" ? "border-accent/40 bg-accent/5" : "border-line"}`}>
                  <div className="mb-1 flex items-center gap-2 text-xs">
                    <span className={`chip ${n.author === "claude" ? "accent" : "low"}`}>{n.author === "claude" ? "claude" : "you"}</span>
                    <span className="font-mono text-muted">{fmtDate(n.createdAt.slice(0, 10))}</span>
                    <form action={deleteNote} className="ml-auto">
                      <input type="hidden" name="id" value={id} />
                      <input type="hidden" name="noteId" value={n.id} />
                      <button className="text-muted hover:text-crit" aria-label="Delete note">×</button>
                    </form>
                  </div>
                  <div className="whitespace-pre-wrap">{n.body}</div>
                </li>
              ))}
            </ol>
            <form action={addNote} className="mt-3">
              <input type="hidden" name="id" value={id} />
              <textarea name="body" className="textarea" placeholder="Add a note…" required />
              <button className="btn primary mt-2">Add note</button>
            </form>
          </Section>
        </div>
        <div className="space-y-3">
          <Section title="Facts">
            <Row k="status" v={<StatusChip s={issue.status} />} />
            <Row k="first noticed" v={fmtDate(issue.firstNoticed)} />
            <Row k="symptoms" v={issue.symptoms} />
            <Row k="suspected cause" v={issue.suspectedCause} />
            <Row k="est. cost" v={issue.estCost} />
            {issue.resolvedOn && <Row k="resolved" v={`${fmtDate(issue.resolvedOn)}${issue.resolution ? ` · ${issue.resolution}` : ""}`} />}
          </Section>
          <Section title="Linked service" actions={<Link href={`/service?new=1&resolves=${id}&target=${issue.targetType}:${issue.targetId ?? ""}`} className="text-xs text-accent">log fix →</Link>}>
            {linked.length ? (
              <ul className="space-y-1 text-sm">{linked.map((s) => <li key={s.id}><Link href={`/service/${s.id}`} className="hover:underline">{s.date} · {s.title}</Link> <span className="text-muted">{money(s.totalCost)}</span></li>)}</ul>
            ) : <span className="text-sm text-muted">Nothing linked yet.</span>}
          </Section>
        </div>
      </div>
    </>
  );
}
