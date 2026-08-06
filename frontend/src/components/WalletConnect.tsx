"use client";

import { useEffect } from "react";
import { useWallet } from "@/lib/wallet";

function truncate(addr: string) {
  return `${addr.slice(0, 6)}…${addr.slice(-4)}`;
}

export function WalletConnect({
  walletAddress,
  onAddressChange,
}: {
  walletAddress: string | null;
  onAddressChange: (addr: string | null) => void;
}) {
  const { address, connecting, error, connect, disconnect } = useWallet();

  useEffect(() => {
    if (address && address !== walletAddress) {
      onAddressChange(address);
    }
  }, [address, walletAddress, onAddressChange]);

  const effectiveAddress = address ?? walletAddress;

  function handleDisconnect() {
    disconnect();
    onAddressChange(null);
  }

  function useDemoWallet() {
    onAddressChange("0xDEM0000000000000000000000000000000FLARE");
  }

  return (
    <div className="flex items-center gap-2">
      {effectiveAddress ? (
        <>
          <span className="rounded-full border border-border px-3 py-1 font-mono text-xs">
            {truncate(effectiveAddress)}
          </span>
          <button onClick={handleDisconnect} className="text-xs text-neutral-500 hover:text-neutral-300">
            Disconnect
          </button>
        </>
      ) : (
        <>
          <button
            onClick={connect}
            disabled={connecting}
            className="rounded-lg bg-accent2 px-3 py-1.5 text-xs font-medium text-ink disabled:opacity-50"
          >
            {connecting ? "Connecting…" : "Connect MetaMask"}
          </button>
          <button
            onClick={useDemoWallet}
            className="rounded-lg border border-border px-3 py-1.5 text-xs text-neutral-400 hover:border-accent2"
          >
            Use Demo Wallet
          </button>
        </>
      )}
      {error && <span className="text-xs text-danger">{error}</span>}
    </div>
  );
}
