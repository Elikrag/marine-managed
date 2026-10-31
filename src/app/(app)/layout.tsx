import { redirect } from "next/navigation";
import { requireAuth } from "@/lib/auth";
import { countPending, getBoat } from "@/lib/data";
import { Shell } from "@/components/shell";

export default async function AppLayout({ children }: LayoutProps<"/">) {
  await requireAuth();
  const boat = await getBoat();
  if (!boat) redirect("/setup");
  const pending = await countPending();
  return (
    <Shell boatName={boat.name} pending={pending}>
      {children}
    </Shell>
  );
}
