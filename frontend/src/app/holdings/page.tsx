"use client";

import { useCallback, useState } from "react";
import { AlertsPanel } from "@/components/AlertsPanel";
import { HoldingsPanel } from "@/components/HoldingsPanel";

export default function HoldingsPage() {
  const [alertsRefreshToken, setAlertsRefreshToken] = useState(0);
  const handleHoldingsSaved = useCallback(() => setAlertsRefreshToken((t) => t + 1), []);

  return (
    <main className="mx-auto flex max-w-5xl flex-col gap-8 px-4 sm:px-6 py-12">
      <div className="flex flex-col gap-1.5">
        <h1 className="text-3xl sm:text-4xl font-black text-white font-display">
          Holdings &amp; <span className="lifi-text-gradient">Opportunity Alerts</span>
        </h1>
        <p className="text-sm sm:text-base text-neutral-300 font-medium leading-relaxed">
          Save your active holdings to let AI Smart Alerts continuously compare yields against live market data.
        </p>
      </div>

      <HoldingsPanel onSaved={handleHoldingsSaved} />

      <AlertsPanel refreshToken={alertsRefreshToken} />
    </main>
  );
}
