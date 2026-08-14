"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { WalletConnect } from "./WalletConnect";

interface NavBarProps {
  onRouterClick?: () => void;
  onLandingClick?: () => void;
}

const LINKS = [
  { href: "/?view=app", label: "Router", key: "router" },
  { href: "/holdings", label: "Holdings & Alerts", key: "holdings" },
  { href: "/yields", label: "Yields", key: "yields" },
  { href: "/feeds", label: "Feeds", key: "feeds" },
];

export function NavBar({ onRouterClick, onLandingClick }: NavBarProps) {
  const pathname = usePathname();

  const handleRouterClick = () => {
    if (onRouterClick) onRouterClick();
    if (typeof window !== "undefined") {
      window.history.pushState({}, "", "/?view=app");
    }
  };

  const handleLandingClick = () => {
    if (onLandingClick) onLandingClick();
    if (typeof window !== "undefined") {
      window.history.pushState({}, "", "/");
    }
  };

  return (
    <header className="sticky top-4 z-40 mx-auto max-w-7xl px-4 sm:px-6 mb-6">
      <div className="glass-nav flex items-center justify-between gap-4 px-6 py-3 shadow-2xl rounded-2xl border border-white/10 bg-[#0B0F12]/80 backdrop-blur-xl">
        <div className="flex items-center gap-8">
          {/* Logo -> Redirects to Landing Page */}
          <Link
            href="/"
            onClick={handleLandingClick}
            className="flex items-center gap-2.5 group"
          >
            <span className="text-base font-bold tracking-tight text-ivory group-hover:text-white transition-colors font-display">
              AI-Asset <span className="text-sage">Router</span>
            </span>
          </Link>

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center gap-1.5 font-mono-tech">
            {LINKS.map((l) => {
              const active = pathname === "/" ? l.key === "router" : pathname === l.href;
              return (
                <Link
                  key={l.key}
                  href={l.href}
                  onClick={l.key === "router" ? handleRouterClick : undefined}
                  className={`rounded-full px-4 py-2 text-xs sm:text-sm font-medium transition-all ${
                    active
                      ? "bg-white/10 text-ivory border border-white/20 shadow-sm"
                      : "text-neutral-300 hover:text-ivory hover:bg-white/5"
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
