import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";
import { NavBar } from "@/components/NavBar";
import { WalletProvider } from "@/lib/walletContext";

export const metadata: Metadata = {
  title: "AI-Asset Router",
  description: "AI Intent Router for Tokenized Assets on Flare",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-ink text-neutral-100 antialiased">
        <WalletProvider>
          <NavBar />
          {children}
        </WalletProvider>
      </body>
    </html>
  );
}
