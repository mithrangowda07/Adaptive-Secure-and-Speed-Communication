import { useMemo, useState } from "react";
import { createPortal } from "react-dom";

function riskColor(level) {
  if (level === "LOW RISK") return "text-emerald-400";
  if (level === "HIGH RISK") return "text-red-400";
  return "text-yellow-400";
}

export default function SecurityScoreCard({ security }) {
  const [showInfo, setShowInfo] = useState(false);
  const ring = useMemo(() => Math.max(0, Math.min(100, security.securityScore || 0)), [security.securityScore]);

  return (
    <div className="glass mt-4 rounded-3xl border border-cyan-400/30 p-5 shadow-[0_0_25px_rgba(34,211,238,0.15)]">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-lg font-semibold text-cyan-300">Security Score</h3>
        <button
          onClick={() => setShowInfo(true)}
          className="rounded-full border border-slate-500 px-2 text-xs text-slate-200 hover:border-cyan-400"
        >
          i
        </button>
      </div>
      <div className="mb-3 flex items-center gap-4">
        <div
          className="grid h-16 w-16 place-items-center rounded-full border-4 border-cyan-400/60 text-sm font-bold text-cyan-300"
          style={{ boxShadow: `inset 0 0 12px rgba(56,189,248,.35), 0 0 ${ring / 6}px rgba(56,189,248,.45)` }}
        >
          {ring}
        </div>
        <div>
          <p className="text-sm text-slate-300">Security Score: {ring}/100</p>
          <p className={`text-sm font-semibold ${riskColor(security.riskLevel)}`}>{security.riskLevel}</p>
          <p className="text-xs text-slate-300">Integrity: {security.integrityStatus}</p>
          <p className="text-xs text-slate-300">Current Key ID: KEY-{security.keyId}</p>
        </div>
      </div>
      {showInfo &&
        createPortal(
          <div className="fixed inset-0 z-[100] grid place-items-center bg-slate-950/85 p-4">
            <div className="glass w-full max-w-lg rounded-3xl border border-cyan-400/30 p-6 shadow-[0_0_40px_rgba(34,211,238,0.18)]">
              <h4 className="mb-3 text-lg font-semibold text-cyan-300">Security Score Formula</h4>
              <p className="mb-3 text-sm text-slate-300">
                Score is computed per packet and normalized to 0-100.
              </p>
              <ul className="space-y-2 text-sm text-slate-100">
                <li>Encryption Strength bonus (ECC, AES + RSA, AES)</li>
                <li>Key Size contribution</li>
                <li>Integrity bonus or tamper penalty</li>
                <li>Latency and packet loss penalty</li>
                <li>CPU usage penalty</li>
              </ul>
              <div className="mt-3 rounded-xl bg-slate-900/50 p-3 text-xs text-slate-100">
                security_score = 100 - (cpu_usage*0.25) - (attack_risk*18) -
                (integrity_penalty*12) - (anomaly_score*0.35) -
                (auth_fail_rate*2) - (threat_signal*0.3)
              </div>
              <p className="mt-3 text-sm text-slate-300">
                Risk status rule: 0-30 = High Risk, 31-60 = Medium Risk, 61-100 = Low Risk.
              </p>
              {security.securityParams && (
                <div className="mt-3 text-xs text-slate-200">
                  <p>cpu_usage: {security.securityParams.cpuUsage}</p>
                  <p>attack_risk: {security.securityParams.attackRisk}</p>
                  <p>integrity_penalty: {security.securityParams.integrityPenalty}</p>
                  <p>anomaly_score: {security.securityParams.anomalyScore}</p>
                  <p>auth_fail_rate: {security.securityParams.authFailRate}</p>
                  <p>threat_signal: {security.securityParams.threatSignal}</p>
                </div>
              )}
              <div className="mt-5 flex justify-end">
                <button
                  onClick={() => setShowInfo(false)}
                  className="rounded-xl bg-cyan-600 px-4 py-2 text-sm font-semibold hover:bg-cyan-500"
                >
                  Close
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}
    </div>
  );
}
