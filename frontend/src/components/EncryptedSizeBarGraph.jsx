import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LabelList } from "recharts";

export default function EncryptedSizeBarGraph({ rows }) {
  // Filter condition: Include ONLY real chat messages, exclude file transfers
  const messageRows = rows.filter(r => !r.file_name && !(r.file_size > 0));

  const data = ["ECC", "AES-256 + RSA", "AES-256", "ChaCha20", "AES-128"].map((algorithm) => {
    const matching = messageRows.filter(r => r.encryption_algorithm === algorithm && r.encrypted_message_sent);
    const avgSize = matching.length > 0
      ? matching.reduce((sum, r) => sum + r.encrypted_message_sent.length, 0) / matching.length
      : 0;

    return {
      algorithm,
      avgSize: Math.round(avgSize) // rounded to nearest byte (character)
    };
  });

  return (
    <div className="glass h-[400px] rounded-3xl p-4 shadow-xl border border-slate-700/30 flex flex-col justify-between">
      <div>
        <h3 className="text-base font-bold text-blue-300">Payload Size</h3>
        <p className="text-xs text-slate-400 mt-0.5">Average ciphertext size in bytes (text messages only)</p>
      </div>
      <div className="flex-grow mt-3 h-[280px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} barCategoryGap="25%">
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border-slate-700)" opacity={0.6} />
            <XAxis dataKey="algorithm" stroke="rgb(var(--text-slate-300))" />
            <YAxis stroke="rgb(var(--text-slate-300))" />
            <Tooltip
              contentStyle={{ backgroundColor: "var(--glass-bg)", border: "1px solid var(--border-slate-700)", borderRadius: "12px", color: "rgb(var(--text-slate-100))" }}
              labelStyle={{ color: "rgb(var(--text-slate-200))" }}
              itemStyle={{ color: "rgb(var(--text-slate-100))" }}
            />
            <Bar dataKey="avgSize" fill="#7C3AED" radius={[6, 6, 0, 0]} name="Avg Size (Bytes)">
              <LabelList dataKey="avgSize" position="top" fill="rgb(var(--text-slate-100))" fontSize={10} fontWeight="bold" />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
