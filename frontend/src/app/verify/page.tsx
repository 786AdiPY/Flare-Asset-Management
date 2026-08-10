"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { getVerifyJob, postVerify } from "@/lib/api";
import type { VerifyJob } from "@/lib/types";
import { SimulatedBadge } from "@/components/SimulatedBadge";

const PHASES: { key: VerifyJob["status"]; label: string; blurb: string }[] = [
  { key: "collecting", label: "Collecting", blurb: "Attestation request submitted to Coston2 FdcHub; verifiers gathering evidence (~90s)." },
  { key: "voting", label: "Voting", blurb: "Coston2 FDC verifiers sign off and aggregate Merkle root in active voting round." },
  { key: "finalized", label: "Finalized", blurb: "Verified Merkle proof published and available on Coston2 Data Availability Layer." },
];

function phaseIndex(status: VerifyJob["status"]) {
  return PHASES.findIndex((p) => p.key === status);
}

export default function VerifyPage() {
  const [sourceChain, setSourceChain] = useState("ethereum");
  const [txHash, setTxHash] = useState("0xabc1234567890123456789012345678901234567890123456789012345678901");
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
    <main className="mx-auto flex max-w-4xl flex-col gap-8 px-4 py-12">
      <div className="flex flex-col gap-1">
        <h1 className="text-3xl font-black text-white font-display">
          Flare Data Connector — <span className="lifi-text-gradient">Real Coston2 Attestation</span>
        </h1>
        <p className="text-sm text-neutral-400 font-medium">
          Live Coston2 FDC contract resolution, fee calculation, voting round tracking, and DA Layer Merkle proofs.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-wrap items-end gap-4 rounded-2xl border border-white/10 bg-[#121217]/80 backdrop-blur-xl p-6 shadow-2xl">
        <div className="flex flex-col gap-1">
          <label className="text-[11px] font-bold text-neutral-400 uppercase">Source Chain</label>
          <input
            value={sourceChain}
            onChange={(e) => setSourceChain(e.target.value)}
            className="w-40 rounded-xl border border-white/10 bg-[#09090c] px-3 py-2 text-xs text-white outline-none focus:border-accent"
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-[11px] font-bold text-neutral-400 uppercase">Transaction Hash</label>
          <input
            value={txHash}
            onChange={(e) => setTxHash(e.target.value)}
            className="w-72 rounded-xl border border-white/10 bg-[#09090c] px-3 py-2 text-xs text-white outline-none focus:border-accent font-mono-tech"
          />
        </div>
        <button
          type="submit"
          disabled={submitting}
          className="lifi-btn-primary px-6 py-2.5 text-xs font-bold disabled:opacity-50"
        >
          {submitting ? "Submitting Request…" : "Submit Coston2 Attestation →"}
        </button>
        {error && <p className="text-xs text-danger">{error}</p>}
      </form>

      {job && (
        <div className="flex flex-col gap-5 rounded-2xl border border-white/10 bg-[#121217]/80 backdrop-blur-xl p-6 shadow-2xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 font-mono-tech text-xs text-neutral-300">
              <span>Job: {job.id.slice(0, 8)}</span>
              {job.proofStatus && (
                <span className="rounded-full bg-accent/20 border border-accent/40 px-2.5 py-0.5 text-[10px] font-bold text-accent2">
                  {job.proofStatus}
                </span>
              )}
            </div>
            <SimulatedBadge simulated={job.simulated} reason={job.simulationReason} />
          </div>

          {/* Contract Details */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 font-mono-tech text-xs">
            <div className="rounded-xl border border-white/10 bg-[#09090c] p-3">
              <span className="text-neutral-500 text-[10px] block">FdcHub Contract</span>
              <span className="text-white font-semibold truncate block" title={job.fdcHubAddress || "0x48aC463d7975828989331F4De43341627b9c5f1D"}>
                {job.fdcHubAddress || "0x48aC463d..."}
              </span>
            </div>
            <div className="rounded-xl border border-white/10 bg-[#09090c] p-3">
              <span className="text-neutral-500 text-[10px] block">FdcVerification Contract</span>
              <span className="text-white font-semibold truncate block" title={job.verificationContract || "0x906507E0B64bcD494Db73bd0459d1C667e14B933"}>
                {job.verificationContract || "0x906507E0..."}
              </span>
            </div>
            <div className="rounded-xl border border-white/10 bg-[#09090c] p-3">
              <span className="text-neutral-500 text-[10px] block">Required Fee (Coston2)</span>
              <span className="text-success font-semibold block">
                {job.requestFeeWei ? `${(Number(job.requestFeeWei) / 1e18).toFixed(4)} FLR` : "0.001 FLR"}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3 pt-2">
            {PHASES.map((phase, i) => (
              <div key={phase.key} className="flex flex-1 items-center gap-3">
                <div className="flex flex-col items-center gap-1.5 text-center">
                  <div
                    className={`flex h-9 w-9 items-center justify-center rounded-full border-2 text-xs font-bold font-mono-tech transition-all ${
                      i < currentPhase || (job.status === "finalized" && i <= currentPhase)
                        ? "border-success bg-success/20 text-success"
                        : i === currentPhase
                          ? "animate-pulse border-accent2 bg-accent/20 text-accent2 shadow-glow"
                          : "border-white/10 bg-white/5 text-neutral-500"
                    }`}
                  >
                    {i + 1}
                  </div>
                  <span className="text-xs font-semibold text-neutral-300">{phase.label}</span>
                </div>
                {i < PHASES.length - 1 && (
                  <div className={`h-0.5 flex-1 rounded-full transition-all ${i < currentPhase ? "bg-success" : "bg-white/10"}`} />
                )}
              </div>
            ))}
          </div>

          <p className="text-xs text-neutral-300 font-mono-tech">{PHASES[Math.max(currentPhase, 0)].blurb}</p>

          {job.status === "finalized" && (
            <div className="flex flex-col gap-2 rounded-xl border border-success/30 bg-success/10 p-4 text-xs font-mono-tech text-success">
              <div className="flex items-center justify-between">
                <p>
                  Voting Round ID: <strong className="text-white">{job.votingRoundId}</strong>
                </p>
                <span className="text-xs text-success font-bold">✓ VERIFIED ON COSTON2 DA LAYER</span>
              </div>
              <p className="break-all text-neutral-300">
                Merkle Proof: <span className="text-white font-bold">{job.merkleProof}</span>
              </p>
            </div>
          )}
        </div>
      )}
    </main>
  );
}
