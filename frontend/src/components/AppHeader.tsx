"use client";

import { usePathname } from "next/navigation";
import { NavBar } from "./NavBar";

export function AppHeader() {
  const pathname = usePathname();

  // On the root route '/', page.tsx handles its own navbar (LandingNavbar vs NavBar)
  if (pathname === "/") return null;

  return <NavBar />;
}
