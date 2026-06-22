import { useMemo } from "react";

export default function TransferStabilityCard({ rows }) {
  // Filter condition: Include ONLY chat messages, exclude file transfers
  // Records with a non-empty file_name OR file_size > 0 should be excluded.
  const messageRows = useMemo(() => {
    return rows.filter(r => !r.file_name && !(r.file_size > 0));
  }, [rows]);

  const stats = useMemo(() => {
    const count = messageRows.length;
    if (count === 0) {
      return {
        stdDev: 0,
        mean: 0,
        count: 0,
        classification: "No Data",
        colorClass: "text-slate-400 border-slate-700 bg-slate-900/20",
        bgClass: "bg-slate-900/40 border-slate-800"
      };
    }

    const transferTimes = messageRows.map((r) => Number(r.transfer_time_ms || 0));
    const sum = transferTimes.reduce((acc, v) => acc + v, 0);
    const mean = sum / count;

    const variance = transferTimes.reduce((acc, v) => acc + Math.pow(v - mean, 2), 0) / count;
    const stdDev = Math.sqrt(variance);

    let classification = "";
    let colorClass = "";
    let bgClass = "";

    if (stdDev <= 5) {
      classification = "Excellent Stability";
      colorClass = "text-emerald-400 border-emerald-500/30 bg-emerald-950/20";
      bgClass = "border-slate-800/80 bg-slate-900/40 hover:border-emerald-500/25";
    } else if (stdDev <= 15) {
      classification = "Good Stability";
      colorClass = "text-cyan-400 border-cyan-500/30 bg-cyan-950/20";
      bgClass = "border-slate-800/80 bg-slate-900/40 hover:border-cyan-500/25";
    } else if (stdDev <= 30) {
      classification = "Moderate Stability";
      colorClass = "text-amber-400 border-amber-500/30 bg-amber-950/20";
      bgClass = "border-slate-800/80 bg-slate-900/40 hover:border-amber-500/25";
    } else {
      classification = "Poor Stability";
      colorClass = "text-red-400 border-red-500/30 bg-red-950/20";
      bgClass = "border-slate-800/80 bg-slate-900/40 hover:border-red-500/25";
    }

    return {
      stdDev,
      mean,
      count,
      classification,
      colorClass,
      bgClass
    };
  }, [messageRows]);

  return (
    <div className={`glass h-[400px] rounded-3xl border p-6 flex flex-col justify-between shadow-xl transition-all duration-300 ${stats.bgClass}`}>
      <div className="space-y-4">
        <h3 className="text-base font-semibold text-blue-300">Transfer Time Consistency</h3>
        
        {stats.count === 0 ? (
          <div className="flex items-center justify-center text-slate-400 text-sm min-h-[180px]">
            No message transfer data available
          </div>
        ) : (
          <div className="space-y-6">
            <div>
              <p className="text-xs text-slate-400 uppercase tracking-wider">Standard Deviation</p>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-4xl font-extrabold text-slate-100">{stats.stdDev.toFixed(2)}</span>
                <span className="text-slate-400 text-lg">ms</span>
              </div>
            </div>

            <div>
              <p className="text-xs text-slate-400 uppercase tracking-wider mb-2">Stability Rating</p>
              <div className={`inline-flex items-center px-4 py-2 rounded-2xl border text-sm font-bold shadow-sm ${stats.colorClass}`}>
                <span className="relative flex h-2 w-2 mr-2">
                  <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${stats.colorClass.split(" ")[0].replace('text', 'bg')}`}></span>
                  <span className={`relative inline-flex rounded-full h-2 w-2 ${stats.colorClass.split(" ")[0].replace('text', 'bg')}`}></span>
                </span>
                {stats.classification}
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="border-t border-slate-800/80 pt-4 mt-auto">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-xs text-slate-400">Average Transfer Time</p>
            <p className="text-sm font-semibold text-slate-200 mt-0.5">
              {stats.count === 0 ? "N/A" : `${stats.mean.toFixed(2)} ms`}
            </p>
          </div>
          <div>
            <p className="text-xs text-slate-400">Total Messages Analyzed</p>
            <p className="text-sm font-semibold text-slate-200 mt-0.5">{stats.count}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
