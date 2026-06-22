import { useMemo } from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

const algValue = { "ECC": 5, "AES-256 + RSA": 4, "AES-256": 3, "ChaCha20": 2, "AES-128": 1 };
const labelByValue = { 5: "ECC", 4: "AES-256 + RSA", 3: "AES-256", 2: "ChaCha20", 1: "AES-128" };

export default function TimelineGraph({ rows }) {
  const data = useMemo(() => {
    return rows
      .slice()
      .reverse()
      .map((r) => ({
        time: new Date(r.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        algorithm: r.encryption_algorithm,
        value: algValue[r.encryption_algorithm] || 1
      }));
  }, [rows]);

  return (
    <div className="glass h-[400px] rounded-3xl p-4 shadow-xl border border-slate-700/30 flex flex-col justify-between">
      <div>
        <h3 className="text-base font-bold text-blue-300">Algorithm Timeline</h3>
        <p className="text-xs text-slate-400 mt-0.5">Encryption algorithm selected over time</p>
      </div>
      <div className="flex-grow mt-3 h-[280px]">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 5, right: 5, left: -10, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border-slate-700)" opacity={0.6} />
            <XAxis dataKey="time" stroke="rgb(var(--text-slate-300))" minTickGap={32} />
            <YAxis stroke="rgb(var(--text-slate-300))" ticks={[1, 2, 3, 4, 5]} tickFormatter={(value) => labelByValue[value]} />
            <Tooltip
              contentStyle={{ backgroundColor: "var(--glass-bg)", border: "1px solid var(--border-slate-700)", color: "rgb(var(--text-slate-100))", borderRadius: "12px" }}
              labelStyle={{ color: "rgb(var(--text-slate-200))" }}
              itemStyle={{ color: "rgb(var(--text-slate-100))" }}
              formatter={(value) => labelByValue[value]}
            />
            <Line type="monotone" dataKey="value" stroke="#2563EB" strokeWidth={3} dot={{ r: 3 }} activeDot={{ r: 5 }} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
