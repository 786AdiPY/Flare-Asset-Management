"use client";

import { useState } from "react";

interface LandingNavbarProps {
  onLaunchApp: () => void;
}

export function LandingNavbar({ onLaunchApp }: LandingNavbarProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const scrollToSection = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: "smooth" });
    }
    setMobileMenuOpen(false);
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-white/5 bg-obsidian/85 backdrop-blur-md">
      <div className="relative w-full flex items-center justify-between px-6 sm:px-10 py-4">
        {/* LEFT: Logo aligned tightly to far left corner */}
        <div className="flex items-center gap-2.5 z-10">
          <span className="font-display text-base font-bold tracking-tight text-ivory">
            Asset<span className="text-sage">Router</span>
          </span>
        </div>

        {/* CENTER: Exactly four navigation items centered in navbar */}
        <div className="hidden md:flex absolute left-1/2 -translate-x-1/2 items-center gap-8 text-xs font-mono-tech text-neutral-400 font-medium">
          <button
            type="button"
            onClick={() => scrollToSection("product")}
            className="hover:text-ivory transition-colors"
          >
            Product
          </button>
          <button
            type="button"
            onClick={() => scrollToSection("how-it-works")}
            className="hover:text-ivory transition-colors"
          >
            How It Works
          </button>
          <button
            type="button"
            onClick={() => scrollToSection("technology")}
            className="hover:text-ivory transition-colors"
          >
            Technology
          </button>
          <button
            type="button"
            onClick={() => scrollToSection("ecosystem")}
            className="hover:text-ivory transition-colors"
          >
            Ecosystem
          </button>
        </div>

        {/* RIGHT: Log in and Sign up on top-right */}
        <div className="hidden md:flex items-center gap-3 z-10">
          <button
            type="button"
            onClick={onLaunchApp}
            className="rounded-lg border border-white/15 px-4 py-2 text-xs font-mono-tech font-semibold text-neutral-300 hover:border-white/30 hover:text-ivory transition-all"
          >
            Log in
          </button>
          <button
            type="button"
            onClick={onLaunchApp}
            className="rounded-lg bg-ivory px-4 py-2 text-xs font-mono-tech font-bold text-obsidian hover:bg-neutral-200 transition-colors shadow-sm"
          >
            Sign up →
          </button>
        </div>

        {/* Mobile Menu Hamburger */}
        <button
          type="button"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="md:hidden text-neutral-400 hover:text-ivory z-10"
        >
          <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            {mobileMenuOpen ? (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
            )}
          </svg>
        </button>
      </div>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden border-b border-white/10 bg-panel px-6 py-4 flex flex-col gap-4 font-mono-tech text-xs">
          <button type="button" onClick={() => scrollToSection("product")} className="text-left text-neutral-300">
            Product
          </button>
          <button type="button" onClick={() => scrollToSection("how-it-works")} className="text-left text-neutral-300">
            How It Works
          </button>
          <button type="button" onClick={() => scrollToSection("technology")} className="text-left text-neutral-300">
            Technology
          </button>
          <button type="button" onClick={() => scrollToSection("ecosystem")} className="text-left text-neutral-300">
            Ecosystem
          </button>
          <div className="flex gap-2 pt-2 border-t border-white/10">
            <button
              type="button"
              onClick={onLaunchApp}
              className="flex-1 rounded-lg border border-white/15 py-2 text-center text-neutral-200"
            >
              Log in
            </button>
            <button
              type="button"
              onClick={onLaunchApp}
              className="flex-1 rounded-lg bg-ivory py-2 text-center font-bold text-obsidian"
            >
              Sign up →
            </button>
          </div>
        </div>
      )}
    </header>
  );
}
