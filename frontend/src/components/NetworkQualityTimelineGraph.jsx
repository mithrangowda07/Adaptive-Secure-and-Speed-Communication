import { useMemo } from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

export default function NetworkQualityTimelineGraph({ rows }) {
  const data = useMemo(() => {
    return rows
      .slice()
      .reverse()
      .map((row) => ({
        time: new Date(row.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        qualityScore: Number(row.network_quality_score ?? row.qos_score ?? 0)
      }));
  }, [rows]);

  const stats = useMemo(() => {
    if (data.length === 0) return { current: 0, highest: 0, lowest: 0 };
    const scores = data.map(d => d.qualityScore);
    return {
      current: scores[scores.length - 1] || 0,
      highest: Math.max(...scores),
      lowest: Math.min(...scores)
    };
  }, [data]);

  return (
    <div className="glass primary-card h-[400px] rounded-3xl p-5 shadow-xl">
      <div className="mb-4 flex flex-wrap justify-between items-start gap-4">
        <div>
          <h3 className="text-base font-bold text-blue-300">Network Quality Score Timeline</h3>
          <p className="text-xs text-slate-400 mt-0.5">Real-time network quality trend</p>
        </div>
        
        {/* Statistics Header */}
        <div className="flex gap-4 text-xs">
          <div className="flex flex-col items-end">
            <span className="text-[9px] text-slate-400 uppercase font-bold tracking-wider">Current</span>
            <span className="font-mono font-extrabold text-cyan-550 dark:text-cyan-400">{stats.current.toFixed(1)}</span>
          </div>
          <div className="flex flex-col items-end">
            <span className="text-[9px] text-slate-400 uppercase font-bold tracking-wider">Highest</span>
            <span className="font-mono font-extrabold text-emerald-500">{stats.highest.toFixed(1)}</span>
          </div>
          <div className="flex flex-col items-end">
            <span className="text-[9px] text-slate-400 uppercase font-bold tracking-wider">Lowest</span>
            <span className="font-mono font-extrabold text-rose-500">{stats.lowest.toFixed(1)}</span>
          </div>
        </div>
      </div>

      <div className="flex-grow h-[280px]">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border-slate-700)" opacity={0.6} />
            <XAxis dataKey="time" stroke="rgb(var(--text-slate-300))" minTickGap={32} />
            <YAxis stroke="rgb(var(--text-slate-300))" domain={[0, 100]} />
            <Tooltip
              contentStyle={{ backgroundColor: "var(--glass-bg)", border: "1px solid var(--border-slate-700)", color: "rgb(var(--text-slate-100))", borderRadius: "12px" }}
              labelStyle={{ color: "rgb(var(--text-slate-200))" }}
              itemStyle={{ color: "rgb(var(--text-slate-100))" }}
            />
            <Line type="monotone" dataKey="qualityScore" stroke="#06b6d4" strokeWidth={3} dot={{ r: 2 }} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
