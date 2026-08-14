import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";
import { AppHeader } from "@/components/AppHeader";
import { WalletProvider } from "@/lib/walletContext";

export const metadata: Metadata = {
  title: "AssetRouter",
  description: "Intent Router for Tokenized Assets on Flare",
  icons: {
    icon: "/favicon.png",
    shortcut: "/favicon.png",
    apple: "/favicon.png",
  },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-obsidian text-ivory antialiased">
        <WalletProvider>
          <AppHeader />
          {children}
        </WalletProvider>
      </body>
    </html>
  );
}
