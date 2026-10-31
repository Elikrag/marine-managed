import Link from "next/link";
import { getActivity, getCostSummary, getEngines, getIntervalStatuses, getIssues, getNoteCounts, getPolicies, getTrailer, requireBoat, targetNames } from "@/lib/data";
import { daysUntil, fmtDate, money, shortDate } from "@/lib/format";
import { PageHeader, Section, SevChip, Stat, Empty } from "@/components/ui";

export default async function Overview() {
  const boat = await requireBoat();
  const [eng, ivs, open, pol, costs, activity, trailer] = await Promise.all([
    getEngines(boat.id), getIntervalStatuses(boat.id), getIssues(boat.id, { status: ["open", "monitoring", "scheduled"] }),
    getPolicies(boat.id), getCostSummary(boat.id), getActivity(8), getTrailer(boat.id),
  ]);
  const name = await targetNames(boat.id);
  const counts = await getNoteCounts(open.map((i) => i.id));
  const high = open.filter((i) => i.severity === "high" || i.severity === "safety").length;
  const due = ivs.filter((s) => s.state !== "ok" && s.state !== "unknown").sort((a, b) => (a.hoursLeft ?? a.daysLeft ?? 0) - (b.hoursLeft ?? b.daysLeft ?? 0));
  const nextSvc = due[0] ?? ivs.filter((s) => s.state === "ok").sort((a, b) => (a.hoursLeft ?? 1e9) - (b.hoursLeft ?? 1e9))[0];
  const renewals = pol.map((p) => ({ label: `${p.covers} insurance · ${p.carrier}`, date: p.renews, days: daysUntil(p.renews) })).filter((r) => r.days != null);
  if (boat.registrationExpires) renewals.push({ label: "Boat registration", date: boat.registrationExpires, days: daysUntil(boat.registrationExpires) });
  if (trailer?.registrationExpires) renewals.push({ label: "Trailer registration", date: trailer.registrationExpires, days: daysUntil(trailer.registrationExpires) });
  renewals.sort((a, b) => (a.days ?? 0) - (b.days ?? 0));
  const nextRenewal = renewals[0];

  type Up = { when: string; what: string; href: string; tone: string };
  const upcoming: Up[] = [];
  for (const s of due) {
    const byHours = s.hoursLeft != null && (s.daysLeft == null || s.hoursLeft < 0 || (s.daysLeft >= 0 && s.hoursLeft <= 15));
    const when = byHours ? (s.hoursLeft! < 0 ? "overdue " : "") + Math.abs(s.hoursLeft!) + " h" : (s.daysLeft! < 0 ? "overdue " : "") + Math.abs(s.daysLeft!) + " d";
    upcoming.push({ when, what: s.interval.item + " · " + s.engine.make + " " + s.engine.model, href: "/engines", tone: s.state });
  }
  for (const r of renewals) {
    const soon = (r.days ?? 99) < 30;
    upcoming.push({ when: shortDate(r.date), what: r.label, href: r.label.includes("registration") ? "/boat" : "/insurance", tone: soon ? "due" : "ok" });
  }
  upcoming.splice(8);

  return (
    <>
      <PageHeader eyebrow="Overview" title={boat.name}>
        {[boat.year, boat.make, boat.model].filter(Boolean).join(" ")}
        {boat.lengthFt ? ` · ${boat.lengthFt} ft` : ""}
        {eng.map((e) => ` · ${e.make ?? ""} ${e.model ?? ""} ${e.currentHours} h`).join("")}
        {boat.hin ? ` · HIN ${boat.hin}` : ""}
      </PageHeader>

      <div className="mb-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat label="Open issues" value={open.length} sub={high ? `${high} high or safety` : open.length ? "none high" : "all clear"} tone={high ? "crit" : undefined} />
        <Stat
          label="Next service"
          value={nextSvc ? nextSvc.interval.item : "—"}
          sub={nextSvc ? (nextSvc.hoursLeft != null && nextSvc.hoursLeft < 0 ? `overdue by ${Math.abs(nextSvc.hoursLeft)} engine h` : nextSvc.daysLeft != null && nextSvc.daysLeft < 0 ? `overdue by ${Math.abs(nextSvc.daysLeft)} d` : nextSvc.hoursLeft != null ? `in ${nextSvc.hoursLeft} engine h` : nextSvc.daysLeft != null ? `in ${nextSvc.daysLeft} d` : "") : "no intervals set"}
          tone={nextSvc?.state === "overdue" ? "crit" : nextSvc?.state === "due" ? "warn" : undefined}
        />
        <Stat label={`Spend ${costs.year}`} value={money(costs.ytd)} sub={`lifetime ${money(costs.lifetime)}`} />
        <Stat label="Next renewal" value={nextRenewal ? `${nextRenewal.days} d` : "—"} sub={nextRenewal?.label ?? "nothing on file"} tone={nextRenewal && (nextRenewal.days ?? 99) < 30 ? "warn" : undefined} />
      </div>

      <div className="mb-4 grid gap-3 lg:grid-cols-2">
        <Section title="Open issues" actions={<Link href="/issues" className="text-xs text-accent">all issues →</Link>}>
          {open.length === 0 ? (
            <Empty>No open issues.</Empty>
          ) : (
            <ul className="divide-y divide-line">
              {open.slice(0, 6).map((i) => (
                <li key={i.id} className="flex items-center gap-2 py-2 text-sm">
                  <SevChip s={i.severity} />
                  <Link href={`/issues/${i.id}`} className="min-w-0 flex-1 truncate hover:underline">{i.title}</Link>
                  <span className="hidden text-xs text-muted sm:inline">{name(i.targetType, i.targetId)}</span>
                  {counts.get(i.id)?.claude ? <span className="chip accent">claude</span> : null}
                </li>
              ))}
            </ul>
          )}
        </Section>
        <Section title="Recent activity" actions={<Link href="/settings" className="text-xs text-accent">full log →</Link>}>
          {activity.length === 0 ? (
            <Empty>Nothing yet. Add a service entry or an issue.</Empty>
          ) : (
            <ul className="divide-y divide-line">
              {activity.map((a) => (
                <li key={a.id} className="flex items-baseline gap-2 py-2 text-sm">
                  <span className="w-12 shrink-0 font-mono text-xs text-muted">{shortDate(a.at.slice(0, 10))}</span>
                  {a.actor === "claude" && <span className="chip accent">claude</span>}
                  <span className="min-w-0 truncate">{a.summary}</span>
                </li>
              ))}
            </ul>
          )}
        </Section>
      </div>

      <Section title="Upcoming">
        {upcoming.length === 0 ? (
          <Empty>Add service intervals on the Engines page and renewal dates under Insurance to see what is coming up.</Empty>
        ) : (
          <ul className="divide-y divide-line">
            {upcoming.map((u, i) => (
              <li key={i} className="flex items-baseline gap-3 py-2 text-sm">
                <span className={`w-24 shrink-0 font-mono text-xs ${u.tone === "overdue" ? "text-crit" : u.tone === "due" ? "text-warn" : "text-muted"}`}>{u.when}</span>
                <Link href={u.href} className="hover:underline">{u.what}</Link>
              </li>
            ))}
          </ul>
        )}
      </Section>
      {boat.registrationExpires && <p className="mt-3 text-xs text-muted">Registration expires {fmtDate(boat.registrationExpires)}.</p>}
    </>
  );
}
