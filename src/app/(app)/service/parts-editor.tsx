"use client";
import { useState } from "react";
import type { Part } from "@/db";

export function PartsEditor({ initial }: { initial: Part[] }) {
  const [rows, setRows] = useState<Part[]>(initial.length ? initial : []);
  return (
    <div className="space-y-2">
      {rows.map((r, i) => (
        <div key={i} className="grid grid-cols-[1fr_110px_60px_90px_28px] gap-1.5">
          <input name="partName" defaultValue={r.name} placeholder="Part" className="input" aria-label="Part name" />
          <input name="partNo" defaultValue={r.partNo} placeholder="Part no." className="input" aria-label="Part number" />
          <input name="partQty" defaultValue={r.qty ?? 1} type="number" min={1} className="input" aria-label="Quantity" />
          <input name="partCost" defaultValue={r.cost} type="number" step="0.01" placeholder="$" className="input" aria-label="Unit cost" />
          <button type="button" onClick={() => setRows(rows.filter((_, j) => j !== i))} className="btn sm px-0 justify-center" aria-label="Remove part">×</button>
        </div>
      ))}
      <button type="button" onClick={() => setRows([...rows, { name: "", qty: 1 }])} className="btn sm">+ part</button>
    </div>
  );
}
