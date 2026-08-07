"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

const STORAGE_KEY = "ai-asset-router:wallet";

interface WalletContextValue {
  walletAddress: string | null;
  setWalletAddress: (addr: string | null) => void;
}

const WalletContext = createContext<WalletContextValue | null>(null);

export function WalletProvider({ children }: { children: ReactNode }) {
  const [walletAddress, setWalletAddressState] = useState<string | null>(null);

  useEffect(() => {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored) setWalletAddressState(stored);
  }, []);

  function setWalletAddress(addr: string | null) {
    setWalletAddressState(addr);
    if (addr) window.localStorage.setItem(STORAGE_KEY, addr);
    else window.localStorage.removeItem(STORAGE_KEY);
  }

  return (
    <WalletContext.Provider value={{ walletAddress, setWalletAddress }}>{children}</WalletContext.Provider>
  );
}

export function useWalletContext(): WalletContextValue {
  const ctx = useContext(WalletContext);
  if (!ctx) throw new Error("useWalletContext must be used within WalletProvider");
  return ctx;
}
