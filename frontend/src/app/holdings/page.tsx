"use client";

import { useCallback, useState } from "react";
import { AlertsPanel } from "@/components/AlertsPanel";
import { HoldingsPanel } from "@/components/HoldingsPanel";

export default function HoldingsPage() {
  const [alertsRefreshToken, setAlertsRefreshToken] = useState(0);
  const handleHoldingsSaved = useCallback(() => setAlertsRefreshToken((t) => t + 1), []);

  return (
    <main className="mx-auto flex max-w-4xl flex-col gap-8 px-4 py-12">
      <div className="flex flex-col gap-1">
        <h1 className="text-3xl font-black text-white font-display">
          Holdings &amp; <span className="lifi-text-gradient">Opportunity Alerts</span>
        </h1>
        <p className="text-sm text-neutral-400 font-medium">
          Save your active holdings to let AI Smart Alerts continuously compare yields against live market data.
        </p>
      </div>

      <HoldingsPanel onSaved={handleHoldingsSaved} />

      <AlertsPanel refreshToken={alertsRefreshToken} />
    </main>
  );
}
