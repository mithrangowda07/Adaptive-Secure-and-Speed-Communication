import { useMemo } from "react";

export default function AnalyticsKpis({ rows }) {
  const stats = useMemo(() => {
    const totalCount = rows.length;
    if (totalCount === 0) {
      return {
        qualityScore: 0,
        qualityStatus: "N/A",
        encryption: "N/A",
        messagesCount: 0,
        filesCount: 0,
        avgTransferTime: 0,
        stability: "N/A",
        stabilityColorClass: "text-slate-400 border-slate-700 bg-slate-900/20",
      };
    }

    const latest = rows[0];
    const qualityScore = latest.network_quality_score ?? latest.qos_score ?? 0;
    const qualityStatus = latest.network_mode || latest.qos_status || "N/A";
    const encryption = latest.encryption_algorithm || "N/A";

    const msgRows = rows.filter(r => !r.file_name && !(r.file_size > 0));
    const fileRows = rows.filter(r => r.file_name || r.file_size > 0);
    const messagesCount = msgRows.length;
    const filesCount = fileRows.length;

    const avgTransferTime = rows.reduce((sum, r) => sum + (r.transfer_time_ms || 0), 0) / totalCount;

    // Stability based on message standard deviation
    let stability = "N/A";
    let stabilityColorClass = "text-slate-400 border-slate-700 bg-slate-950/20";

    if (msgRows.length > 0) {
      const transferTimes = msgRows.map((r) => Number(r.transfer_time_ms || 0));
      const sum = transferTimes.reduce((acc, v) => acc + v, 0);
      const mean = sum / msgRows.length;
      const variance = transferTimes.reduce((acc, v) => acc + Math.pow(v - mean, 2), 0) / msgRows.length;
      const stdDev = Math.sqrt(variance);

      if (stdDev <= 5) {
        stability = "Excellent";
        stabilityColorClass = "text-emerald-500 dark:text-emerald-400 bg-emerald-500/10 border-emerald-500/25";
      } else if (stdDev <= 15) {
        stability = "Good";
        stabilityColorClass = "text-cyan-550 dark:text-cyan-400 bg-cyan-500/10 border-cyan-500/25";
      } else if (stdDev <= 30) {
        stability = "Moderate";
        stabilityColorClass = "text-amber-600 dark:text-amber-400 bg-amber-500/10 border-amber-500/25";
      } else {
        stability = "Poor";
        stabilityColorClass = "text-rose-600 dark:text-rose-400 bg-rose-500/10 border-rose-500/25";
      }
    }

    return {
      qualityScore,
      qualityStatus,
      encryption,
      messagesCount,
      filesCount,
      avgTransferTime,
      stability,
      stabilityColorClass
    };
  }, [rows]);

  const getQualityColor = (status) => {
    const lower = (status || "").toLowerCase();
    if (lower === "excellent" || lower === "good") {
      return "text-emerald-500 dark:text-emerald-400 bg-emerald-500/10 border-emerald-500/25";
    }
    if (lower === "moderate" || lower === "weak") {
      return "text-amber-600 dark:text-amber-400 bg-amber-500/10 border-amber-500/25";
    }
    return "text-rose-600 dark:text-rose-400 bg-rose-500/10 border-rose-500/25";
  };

  return (
    <section className="grid grid-cols-2 lg:grid-cols-6 gap-4 mb-5 animate-[fadeIn_0.4s_ease-out]">
      {/* Quality Score KPI */}
      <div className="glass primary-card min-h-[110px] border-l-[5px] border-l-blue-500 rounded-2xl p-4 flex flex-col justify-between hover:border-blue-500/35 transition duration-200 shadow-sm">
        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Quality Score</span>
        <div className="flex items-baseline gap-1 mt-2">
          <span className="text-2xl font-black text-slate-100">{stats.qualityScore.toFixed(1)}</span>
          <span className={`text-[10px] font-extrabold uppercase px-1.5 py-0.5 rounded border ${getQualityColor(stats.qualityStatus)}`}>
            {stats.qualityStatus}
          </span>
        </div>
      </div>

      {/* Encryption KPI */}
      <div className="glass primary-card min-h-[110px] border-l-[5px] border-l-purple-500 rounded-2xl p-4 flex flex-col justify-between hover:border-blue-500/35 transition duration-200 shadow-sm">
        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Encryption</span>
        <div className="mt-2.5">
          <span className="text-xs font-black text-blue-600 dark:text-blue-300 bg-blue-500/10 border border-blue-500/20 px-2.5 py-1.5 rounded-lg truncate block text-center max-w-full">
            {stats.encryption}
          </span>
        </div>
      </div>

      {/* Messages Count KPI */}
      <div className="glass min-h-[110px] border-l-[5px] border-l-green-500 rounded-2xl p-4 flex flex-col justify-between hover:border-blue-500/20 transition duration-200 shadow-sm">
        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Messages</span>
        <div className="flex items-baseline mt-2">
          <span className="text-2xl font-black text-slate-100">{stats.messagesCount}</span>
        </div>
      </div>

      {/* Files Count KPI */}
      <div className="glass min-h-[110px] border-l-[5px] border-l-orange-500 rounded-2xl p-4 flex flex-col justify-between hover:border-blue-500/20 transition duration-200 shadow-sm">
        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Files</span>
        <div className="flex items-baseline mt-2">
          <span className="text-2xl font-black text-slate-100">{stats.filesCount}</span>
        </div>
      </div>

      {/* Avg Transfer Time KPI */}
      <div className="glass min-h-[110px] border-l-[5px] border-l-cyan-500 rounded-2xl p-4 flex flex-col justify-between hover:border-blue-500/20 transition duration-200 shadow-sm">
        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Avg Transfer</span>
        <div className="flex items-baseline gap-1 mt-2">
          <span className="text-2xl font-black text-slate-100">{Math.round(stats.avgTransferTime)}</span>
          <span className="text-xs font-semibold text-slate-400">ms</span>
        </div>
      </div>

      {/* Stability KPI */}
      <div className="glass primary-card min-h-[110px] border-l-[5px] border-l-rose-500 rounded-2xl p-4 flex flex-col justify-between hover:border-blue-500/35 transition duration-200 shadow-sm">
        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Stability</span>
        <div className="mt-2.5">
          <span className={`text-xs font-black uppercase px-2.5 py-1.5 rounded-lg border block text-center ${stats.stabilityColorClass}`}>
            {stats.stability}
          </span>
        </div>
      </div>
    </section>
  );
}
