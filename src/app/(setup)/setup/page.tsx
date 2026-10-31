import { redirect } from "next/navigation";
import { requireAuth } from "@/lib/auth";
import { getBoat } from "@/lib/data";
import { OrcaMark } from "@/components/orca";
import { Field, Input } from "@/components/ui";
import { createBoat } from "./actions";

export default async function SetupPage() {
  await requireAuth();
  if (await getBoat()) redirect("/");
  return (
    <div className="mx-auto max-w-xl px-4 py-10">
      <div className="mb-6 flex items-center gap-2 font-display text-lg font-semibold">
        <OrcaMark size={30} /> Marine Managed
      </div>
      <h1 className="text-2xl font-semibold">Start with the boat</h1>
      <p className="mb-5 mt-1 text-sm text-muted">Just the basics. Everything else can be filled in from the profile page.</p>
      <form action={createBoat} className="card space-y-3 p-5">
        <Field label="Boat name"><Input name="name" required placeholder="What you call her" /></Field>
        <div className="grid grid-cols-3 gap-3">
          <Field label="Year"><Input name="year" type="number" /></Field>
          <Field label="Make"><Input name="make" placeholder="Make" /></Field>
          <Field label="Model"><Input name="model" placeholder="Model" /></Field>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Length (ft)"><Input name="lengthFt" type="number" step="0.1" /></Field>
          <Field label="HIN"><Input name="hin" /></Field>
        </div>
        <button className="btn primary">Create boat</button>
      </form>
    </div>
  );
}
