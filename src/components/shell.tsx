import Link from "next/link";
import { NavLink } from "./nav-link";
import { OrcaMark } from "./orca";
import { logout } from "@/app/login/actions";

const groups: { items: [string, string, boolean?][] }[] = [
  { items: [["/", "Overview", true], ["/boat", "Boat"], ["/engines", "Engines"], ["/systems", "Systems"], ["/trailer", "Trailer"]] },
  { items: [["/service", "Service log"], ["/issues", "Issues"]] },
  { items: [["/insurance", "Insurance"], ["/storage", "Storage"], ["/costs", "Costs"], ["/documents", "Documents"]] },
  { items: [["/settings", "Settings · Claude"]] },
];

export function Shell({ boatName, pending, children }: { boatName: string; pending: number; children: React.ReactNode }) {
  return (
    <div className="min-h-full md:grid md:grid-cols-[210px_minmax(0,1fr)]">
      <aside className="border-b border-line bg-panel md:sticky md:top-0 md:h-screen md:border-b-0 md:border-r">
        <div className="flex items-center justify-between px-4 py-3 md:block">
          <Link href="/" className="flex items-center gap-2 font-display text-[15px] font-semibold">
            <OrcaMark size={26} />
            <span>
              Marine<span className="text-muted">Managed</span>
            </span>
          </Link>
          <div className="mt-0 truncate text-xs text-muted md:mt-1">{boatName}</div>
        </div>
        <nav className="flex gap-1 overflow-x-auto px-3 pb-3 md:block md:space-y-3 md:pb-0">
          {groups.map((g, i) => (
            <div key={i} className="flex gap-1 md:block md:space-y-0.5">
              {g.items.map(([href, l, exact]) => (
                <NavLink key={href} href={href} exact={exact}>
                  {l}
                  {href === "/settings" && pending > 0 && (
                    <span className="ml-2 rounded-full bg-accent px-1.5 text-[10px] font-semibold text-accent-fg">{pending}</span>
                  )}
                </NavLink>
              ))}
            </div>
          ))}
        </nav>
        <form action={logout} className="hidden px-4 py-3 md:absolute md:bottom-0 md:block">
          <button className="text-xs text-muted hover:text-fg">Sign out</button>
        </form>
      </aside>
      <main className="min-w-0 px-4 py-5 md:px-8 md:py-7">{children}</main>
    </div>
  );
}
