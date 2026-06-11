import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

export default function NetworkQualityTimelineGraph({ rows }) {
  const data = rows
    .slice()
    .reverse()
    .map((row) => ({
      time: new Date(row.timestamp).toLocaleTimeString(),
      qualityScore: Number(row.network_quality_score ?? row.qos_score ?? 0)
    }));

  return (
    <div className="glass h-[400px] rounded-3xl p-4 shadow-xl shadow-blue-950/20">
      <h3 className="mb-3 text-base font-semibold text-blue-300">Network Quality Score Timeline</h3>
      <ResponsiveContainer width="100%" height="88%">
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
          <XAxis dataKey="time" stroke="#94a3b8" minTickGap={24} />
          <YAxis stroke="#94a3b8" domain={[0, 100]} />
          <Tooltip
            contentStyle={{ backgroundColor: "#0f172a", border: "1px solid #334155", color: "#f8fafc" }}
            labelStyle={{ color: "#e2e8f0" }}
            itemStyle={{ color: "#f8fafc" }}
          />
          <Line type="monotone" dataKey="qualityScore" stroke="#06b6d4" strokeWidth={3} dot={{ r: 2 }} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
