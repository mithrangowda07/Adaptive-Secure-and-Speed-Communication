import { useState } from "react";
import { createPortal } from "react-dom";

export default function NetworkPanel({ state, algorithm, security }) {
  const [openInfo, setOpenInfo] = useState(false);
  const [sections, setSections] = useState({
    performance: true,
    security: true,
    health: true,
  });

  const toggleSection = (name) => {
    setSections((prev) => ({ ...prev, [name]: !prev[name] }));
  };

  const qualityScore = state.network_quality_score ?? state.qos_score ?? 0;
  const qualityStatus = state.qos_status || "N/A";

  const getMetricColor = (val, low, high) => {
    if (val <= low) return "text-emerald-500 dark:text-emerald-400";
    if (val <= high) return "text-amber-500 dark:text-amber-400";
    return "text-rose-500 dark:text-rose-400";
  };

  return (
    <div className="glass rounded-3xl p-5 shadow-xl border border-slate-700/30">
      {/* Header */}
      <div className="mb-4 flex items-center justify-between border-b border-slate-700/30 pb-3">
        <h3 className="text-sm font-bold text-blue-300 uppercase tracking-widest">Network & Security Panel</h3>
        <button
          onClick={() => setOpenInfo(true)}
          className="rounded-full bg-slate-800 border border-slate-700 w-5 h-5 flex items-center justify-center text-[10px] text-slate-400 hover:border-cyan-400 hover:text-white transition duration-200"
          title="Show QoS Calculation Info"
        >
          i
        </button>
      </div>

      <div className="space-y-3">
        {/* SECTION 1: Performance */}
        <div className="border-b border-slate-700/20 pb-2">
          <button
            onClick={() => toggleSection("performance")}
            className="w-full flex items-center justify-between text-xs font-bold text-slate-300 hover:text-white transition duration-150 py-1"
          >
            <span>⚡ PERFORMANCE METRICS</span>
            <span className="text-[10px] text-slate-400">{sections.performance ? "▲" : "▼"}</span>
          </button>
          
          {sections.performance && (
            <div className="grid grid-cols-2 gap-x-4 gap-y-2 mt-2 text-xs animate-[fadeIn_0.2s_ease-out]">
              <div className="flex flex-col">
                <span className="text-[10px] text-slate-400 uppercase font-semibold">Latency</span>
                <span className={`font-mono text-sm font-bold ${getMetricColor(state.latency, 50, 150)}`}>
                  {state.latency} ms
                </span>
              </div>
              <div className="flex flex-col">
                <span className="text-[10px] text-slate-400 uppercase font-semibold">Bandwidth</span>
                <span className="font-mono text-sm font-bold text-slate-100">
                  {state.bandwidth} Mbps
                </span>
              </div>
              <div className="flex flex-col">
                <span className="text-[10px] text-slate-400 uppercase font-semibold">Jitter</span>
                <span className="font-mono text-sm font-bold text-slate-200">
                  {state.jitter} ms
                </span>
              </div>
              <div className="flex flex-col">
                <span className="text-[10px] text-slate-400 uppercase font-semibold">Throughput</span>
                <span className="font-mono text-sm font-bold text-slate-200">
                  {state.throughput} Mbps
                </span>
              </div>
              <div className="flex flex-col col-span-2">
                <span className="text-[10px] text-slate-400 uppercase font-semibold">Response Time</span>
                <span className="font-mono text-xs font-bold text-slate-200">
                  {state.response_time} ms
                </span>
              </div>
            </div>
          )}
        </div>

        {/* SECTION 2: Security */}
        <div className="border-b border-slate-700/20 pb-2">
          <button
            onClick={() => toggleSection("security")}
            className="w-full flex items-center justify-between text-xs font-bold text-slate-300 hover:text-white transition duration-150 py-1"
          >
            <span>🔐 SECURITY TELEMETRY</span>
            <span className="text-[10px] text-slate-400">{sections.security ? "▲" : "▼"}</span>
          </button>

          {sections.security && (
            <div className="grid grid-cols-2 gap-x-4 gap-y-2 mt-2 text-xs animate-[fadeIn_0.2s_ease-out]">
              <div className="flex flex-col">
                <span className="text-[10px] text-slate-400 uppercase font-semibold">Cipher</span>
                <span className="font-mono text-xs font-bold text-blue-600 dark:text-blue-300">
                  {algorithm.currentAlgorithm}
                </span>
              </div>
              <div className="flex flex-col">
                <span className="text-[10px] text-slate-400 uppercase font-semibold">Key ID</span>
                <span className="font-mono text-sm font-bold text-slate-100">
                  {security?.keyId || 1}
                </span>
              </div>
              <div className="flex flex-col">
                <span className="text-[10px] text-slate-400 uppercase font-semibold">Security Score</span>
                <span className="font-mono text-sm font-bold text-emerald-500">
                  {security?.securityScore || 85}/100
                </span>
              </div>
              <div className="flex flex-col">
                <span className="text-[10px] text-slate-400 uppercase font-semibold">Integrity</span>
                <span className={`font-mono text-xs font-bold ${
                  security?.integrityStatus === "FAILED" ? "text-rose-500" : "text-emerald-500"
                }`}>
                  {security?.integrityStatus || "VERIFIED"}
                </span>
              </div>
              <div className="flex flex-col col-span-2">
                <span className="text-[10px] text-slate-400 uppercase font-semibold">Risk Classification</span>
                <span className="font-mono text-[10px] font-extrabold text-blue-500 dark:text-blue-400 uppercase">
                  {security?.riskLevel || "LOW RISK"}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* SECTION 3: Network Health */}
        <div>
          <button
            onClick={() => toggleSection("health")}
            className="w-full flex items-center justify-between text-xs font-bold text-slate-300 hover:text-white transition duration-150 py-1"
          >
            <span>❤️ NETWORK HEALTH</span>
            <span className="text-[10px] text-slate-400">{sections.health ? "▲" : "▼"}</span>
          </button>

          {sections.health && (
            <div className="grid grid-cols-2 gap-x-4 gap-y-2 mt-2 text-xs animate-[fadeIn_0.2s_ease-out]">
              <div className="flex flex-col">
                <span className="text-[10px] text-slate-400 uppercase font-semibold">Packet Loss</span>
                <span className={`font-mono text-sm font-bold ${getMetricColor(state.packet_loss, 1, 3)}`}>
                  {state.packet_loss}%
                </span>
              </div>
              <div className="flex flex-col">
                <span className="text-[10px] text-slate-400 uppercase font-semibold">Error Rate</span>
                <span className={`font-mono text-sm font-bold ${getMetricColor(state.error_rate, 1.5, 4)}`}>
                  {state.error_rate}%
                </span>
              </div>
              <div className="flex flex-col">
                <span className="text-[10px] text-slate-400 uppercase font-semibold">Stability</span>
                <span className="font-mono text-sm font-bold text-slate-100">
                  {state.connection_stability}%
                </span>
              </div>
              <div className="flex flex-col">
                <span className="text-[10px] text-slate-400 uppercase font-semibold">QoS Score</span>
                <span className="font-mono text-sm font-bold text-cyan-550 dark:text-cyan-400">
                  {qualityScore}
                </span>
              </div>
              <div className="flex flex-col col-span-2">
                <span className="text-[10px] text-slate-400 uppercase font-semibold">QoS Status</span>
                <span className="font-mono text-xs font-bold text-cyan-550 dark:text-cyan-400 uppercase">
                  {qualityStatus}
                </span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* QoS Portal popup */}
      {openInfo &&
        createPortal(
          <div className="fixed inset-0 z-[100] grid place-items-center bg-slate-950/85 p-4 backdrop-blur-sm">
            <div className="glass w-full max-w-2xl rounded-3xl border border-blue-500/35 p-6 animate-[fadeIn_0.25s_ease-out]">
              <h4 className="mb-3 text-lg font-semibold text-blue-300">QoS Calculation Details</h4>
              <p className="mb-3 text-sm text-slate-300 leading-relaxed">
                The Quality of Service (QoS) score is dynamically calculated using a weighted combination of key network parameters.
              </p>
              <div className="rounded-xl bg-slate-900/60 border border-slate-800 p-4 font-mono text-[10px] md:text-xs text-slate-200 leading-normal overflow-x-auto">
                qos_score = latencyScore * 0.18 + bandwidthScore * 0.17 + lossScore * 0.15 +
                jitterScore * 0.10 + throughputScore * 0.12 + stabilityScore * 0.13 +
                responseScore * 0.10 + errorScore * 0.05
              </div>
              <p className="mt-3 text-sm text-slate-400 leading-relaxed">
                Status mapping: QoS &gt;= 90 = Excellent, 75-89 = Good, 60-74 = Moderate, 40-59 = Weak, below 40 = Poor.
              </p>
              <div className="mt-6 flex justify-end">
                <button
                  onClick={() => setOpenInfo(false)}
                  className="rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-500 transition duration-200 shadow-md"
                >
                  Close Info
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}
    </div>
  );
}
