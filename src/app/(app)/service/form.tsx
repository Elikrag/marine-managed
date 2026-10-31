import Link from "next/link";
import type { Issue, ServiceEntry } from "@/db";
import type { TargetOption } from "@/lib/data";
import { KINDS, today } from "@/lib/format";
import { Field, Input, Select, Textarea } from "@/components/ui";
import { PartsEditor } from "./parts-editor";

export function ServiceForm({
  action, entry, targets, openIssues, defaults, cancelHref, deleteAction,
}: {
  action: (f: FormData) => Promise<void>;
  entry?: ServiceEntry;
  targets: TargetOption[];
  openIssues: Issue[];
  defaults?: { target?: string; resolves?: string; hours?: number | null };
  cancelHref: string;
  deleteAction?: (f: FormData) => Promise<void>;
}) {
  const target = entry ? `${entry.targetType}:${entry.targetId ?? ""}` : defaults?.target ?? "boat:";
  return (
    <form action={action} className="card max-w-3xl p-5">
      {entry && <input type="hidden" name="id" value={entry.id} />}
      <div className="grid gap-3 sm:grid-cols-4">
        <Field label="Date"><Input name="date" type="date" value={entry?.date ?? today()} required /></Field>
        <Field label="Kind"><Select name="kind" value={entry?.kind ?? "maintenance"} options={KINDS} /></Field>
        <Field label="Target" className="sm:col-span-2"><Select name="target" value={target} options={targets} /></Field>
        <Field label="Title" className="sm:col-span-4"><Input name="title" value={entry?.title} placeholder="Oil + filter, 400 h" required /></Field>
        <Field label="Description" className="sm:col-span-4"><Textarea name="description" value={entry?.description} placeholder="What was done, what was found, part numbers, torque specs…" /></Field>
        <Field label="Performed by"><Input name="performedBy" value={entry?.performedBy ?? "DIY"} placeholder="DIY or shop name" /></Field>
        <Field label="Engine hours"><Input name="engineHoursAt" type="number" step="0.1" value={entry?.engineHoursAt ?? defaults?.hours} /></Field>
        <Field label="Labor cost"><Input name="laborCost" type="number" step="0.01" value={entry?.laborCost} /></Field>
        <Field label="Total (override)"><Input name="totalCost" type="number" step="0.01" value={entry?.totalCost} placeholder="auto from parts + labor" /></Field>
        <Field label="Resolves issue" className="sm:col-span-4">
          <Select name="resolvesIssueId" value={entry?.resolvesIssueId ?? defaults?.resolves} allowEmpty="— none —" options={openIssues.map((i) => ({ value: i.id, label: `${i.severity} · ${i.title}` }))} />
        </Field>
      </div>
      <div className="mt-4">
        <div className="label">Parts</div>
        <PartsEditor initial={entry?.parts ?? []} />
      </div>
      <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-line pt-4">
        <button className="btn primary">Save entry</button>
        <Link href={cancelHref} className="btn">Cancel</Link>
        {deleteAction && <button formAction={deleteAction} formNoValidate className="btn danger ml-auto">Delete</button>}
      </div>
    </form>
  );
}
