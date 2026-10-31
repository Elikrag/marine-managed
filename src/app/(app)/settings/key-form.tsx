"use client";
import { useActionState } from "react";
import { generateKey } from "./actions";
import { CopyButton } from "./copy";

export function KeyForm() {
  const [state, action, pending] = useActionState(generateKey, undefined);
  return (
    <div>
      {state?.raw && (
        <div className="mb-3 rounded-md border border-accent/50 bg-accent/5 p-3 text-sm">
          <div className="eyebrow mb-1">New key. Shown once.</div>
          <div className="flex items-center gap-2">
            <code className="min-w-0 flex-1 break-all font-mono text-xs">{state.raw}</code>
            <CopyButton text={state.raw} />
          </div>
        </div>
      )}
      <form action={action} className="flex flex-wrap items-end gap-2">
        <div>
          <label className="label" htmlFor="label">Label</label>
          <input id="label" name="label" className="input" placeholder="claude.ai" required />
        </div>
        <div>
          <label className="label" htmlFor="scope">Scope</label>
          <select id="scope" name="scope" className="select" defaultValue="read_write">
            <option value="read_write">read + write</option>
            <option value="read">read only</option>
          </select>
        </div>
        <button className="btn primary" disabled={pending}>Generate key</button>
      </form>
    </div>
  );
}
