import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LabelList } from "recharts";

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
    <div className="glass h-[400px] rounded-3xl p-4 shadow-xl border border-slate-700/30 flex flex-col justify-between">
      <div>
        <h3 className="text-base font-bold text-blue-300">Algorithm Frequency</h3>
        <p className="text-xs text-slate-400 mt-0.5">Number of times each algorithm was used</p>
      </div>
      <div className="flex-grow mt-3 h-[280px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} barCategoryGap="25%">
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border-slate-700)" opacity={0.6} />
            <XAxis dataKey="algorithm" stroke="rgb(var(--text-slate-300))" />
            <YAxis stroke="rgb(var(--text-slate-300))" />
            <Tooltip
              contentStyle={{ backgroundColor: "var(--glass-bg)", border: "1px solid var(--border-slate-700)", color: "rgb(var(--text-slate-100))", borderRadius: "12px" }}
              labelStyle={{ color: "rgb(var(--text-slate-200))" }}
              itemStyle={{ color: "rgb(var(--text-slate-100))" }}
            />
            <Bar dataKey="count" fill="#2563EB" radius={[6, 6, 0, 0]}>
              <LabelList dataKey="count" position="top" fill="rgb(var(--text-slate-100))" fontSize={10} fontWeight="bold" />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
