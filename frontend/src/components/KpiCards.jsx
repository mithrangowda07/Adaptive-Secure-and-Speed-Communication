export default function KpiCards({ network, algorithm }) {
  const qualityStatus = network.qos_status || "N/A";
  const qualityScore = network.network_quality_score ?? network.qos_score ?? 0;
  const currentAlgorithm = algorithm.currentAlgorithm || "AES";
  const latency = network.latency ?? 0;

  // Determine dynamic colors for QoS status
  const getQualityColorClass = (status) => {
    const lower = status.toLowerCase();
    if (lower === "excellent" || lower === "good") {
      return "text-emerald-500 dark:text-emerald-400 bg-emerald-500/10 border-emerald-500/25";
    }
    if (lower === "moderate" || lower === "weak") {
      return "text-amber-600 dark:text-amber-400 bg-amber-500/10 border-amber-500/25";
    }
    return "text-rose-600 dark:text-rose-400 bg-rose-500/10 border-rose-500/25";
  };

  return (
    <section className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4 animate-[fadeIn_0.4s_ease-out]">
      {/* Quality KPI */}
      <div className="glass h-[90px] rounded-2xl p-[18px] flex flex-col justify-between border border-slate-700/30 hover:border-blue-500/30 transition-all duration-300 shadow-md">
        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
          <span className="text-orange-500">📊</span> Network Quality
        </span>
        <div className="flex items-center justify-between mt-2">
          <span className={`text-xl font-extrabold uppercase px-2.5 py-0.5 rounded-lg border ${getQualityColorClass(qualityStatus)}`}>
            {qualityStatus}
          </span>
          <span className="relative flex h-2.5 w-2.5">
            <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
              qualityStatus.toLowerCase() === "excellent" || qualityStatus.toLowerCase() === "good" ? "bg-emerald-400" :
              qualityStatus.toLowerCase() === "moderate" || qualityStatus.toLowerCase() === "weak" ? "bg-amber-400" : "bg-rose-400"
            }`}></span>
            <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${
              qualityStatus.toLowerCase() === "excellent" || qualityStatus.toLowerCase() === "good" ? "bg-emerald-500" :
              qualityStatus.toLowerCase() === "moderate" || qualityStatus.toLowerCase() === "weak" ? "bg-amber-500" : "bg-rose-500"
            }`}></span>
          </span>
        </div>
      </div>

      {/* Latency KPI */}
      <div className="glass h-[90px] rounded-2xl p-[18px] flex flex-col justify-between border border-slate-700/30 hover:border-blue-500/30 transition-all duration-300 shadow-md">
        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
          <span className="text-blue-500">⚡</span> Latency
        </span>
        <div className="flex items-baseline gap-1 mt-2">
          <span className="text-2xl font-black text-slate-100">{latency}</span>
          <span className="text-xs font-semibold text-slate-400">ms</span>
        </div>
      </div>

      {/* QoS score KPI */}
      <div className="glass h-[90px] rounded-2xl p-[18px] flex flex-col justify-between border border-slate-700/30 hover:border-blue-500/30 transition-all duration-300 shadow-md">
        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
          <span className="text-emerald-500">📈</span> QoS Score
        </span>
        <div className="flex items-baseline gap-1 mt-2">
          <span className="text-2xl font-black text-cyan-550 dark:text-cyan-400">{qualityScore.toFixed(1)}</span>
          <span className="text-xs font-semibold text-slate-400">/100</span>
        </div>
      </div>

      {/* Algorithm KPI */}
      <div className="glass h-[90px] rounded-2xl p-[18px] flex flex-col justify-between border border-slate-700/30 hover:border-blue-500/30 transition-all duration-300 shadow-md">
        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
          <span className="text-purple-500">🔐</span> Active Cipher
        </span>
        <div className="mt-2">
          <span className="text-sm font-extrabold text-blue-600 dark:text-blue-300 bg-blue-500/10 border border-blue-500/20 px-2 py-1 rounded-lg">
            {currentAlgorithm}
          </span>
        </div>
      </div>
    </section>
  );
}
