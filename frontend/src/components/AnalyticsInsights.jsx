import { useMemo } from "react";

export default function AnalyticsInsights({ rows }) {
  const insights = useMemo(() => {
    if (rows.length === 0) {
      return {
        mostUsed: "N/A",
        bestQos: 0,
        worstQos: 0,
        avgTime: 0,
        recommendation: "Waiting for database telemetry..."
      };
    }

    // 1. Most Used Algorithm
    const counts = rows.reduce((acc, r) => {
      const key = r.encryption_algorithm;
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {});
    let mostUsed = "N/A";
    let maxCount = 0;
    Object.keys(counts).forEach(key => {
      if (counts[key] > maxCount) {
        maxCount = counts[key];
        mostUsed = key;
      }
    });

    // 2. Best & Worst QoS
    const qosScores = rows.map(r => Number(r.network_quality_score ?? r.qos_score ?? 0));
    const bestQos = Math.max(...qosScores);
    const worstQos = Math.min(...qosScores);

    // 3. Average Transfer Time
    const avgTime = rows.reduce((sum, r) => sum + Number(r.transfer_time_ms || 0), 0) / rows.length;

    // 4. Calculate Std Dev for Recommendation
    const msgRows = rows.filter(r => !r.file_name && !(r.file_size > 0));
    let stdDev = 0;
    if (msgRows.length > 0) {
      const times = msgRows.map(r => Number(r.transfer_time_ms || 0));
      const mean = times.reduce((s, v) => s + v, 0) / times.length;
      const variance = times.reduce((s, v) => s + Math.pow(v - mean, 2), 0) / times.length;
      stdDev = Math.sqrt(variance);
    }

    let recommendation = "";
    if (stdDev > 30) {
      recommendation = "High jitter and unstable transfer times detected. PAACS stability locks have been engaged to prevent algorithm thrashing. Recommend checking connection route limits.";
    } else if (stdDev > 15) {
      recommendation = "Moderate transfer fluctuations present. The adaptive selection loop is running actively and swapping ciphers on performance margins.";
    } else if (msgRows.length > 0) {
      recommendation = "Optimal transfer stability achieved. Network latency is highly consistent; encryption is locked into secure modes matching peak performance.";
    } else {
      recommendation = "No sufficient message data. Waiting for telemetry to compile recommendations.";
    }

    return {
      mostUsed,
      bestQos,
      worstQos,
      avgTime,
      recommendation
    };
  }, [rows]);

  return (
    <div className="glass rounded-3xl p-6 border border-slate-700/30 shadow-xl mt-5 animate-[fadeIn_0.5s_ease-out]">
      <h3 className="text-base font-bold text-blue-300 uppercase tracking-widest mb-4 flex items-center gap-2">
        <span>🧠 Adaptive Decision Insights</span>
        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-500/10 border border-blue-500/20 text-blue-200">
          SOC Engine
        </span>
      </h3>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        {/* Metric list */}
        <div className="md:col-span-5 grid grid-cols-2 gap-4">
          <div className="bg-slate-900/10 dark:bg-slate-800/15 border border-slate-750/15 p-3.5 rounded-2xl">
            <span className="text-[9px] font-bold text-slate-450 uppercase tracking-wider block">Peak Cipher</span>
            <span className="text-sm font-extrabold text-blue-300 block mt-1">{insights.mostUsed}</span>
          </div>

          <div className="bg-slate-900/10 dark:bg-slate-800/15 border border-slate-750/15 p-3.5 rounded-2xl">
            <span className="text-[9px] font-bold text-slate-450 uppercase tracking-wider block">Avg Transfer</span>
            <span className="text-sm font-extrabold text-slate-100 block mt-1">{Math.round(insights.avgTime)} ms</span>
          </div>

          <div className="bg-slate-900/10 dark:bg-slate-800/15 border border-slate-750/15 p-3.5 rounded-2xl">
            <span className="text-[9px] font-bold text-slate-450 uppercase tracking-wider block">Max Network QoS</span>
            <span className="text-sm font-extrabold text-emerald-500 dark:text-emerald-400 block mt-1">{insights.bestQos.toFixed(1)}</span>
          </div>

          <div className="bg-slate-900/10 dark:bg-slate-800/15 border border-slate-750/15 p-3.5 rounded-2xl">
            <span className="text-[9px] font-bold text-slate-450 uppercase tracking-wider block">Min Network QoS</span>
            <span className="text-sm font-extrabold text-rose-500 dark:text-rose-400 block mt-1">{insights.worstQos.toFixed(1)}</span>
          </div>
        </div>

        {/* Stability Recommendation */}
        <div className="md:col-span-7 flex flex-col justify-center bg-blue-500/5 border border-blue-500/10 rounded-2xl p-5">
          <span className="text-[10px] font-bold text-blue-400 uppercase tracking-widest block mb-1">
            Stability Recommendation
          </span>
          <p className="text-xs md:text-sm text-slate-200 leading-relaxed font-medium">
            {insights.recommendation}
          </p>
        </div>
      </div>
    </div>
  );
}
