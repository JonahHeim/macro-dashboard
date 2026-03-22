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
    <nav className="border-b border-border-strong overflow-x-auto">
      <div className="inline-flex min-w-full items-end gap-0">
        {NAV_ITEMS.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={
                isActive
                  ? "px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.1em] text-caution border-b-2 border-caution whitespace-nowrap -mb-px"
                  : "px-4 py-2 text-[11px] font-medium uppercase tracking-[0.1em] text-text-muted hover:text-text-secondary border-b-2 border-transparent whitespace-nowrap -mb-px transition-colors"
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
