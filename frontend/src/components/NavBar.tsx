"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { WalletConnect } from "./WalletConnect";

const LINKS = [
  { href: "/", label: "Home" },
  { href: "/holdings", label: "Holdings & Alerts" },
  { href: "/yields", label: "Yields" },
  { href: "/feeds", label: "Feeds" },
  { href: "/verify", label: "Verify" },
];

export function NavBar() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-10 border-b border-border bg-ink/95 backdrop-blur">
      <div className="mx-auto flex max-w-4xl flex-wrap items-center justify-between gap-3 px-4 py-4">
        <div className="flex flex-wrap items-center gap-4">
          <Link href="/" className="text-lg font-bold whitespace-nowrap">
            AI-Asset Router
          </Link>
          <nav className="flex flex-wrap gap-1">
            {LINKS.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className={`rounded-lg px-3 py-1.5 text-sm ${
                  pathname === l.href
                    ? "bg-panel text-accent"
                    : "text-neutral-400 hover:text-neutral-200"
                }`}
              >
                {l.label}
              </Link>
            ))}
          </nav>
        </div>
        <WalletConnect />
      </div>
    </header>
  );
}
