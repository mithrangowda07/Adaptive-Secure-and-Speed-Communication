import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

const algValue = { "ECC": 5, "AES-256 + RSA": 4, "AES-256": 3, "ChaCha20": 2, "AES-128": 1 };
const labelByValue = { 5: "ECC", 4: "AES-256 + RSA", 3: "AES-256", 2: "ChaCha20", 1: "AES-128" };

export default function TimelineGraph({ rows }) {
  const data = rows
    .slice()
    .reverse()
    .map((r) => ({
      time: new Date(r.timestamp).toLocaleTimeString(),
      algorithm: r.encryption_algorithm,
      value: algValue[r.encryption_algorithm] || 1
    }));

  return (
    <div className="glass h-[400px] rounded-3xl p-4">
      <h3 className="mb-3 text-base font-semibold text-blue-300">Algorithm Timeline</h3>
      <ResponsiveContainer width="100%" height="88%">
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
          <XAxis dataKey="time" stroke="#94a3b8" minTickGap={24} />
          <YAxis stroke="#94a3b8" ticks={[1, 2, 3, 4, 5]} tickFormatter={(value) => labelByValue[value]} />
          <Tooltip
            contentStyle={{ backgroundColor: "#0f172a", border: "1px solid #334155", color: "#f8fafc" }}
            labelStyle={{ color: "#e2e8f0" }}
            itemStyle={{ color: "#f8fafc" }}
            formatter={(value) => labelByValue[value]}
          />
          <Line type="monotone" dataKey="value" stroke="#38bdf8" strokeWidth={3} dot={{ r: 3 }} activeDot={{ r: 5 }} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
