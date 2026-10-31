import Link from "next/link";
import { getIssues, getNoteCounts, requireBoat, splitTarget, targetNames, targetOptions } from "@/lib/data";
import { daysUntil, ISSUE_STATUSES, label } from "@/lib/format";
import { Empty, FilterLink, PageHeader, SevChip, StatusChip } from "@/components/ui";
import { IssueForm } from "./form";
import { createIssueAction } from "./actions";

export default async function IssuesPage({ searchParams }: PageProps<"/issues">) {
  const sp = await searchParams;
  const boat = await requireBoat();
  const view = sp.view === "list" ? "list" : "board";
  const target = typeof sp.target === "string" ? sp.target : "";
  const t = splitTarget(target || null);
  const [all, name, targets] = await Promise.all([getIssues(boat.id, target ? { targetType: t.targetType, targetId: t.targetId ?? undefined } : {}), targetNames(boat.id), targetOptions(boat.id)]);
  const counts = await getNoteCounts(all.map((i) => i.id));
  const cols: { key: string; items: typeof all }[] = [
    { key: "open", items: all.filter((i) => i.status === "open") },
    { key: "monitoring", items: all.filter((i) => i.status === "monitoring") },
    { key: "scheduled", items: all.filter((i) => i.status === "scheduled") },
    { key: "resolved", items: all.filter((i) => i.status === "resolved" || i.status === "wont_fix") },
  ];
  const age = (d: string | null) => { const n = daysUntil(d); return n == null ? "" : `${Math.abs(n)} d`; };

  return (
    <>
      <PageHeader eyebrow="Issues" title="Known issues" actions={<Link href="/issues?new=1" className="btn primary">+ New issue</Link>}>
        From &ldquo;keep an eye on it&rdquo; to &ldquo;fix before launch&rdquo;. Claude can add notes to any issue&apos;s thread.
      </PageHeader>
      {sp.new && <div className="mb-5"><IssueForm action={createIssueAction} targets={targets} cancelHref="/issues" defaultTarget={target || undefined} /></div>}

      <div className="mb-3 flex flex-wrap items-center gap-1.5">
        <FilterLink href="/issues" active={view === "board"}>board</FilterLink>
        <FilterLink href="/issues?view=list" active={view === "list"}>list</FilterLink>
        {target && <span className="chip solid ml-2">{name(t.targetType, t.targetId)} <Link href="/issues" className="ml-1">×</Link></span>}
      </div>

      {all.length === 0 ? (
        <Empty action={<Link href="/issues?new=1" className="btn">Open an issue</Link>}>No issues recorded. Nice.</Empty>
      ) : view === "board" ? (
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          {cols.map((c) => (
            <div key={c.key} className="card min-h-[160px] p-3">
              <div className="eyebrow mb-2">{c.key} · {c.items.length}</div>
              <div className="space-y-2">
                {c.items.map((i) => (
                  <Link key={i.id} href={`/issues/${i.id}`} className="block rounded-md border border-line bg-bg p-2.5 text-sm hover:border-accent">
                    <div className="font-medium">{i.title}</div>
                    <div className="mt-1 flex flex-wrap items-center gap-1.5 text-xs text-muted">
                      <SevChip s={i.severity} />
                      <span>{name(i.targetType, i.targetId)}</span>
                      {i.status === "resolved" ? <span>· {i.resolvedOn}</span> : <span>· {age(i.firstNoticed)}</span>}
                      {counts.get(i.id)?.n ? <span>· {counts.get(i.id)!.n} notes</span> : null}
                      {counts.get(i.id)?.claude ? <span className="chip accent">claude</span> : null}
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="card tbl-wrap">
          <table className="tbl">
            <thead><tr><th>Sev</th><th>Title</th><th>Target</th><th>Status</th><th>Since</th><th>Notes</th></tr></thead>
            <tbody>
              {ISSUE_STATUSES.flatMap((s) => all.filter((i) => i.status === s)).map((i) => (
                <tr key={i.id}>
                  <td><SevChip s={i.severity} /></td>
                  <td><Link href={`/issues/${i.id}`} className="font-medium hover:underline">{i.title}</Link></td>
                  <td className="text-muted">{name(i.targetType, i.targetId)}</td>
                  <td><StatusChip s={i.status} /></td>
                  <td className="font-mono text-xs text-muted">{i.firstNoticed}</td>
                  <td className="text-muted">{counts.get(i.id)?.n ?? 0}{counts.get(i.id)?.claude ? <span className="chip accent ml-1">claude</span> : null}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <p className="mt-2 text-xs text-muted">{label("wont_fix")} issues are shown in the resolved column.</p>
    </>
  );
}
