"use client";

import { useCallback, useState } from "react";
import { AlertsPanel } from "@/components/AlertsPanel";
import { HoldingsPanel } from "@/components/HoldingsPanel";

export default function HoldingsPage() {
  const [alertsRefreshToken, setAlertsRefreshToken] = useState(0);
  const handleHoldingsSaved = useCallback(() => setAlertsRefreshToken((t) => t + 1), []);

  return (
    <main className="mx-auto flex max-w-4xl flex-col gap-8 px-4 py-10">
      <div>
        <h1 className="text-2xl font-bold">Holdings & Alerts</h1>
        <p className="text-sm text-neutral-400">
          Save what you actually hold so Smart Opportunity Alerts compares against reality, not a demo
          portfolio.
        </p>
      </div>

      <HoldingsPanel onSaved={handleHoldingsSaved} />

      <AlertsPanel refreshToken={alertsRefreshToken} />
    </main>
  );
}
