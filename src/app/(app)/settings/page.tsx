import { getActivity, getApiKeys, getPendingWrites, getSetting } from "@/lib/data";
import { fmtDate } from "@/lib/format";
import { Empty, PageHeader, Section } from "@/components/ui";
import { KeyForm } from "./key-form";
import { approveWrite, rejectWrite, revokeKey, setApproval } from "./actions";

export default async function SettingsPage() {
  const [keys, pending, recent, activity, requireApproval] = await Promise.all([getApiKeys(), getPendingWrites("pending"), getPendingWrites("approved"), getActivity(60), getSetting("mcp_require_approval", "true")]);
  const appUrl = (process.env.APP_URL ?? "http://localhost:3000").replace(/\/$/, "");

  return (
    <>
      <PageHeader eyebrow="Settings" title="Claude connection">
        Generate a key, add the connector in Claude, and every read and write shows up in the activity log below.
      </PageHeader>

      {pending.length > 0 && (
        <Section title={`Pending writes from Claude · ${pending.length}`} className="mb-4 border-accent">
          <ul className="space-y-3">
            {pending.map((p) => (
              <li key={p.id} className="rounded-md border border-line p-3">
                <div className="mb-1 flex items-center gap-2 text-sm">
                  <span className="chip accent">{p.tool}</span>
                  <span className="font-mono text-xs text-muted">{fmtDate(p.createdAt.slice(0, 10))}</span>
                </div>
                <pre className="max-h-48 overflow-auto rounded bg-soft p-2 font-mono text-xs">{JSON.stringify(p.args, null, 2)}</pre>
                <div className="mt-2 flex gap-2">
                  <form action={approveWrite}><input type="hidden" name="id" value={p.id} /><button className="btn primary sm">Approve & apply</button></form>
                  <form action={rejectWrite}><input type="hidden" name="id" value={p.id} /><button className="btn danger sm">Reject</button></form>
                </div>
              </li>
            ))}
          </ul>
        </Section>
      )}

      <div className="mb-4 grid gap-3 lg:grid-cols-2">
        <Section title="API keys">
          <KeyForm />
          {keys.length > 0 && (
            <div className="tbl-wrap mt-4">
              <table className="tbl">
                <thead><tr><th>Label</th><th>Key</th><th>Scope</th><th>Last used</th><th></th></tr></thead>
                <tbody>
                  {keys.map((k) => (
                    <tr key={k.id} className={k.revokedAt ? "opacity-50" : ""}>
                      <td>{k.label}</td>
                      <td className="font-mono text-xs">{k.prefix}…</td>
                      <td className="text-muted">{k.scope.replace("_", " + ")}</td>
                      <td className="text-muted">{k.lastUsedAt ? fmtDate(k.lastUsedAt.slice(0, 10)) : "never"}</td>
                      <td className="text-right">{k.revokedAt ? <span className="text-xs text-muted">revoked</span> : <form action={revokeKey}><input type="hidden" name="id" value={k.id} /><button className="text-xs text-muted hover:text-crit">revoke</button></form>}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Section>

        <Section title="Connect">
          <pre className="overflow-x-auto rounded bg-soft p-3 font-mono text-xs">{`Server URL:   ${appUrl}/mcp
Auth:         Authorization: Bearer <key>
Transport:    Streamable HTTP

If the client cannot set headers, use the key in the path:
              ${appUrl}/mcp/<key>

claude.ai     Settings → Connectors → Add custom connector
Claude Code   claude mcp add --transport http marine ${appUrl}/mcp \\
                --header "Authorization: Bearer <key>"`}</pre>
          <form action={setApproval} className="mt-4 flex items-center gap-3 text-sm">
            <label className="flex items-center gap-2">
              <input type="checkbox" name="require" defaultChecked={requireApproval === "true"} />
              Hold Claude&apos;s writes for my approval before applying
            </label>
            <button className="btn sm">Save</button>
          </form>
          <p className="mt-2 text-xs text-muted">With this on, add_issue_note, create_issue, add_service_entry and the other write tools queue here instead of applying immediately. Reads are never held.</p>
        </Section>
      </div>

      <Section title="Activity log">
        {activity.length === 0 ? <Empty>Nothing logged yet.</Empty> : (
          <ul className="divide-y divide-line">
            {activity.map((a) => (
              <li key={a.id} className="flex items-baseline gap-2 py-1.5 text-sm">
                <span className="w-24 shrink-0 font-mono text-xs text-muted">{a.at.slice(0, 16).replace("T", " ")}</span>
                <span className={`chip ${a.actor === "claude" ? "accent" : "low"}`}>{a.actor}</span>
                <span className={`chip ${a.action === "write" ? "med" : "low"}`}>{a.action}</span>
                <span className="min-w-0 truncate">{a.summary}</span>
              </li>
            ))}
          </ul>
        )}
      </Section>
      {recent.length > 0 && <p className="mt-2 text-xs text-muted">{recent.length} approved writes from Claude so far.</p>}
    </>
  );
}
