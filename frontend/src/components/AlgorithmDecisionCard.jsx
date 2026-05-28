export default function AlgorithmDecisionCard({ security, algorithm }) {
  return (
    <div className="glass mt-4 rounded-3xl border border-blue-400/25 p-5 shadow-[0_0_20px_rgba(59,130,246,0.15)]">
      <h3 className="mb-3 text-lg font-semibold text-blue-300">AI Algorithm Decision</h3>
      <div className="space-y-2 text-sm">
        <p>
          Selected Algorithm:{" "}
          <span className="rounded-full bg-blue-500/20 px-2 py-1 font-semibold text-cyan-300">
            {algorithm.currentAlgorithm}
          </span>
        </p>
        <p>Reason: <span className="text-slate-200">{security.algorithmReason}</span></p>
        <p>Network Condition: <span className="text-slate-200">{security.performanceLevel || "MODERATE"}</span></p>
        <p>Threat Level: <span className="text-slate-200">{security.riskLevel}</span></p>
      </div>
    </div>
  );
}
