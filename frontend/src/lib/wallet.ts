"use client";

import { useCallback, useEffect, useState } from "react";

// Minimal MetaMask (EIP-1193) support. Full WalletConnect requires a Reown/
// WalletConnect Cloud project ID we don't have configured — wire it up via
// @walletconnect/ethereum-provider or wagmi once one is available; until then
// "Use Demo Wallet" in WalletConnect.tsx keeps the rest of the app usable.
declare global {
  interface Window {
    ethereum?: {
      request: (args: { method: string; params?: unknown[] }) => Promise<unknown>;
      on?: (event: string, handler: (...args: unknown[]) => void) => void;
      removeListener?: (event: string, handler: (...args: unknown[]) => void) => void;
    };
  }
}

export function useWallet() {
  const [address, setAddress] = useState<string | null>(null);
  const [connecting, setConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const connect = useCallback(async () => {
    if (typeof window === "undefined" || !window.ethereum) {
      setError("No injected wallet found — install MetaMask, or use Demo Wallet.");
      return;
    }
    setConnecting(true);
    setError(null);
    try {
      const accounts = (await window.ethereum.request({ method: "eth_requestAccounts" })) as string[];
      setAddress(accounts[0] ?? null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to connect wallet");
    } finally {
      setConnecting(false);
    }
  }, []);

  const disconnect = useCallback(() => setAddress(null), []);

  const sendTransaction = useCallback(
    async (tx: { to: string; data?: string; value?: string; gasLimit?: string }) => {
      if (typeof window === "undefined" || !window.ethereum) {
        throw new Error("No ethereum provider found. Install MetaMask or connect Demo Wallet.");
      }
      try {
        const txHash = (await window.ethereum.request({
          method: "eth_sendTransaction",
          params: [
            {
              from: address,
              to: tx.to,
              data: tx.data || "0x",
              value: tx.value || "0x0",
              gas: tx.gasLimit || undefined,
            },
          ],
        })) as string;
        return txHash;
      } catch (err) {
        if (err && typeof err === "object" && "code" in err && (err as { code: number }).code === 4001) {
          throw new Error("Transaction rejected by user in wallet.");
        }
        throw err instanceof Error ? err : new Error("Transaction execution failed");
      }
    },
    [address]
  );

  useEffect(() => {
    if (typeof window === "undefined" || !window.ethereum?.on) return;
    const handleAccountsChanged = (...args: unknown[]) => {
      const accounts = args[0] as string[];
      setAddress(accounts[0] ?? null);
    };
    const handleChainChanged = () => {
      // Reload or trigger balance refresh on chain change
      window.location.reload();
    };
    window.ethereum.on("accountsChanged", handleAccountsChanged);
    window.ethereum.on("chainChanged", handleChainChanged);
    return () => {
      window.ethereum?.removeListener?.("accountsChanged", handleAccountsChanged);
      window.ethereum?.removeListener?.("chainChanged", handleChainChanged);
    };
  }, []);

  return { address, connecting, error, connect, disconnect, sendTransaction };
}
