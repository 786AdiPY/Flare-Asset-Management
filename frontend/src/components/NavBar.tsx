"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { WalletConnect } from "./WalletConnect";

const LINKS = [
  { href: "/", label: "Router" },
  { href: "/holdings", label: "Holdings & Alerts" },
  { href: "/yields", label: "Yields" },
  { href: "/feeds", label: "Feeds" },
  { href: "/verify", label: "Verify" },
];

export function NavBar() {
  const pathname = usePathname();

  return (
    <header className="sticky top-4 z-40 mx-auto max-w-5xl px-4">
      <div className="glass-nav flex items-center justify-between gap-4 px-5 py-3 shadow-2xl">
        <div className="flex items-center gap-6">
          <Link href="/" className="flex items-center gap-2 group">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-accent text-white font-black text-sm shadow-glow group-hover:scale-105 transition-transform">
              ⚡
            </div>
            <span className="text-base font-bold tracking-tight text-white group-hover:text-accent2 transition-colors">
              AI-Asset Router
            </span>
          </Link>
          <nav className="hidden md:flex items-center gap-1">
            {LINKS.map((l) => {
              const active = pathname === l.href;
              return (
                <Link
                  key={l.href}
                  href={l.href}
                  className={`rounded-full px-3.5 py-1.5 text-xs font-semibold transition-all ${
                    active
                      ? "bg-white/15 text-white shadow-sm border border-white/20"
                      : "text-neutral-400 hover:text-white hover:bg-white/5"
                  }`}
                >
                  {l.label}
                </Link>
              );
            })}
          </nav>
        </div>
        <WalletConnect />
      </div>
    </header>
  );
}
