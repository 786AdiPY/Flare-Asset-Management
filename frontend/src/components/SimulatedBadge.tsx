export function SimulatedBadge({ simulated, reason }: { simulated: boolean; reason?: string | null }) {
  return (
    <span
      title={simulated ? reason ?? "Simulated data" : "Live data"}
      className={`inline-flex items-center gap-1 whitespace-nowrap rounded-full px-2 py-0.5 text-xs font-medium ${
        simulated ? "bg-warn/15 text-warn" : "bg-accent/15 text-accent"
      }`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${simulated ? "bg-warn" : "bg-accent"}`} />
      {simulated ? "Simulated" : "Live"}
    </span>
  );
}
