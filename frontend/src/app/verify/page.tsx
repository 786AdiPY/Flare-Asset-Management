"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { getVerifyJob, postVerify } from "@/lib/api";
import type { VerifyJob } from "@/lib/types";
import { SimulatedBadge } from "@/components/SimulatedBadge";

const PHASES: { key: VerifyJob["status"]; label: string; blurb: string }[] = [
  { key: "collecting", label: "Collecting", blurb: "Attestation request broadcast; verifiers gathering evidence (~90s)." },
  { key: "voting", label: "Voting", blurb: "Verifiers sign off and the Merkle root is aggregated." },
  { key: "finalized", label: "Finalized", blurb: "Proof available from the Data Availability Layer." },
];

function phaseIndex(status: VerifyJob["status"]) {
  return PHASES.findIndex((p) => p.key === status);
}

export default function VerifyPage() {
  const [sourceChain, setSourceChain] = useState("ethereum");
  const [txHash, setTxHash] = useState("0xabc123");
  const [job, setJob] = useState<VerifyJob | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, []);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    if (pollRef.current) clearInterval(pollRef.current);
    try {
      const created = await postVerify(sourceChain, txHash);
      setJob(created);
      pollRef.current = setInterval(async () => {
        try {
          const updated = await getVerifyJob(created.id);
          setJob(updated);
          if (updated.status === "finalized" && pollRef.current) {
            clearInterval(pollRef.current);
          }
        } catch {
          if (pollRef.current) clearInterval(pollRef.current);
        }
      }, 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to submit attestation request");
    } finally {
      setSubmitting(false);
    }
  }

  const currentPhase = job ? phaseIndex(job.status) : -1;

  return (
    <main className="mx-auto flex max-w-4xl flex-col gap-6 px-4 py-10">
      <div>
        <h1 className="text-2xl font-bold">Flare Data Connector — Verify</h1>
        <p className="text-sm text-neutral-400">
          Submit a cross-chain attestation request and watch it move through FDC&apos;s real phases.
          This is a <strong className="text-warn">phase-accurate simulation</strong>: timing matches
          the live protocol (a ~90s collection window, then voting/finalization), but no external
          verifier or Data Availability Layer is actually contacted — see{" "}
          <code>backend/app/services/flare_fdc.py</code> for what a real integration needs.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-wrap items-end gap-3 rounded-xl border border-border bg-panel p-5">
        <div className="flex flex-col gap-1">
          <label className="text-xs text-neutral-500">Source chain</label>
          <input
            value={sourceChain}
            onChange={(e) => setSourceChain(e.target.value)}
            className="w-40 rounded-lg border border-border bg-ink px-2 py-1.5 text-sm outline-none focus:border-accent2"
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs text-neutral-500">Transaction hash</label>
          <input
            value={txHash}
            onChange={(e) => setTxHash(e.target.value)}
            className="w-64 rounded-lg border border-border bg-ink px-2 py-1.5 text-sm outline-none focus:border-accent2"
          />
        </div>
        <button
          type="submit"
          disabled={submitting}
          className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-ink disabled:opacity-50"
        >
          {submitting ? "Submitting…" : "Submit attestation request"}
        </button>
        {error && <p className="text-sm text-danger">{error}</p>}
      </form>

      {job && (
        <div className="flex flex-col gap-4 rounded-xl border border-border bg-panel p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs uppercase tracking-wide text-neutral-500">Job {job.id.slice(0, 8)}</span>
            <SimulatedBadge simulated={job.simulated} reason={job.simulationReason} />
          </div>

          <div className="flex items-center gap-2">
            {PHASES.map((phase, i) => (
              <div key={phase.key} className="flex flex-1 items-center gap-2">
                <div className="flex flex-col items-center gap-1 text-center">
                  <div
                    className={`flex h-8 w-8 items-center justify-center rounded-full border-2 text-xs font-semibold ${
                      i < currentPhase || job.status === "finalized" && i <= currentPhase
                        ? "border-accent bg-accent/20 text-accent"
                        : i === currentPhase
                          ? "animate-pulse border-accent2 bg-accent2/20 text-accent2"
                          : "border-border text-neutral-600"
                    }`}
                  >
                    {i + 1}
                  </div>
                  <span className="text-xs text-neutral-400">{phase.label}</span>
                </div>
                {i < PHASES.length - 1 && (
                  <div className={`h-0.5 flex-1 ${i < currentPhase ? "bg-accent" : "bg-border"}`} />
                )}
              </div>
            ))}
          </div>

          <p className="text-sm text-neutral-400">{PHASES[Math.max(currentPhase, 0)].blurb}</p>

          {job.status === "finalized" && (
            <div className="rounded-lg border border-accent/40 bg-accent/10 p-3 text-sm">
              <p>
                Voting round: <span className="font-mono">{job.votingRoundId}</span>
              </p>
              <p className="mt-1 break-all">
                Merkle proof: <span className="font-mono text-xs">{job.merkleProof}</span>
              </p>
            </div>
          )}
        </div>
      )}
    </main>
  );
}
