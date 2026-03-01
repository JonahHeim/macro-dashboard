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
    <nav className="overflow-x-auto">
      <div className="inline-flex min-w-full items-center gap-2 rounded-lg border border-border bg-surface p-1">
        {NAV_ITEMS.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={
                isActive
                  ? "rounded-md bg-accent/20 px-3 py-1.5 text-xs font-medium text-accent"
                  : "rounded-md px-3 py-1.5 text-xs font-medium text-text-secondary hover:bg-surface-elevated hover:text-text-primary"
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
