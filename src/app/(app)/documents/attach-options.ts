import { getIssues, getPolicies, getServiceEntries, requireBoat, targetOptions, type TargetOption } from "@/lib/data";

/** Everything a document can be attached to. */
export async function attachOptions(): Promise<TargetOption[]> {
  const boat = await requireBoat();
  const [t, svc, iss, pol] = await Promise.all([targetOptions(boat.id), getServiceEntries(boat.id, { limit: 40 }), getIssues(boat.id), getPolicies(boat.id)]);
  return [
    ...t,
    ...pol.map((p) => ({ value: `policy:${p.id}`, label: `Policy · ${p.carrier} (${p.covers})` })),
    ...iss.map((i) => ({ value: `issue:${i.id}`, label: `Issue · ${i.title}` })),
    ...svc.map((s) => ({ value: `service_entry:${s.id}`, label: `Service · ${s.date} ${s.title}` })),
  ];
}
