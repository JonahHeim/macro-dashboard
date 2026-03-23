"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/big-picture", label: "Big Picture" },
  { href: "/macro", label: "Macro" },
  { href: "/policy-liquidity", label: "Policy & Liquidity" },
  { href: "/markets", label: "Markets" },
  { href: "/metals", label: "Metals" },
  { href: "/learn", label: "Learn" },
  { href: "/settings", label: "Settings" },
] as const;

export default function TopNav() {
  const pathname = usePathname();

  return (
    <nav className="terminal-panel overflow-x-auto px-2 py-2">
      <div className="inline-flex min-w-full items-center gap-2">
        {NAV_ITEMS.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={
                isActive
                  ? "terminal-data-chip whitespace-nowrap border-caution/50 bg-[linear-gradient(180deg,rgba(35,26,14,0.98),rgba(16,13,9,0.98))] px-4 py-2 font-mono text-[11px] font-semibold uppercase tracking-[0.16em] text-caution shadow-[0_0_0_1px_rgba(255,159,26,0.15),0_10px_26px_rgba(255,159,26,0.12)]"
                  : "terminal-data-chip whitespace-nowrap px-4 py-2 font-mono text-[11px] font-medium uppercase tracking-[0.14em] text-text-muted hover:-translate-y-0.5 hover:border-accent/45 hover:text-text-primary"
              }
            >
              {item.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
