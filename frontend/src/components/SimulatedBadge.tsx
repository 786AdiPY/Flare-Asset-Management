export function SimulatedBadge({ simulated, reason }: { simulated: boolean; reason?: string | null }) {
  return (
    <span
      title={simulated ? reason ?? "Simulated data" : "Live data"}
      className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-0.5 text-[11px] font-semibold font-mono-tech ${
        simulated
          ? "bg-warn/15 text-warn border border-warn/30"
          : "bg-success/15 text-success border border-success/30"
      }`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${simulated ? "bg-warn" : "bg-success animate-pulse"}`} />
      {simulated ? "Simulated" : "Live"}
    </span>
  );
}
