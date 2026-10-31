import { OrcaMark } from "@/components/orca";
import { LoginForm } from "./form";

export default async function LoginPage({ searchParams }: PageProps<"/login">) {
  const sp = await searchParams;
  const next = typeof sp.next === "string" ? sp.next : "/";
  return (
    <div className="flex min-h-full items-center justify-center px-4">
      <div className="card w-full max-w-sm p-6">
        <div className="mb-5 flex items-center gap-2 font-display text-lg font-semibold">
          <OrcaMark size={30} /> Marine Managed
        </div>
        <LoginForm next={next} />
        <p className="mt-4 text-xs text-muted">Password is set with APP_PASSWORD in the environment.</p>
      </div>
    </div>
  );
}
