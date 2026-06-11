import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

export default function AlgorithmBarGraph({ rows }) {
  const counts = rows.reduce((acc, r) => {
    const key = r.encryption_algorithm;
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});
  const data = ["ECC", "AES-256 + RSA", "AES-256", "ChaCha20", "AES-128"].map((algorithm) => ({
    algorithm,
    count: counts[algorithm] || 0
  }));

  return (
    <div className="glass h-[400px] rounded-3xl p-4">
      <h3 className="mb-3 text-base font-semibold text-blue-300">Algorithm Frequency</h3>
      <ResponsiveContainer width="100%" height="88%">
        <BarChart data={data} barCategoryGap="30%">
          <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
          <XAxis dataKey="algorithm" stroke="#94a3b8" />
          <YAxis stroke="#94a3b8" />
          <Tooltip
            contentStyle={{ backgroundColor: "#0f172a", border: "1px solid #334155", color: "#f8fafc" }}
            labelStyle={{ color: "#e2e8f0" }}
            itemStyle={{ color: "#f8fafc" }}
          />
          <Bar dataKey="count" fill="#22d3ee" radius={[6, 6, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
