import type { Issue } from "@/db";
import type { TargetOption } from "@/lib/data";
import { ISSUE_STATUSES, SEVERITIES, today } from "@/lib/format";
import { Field, FormActions, Input, Select, Textarea } from "@/components/ui";

export function IssueForm({ action, issue, targets, cancelHref, deleteAction, defaultTarget }: { action: (f: FormData) => Promise<void>; issue?: Issue; targets: TargetOption[]; cancelHref: string; deleteAction?: (f: FormData) => Promise<void>; defaultTarget?: string }) {
  const target = issue ? `${issue.targetType}:${issue.targetId ?? ""}` : defaultTarget ?? "boat:";
  return (
    <form action={action} className="card max-w-3xl p-5">
      {issue && <input type="hidden" name="id" value={issue.id} />}
      <div className="grid gap-3 sm:grid-cols-4">
        <Field label="Title" className="sm:col-span-4"><Input name="title" value={issue?.title} placeholder="Bilge pump cycling every ~4 min" required /></Field>
        <Field label="Severity"><Select name="severity" value={issue?.severity ?? "med"} options={SEVERITIES} /></Field>
        <Field label="Status"><Select name="status" value={issue?.status ?? "open"} options={ISSUE_STATUSES} /></Field>
        <Field label="Target" className="sm:col-span-2"><Select name="target" value={target} options={targets} /></Field>
        <Field label="First noticed"><Input name="firstNoticed" type="date" value={issue?.firstNoticed ?? today()} /></Field>
        <Field label="Est. cost"><Input name="estCost" value={issue?.estCost} placeholder="$60–200" /></Field>
        <Field label="Symptoms" className="sm:col-span-4"><Textarea name="symptoms" value={issue?.symptoms} placeholder="What you observe, when, under what conditions" /></Field>
        <Field label="Suspected cause" className="sm:col-span-4"><Textarea name="suspectedCause" value={issue?.suspectedCause} rows={2} /></Field>
        {issue && (
          <>
            <Field label="Resolved on"><Input name="resolvedOn" type="date" value={issue.resolvedOn} /></Field>
            <Field label="Resolution" className="sm:col-span-3"><Input name="resolution" value={issue.resolution} placeholder="What fixed it" /></Field>
          </>
        )}
      </div>
      <FormActions cancelHref={cancelHref} deleteAction={deleteAction} submit={issue ? "Save" : "Open issue"} />
    </form>
  );
}
