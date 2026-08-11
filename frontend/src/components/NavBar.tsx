"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { WalletConnect } from "./WalletConnect";

interface NavBarProps {
  onRouterClick?: () => void;
}

const LINKS = [
  { href: "/", label: "Router", key: "router" },
  { href: "/holdings", label: "Holdings & Alerts", key: "holdings" },
  { href: "/yields", label: "Yields", key: "yields" },
  { href: "/feeds", label: "Feeds", key: "feeds" },
];

export function NavBar({ onRouterClick }: NavBarProps) {
  const pathname = usePathname();

  return (
    <header className="sticky top-4 z-40 mx-auto max-w-6xl px-4 mb-6">
      <div className="glass-nav flex items-center justify-between gap-4 px-6 py-3 shadow-2xl rounded-2xl border border-white/10 bg-[#0B0F12]/80 backdrop-blur-xl">
        <div className="flex items-center gap-8">
          {/* Logo */}
          <Link
            href="/"
            onClick={onRouterClick}
            className="flex items-center gap-2.5 group"
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-[#3f49e1] to-[#6c5ce7] shadow-lg group-hover:scale-105 transition-transform">
              <svg className="h-5 w-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <span className="text-base font-bold tracking-tight text-ivory group-hover:text-white transition-colors font-display">
              AI-Asset <span className="text-sage">Router</span>
            </span>
          </Link>

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center gap-1.5 font-mono-tech">
            {LINKS.map((l) => {
              const active = pathname === l.href;
              return (
                <Link
                  key={l.key}
                  href={l.href}
                  onClick={l.key === "router" ? onRouterClick : undefined}
                  className={`rounded-full px-4 py-1.5 text-xs font-medium transition-all ${
                    active
                      ? "bg-white/10 text-ivory border border-white/20 shadow-sm"
                      : "text-neutral-400 hover:text-ivory hover:bg-white/5"
                  }`}
                >
                  {l.label}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Wallet Connection Buttons */}
        <WalletConnect />
      </div>
    </header>
  );
}
