"use client";

import { useEffect } from "react";
import { useWallet } from "@/lib/wallet";
import { useWalletContext } from "@/lib/walletContext";

function truncate(addr: string) {
  return `${addr.slice(0, 6)}…${addr.slice(-4)}`;
}

export function WalletConnect() {
  const { address, connecting, error, connect, disconnect } = useWallet();
  const { walletAddress, setWalletAddress } = useWalletContext();

  useEffect(() => {
    if (address && address !== walletAddress) {
      setWalletAddress(address);
    }
  }, [address, walletAddress, setWalletAddress]);

  const effectiveAddress = address ?? walletAddress;

  function handleDisconnect() {
    disconnect();
    setWalletAddress(null);
  }

  function useDemoWallet() {
    setWalletAddress("0xDEM0000000000000000000000000000000FLARE");
  }

  return (
    <div className="flex items-center gap-2">
      {effectiveAddress ? (
        <div className="flex items-center gap-2">
          <span className="flex items-center gap-1.5 rounded-full border border-accent/40 bg-accent/15 px-3 py-1 font-mono-tech text-xs text-accent2 shadow-sm">
            <span className="h-2 w-2 rounded-full bg-success animate-pulse" />
            {truncate(effectiveAddress)}
          </span>
          <button
            onClick={handleDisconnect}
            className="rounded-full px-2.5 py-1 text-xs text-neutral-400 hover:text-white hover:bg-white/10 transition-all"
          >
            Disconnect
          </button>
        </div>
      ) : (
        <div className="flex items-center gap-2">
          <button
            onClick={connect}
            disabled={connecting}
            className="lifi-btn-primary px-4 py-1.5 text-xs font-semibold disabled:opacity-50"
          >
            {connecting ? "Connecting…" : "Connect MetaMask"}
          </button>
          <button
            onClick={useDemoWallet}
            className="lifi-btn-secondary px-3 py-1.5 text-xs font-medium"
          >
            Demo Wallet
          </button>
        </div>
      )}
      {error && <span className="text-xs text-danger">{error}</span>}
    </div>
  );
}
