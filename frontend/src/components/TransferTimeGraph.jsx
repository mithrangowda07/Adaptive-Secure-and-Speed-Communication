import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

export default function TransferTimeGraph({ rows }) {
  // Filter condition: Include ONLY chat messages, exclude file transfers
  // Records with a non-empty file_name OR file_size > 0 should be excluded.
  const messageRows = rows.filter(r => !r.file_name && !(r.file_size > 0));

  if (messageRows.length === 0) {
    return (
      <div className="glass h-[400px] rounded-3xl p-6 flex flex-col justify-between shadow-xl shadow-blue-950/20">
        <h3 className="text-base font-semibold text-blue-300">Transfer Time vs Message ID</h3>
        <div className="flex-grow grid place-items-center text-slate-400 text-sm">
          No message transfer data available
        </div>
      </div>
    );
  }

  // Map data in ascending order (chronological sequence of id)
  const data = messageRows
    .slice()
    .reverse()
    .map((r) => ({
      messageId: r.id,
      transferTime: Number(r.transfer_time_ms || 0),
      algorithm: r.encryption_algorithm,
      timestamp: new Date(r.timestamp).toLocaleTimeString()
    }));

  return (
    <div className="glass h-[400px] rounded-3xl p-6 shadow-xl shadow-blue-950/20">
      <h3 className="mb-4 text-base font-semibold text-blue-300">Transfer Time vs Message ID</h3>
      <ResponsiveContainer width="100%" height="85%">
        <LineChart data={data} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
          <XAxis 
            dataKey="messageId" 
            stroke="#94a3b8" 
            label={{ value: 'Message ID', position: 'insideBottomRight', offset: -5, fill: '#94a3b8', fontSize: 12 }} 
          />
          <YAxis 
            stroke="#94a3b8" 
            label={{ value: 'Transfer Time (ms)', angle: -90, position: 'insideLeft', offset: 10, fill: '#94a3b8', fontSize: 12 }} 
          />
          <Tooltip
            contentStyle={{ backgroundColor: "#0f172a", border: "1px solid #334155", borderRadius: "12px", color: "#f8fafc" }}
            content={({ active, payload }) => {
              if (active && payload && payload.length) {
                const item = payload[0].payload;
                return (
                  <div className="rounded-xl border border-slate-700 bg-slate-900/90 p-3 shadow-xl backdrop-blur-md text-xs space-y-1">
                    <p className="font-bold text-blue-300">Message ID: {item.messageId}</p>
                    <p className="text-slate-200">Transfer Time: <span className="font-semibold text-emerald-400">{item.transferTime} ms</span></p>
                    <p className="text-slate-200">Algorithm: <span className="font-semibold text-cyan-400">{item.algorithm}</span></p>
                    <p className="text-slate-400">Time: {item.timestamp}</p>
                  </div>
                );
              }
              return null;
            }}
          />
          <Line
            type="monotone"
            dataKey="transferTime"
            stroke="#f59e0b"
            strokeWidth={3}
            dot={{ r: 3, stroke: '#f59e0b', strokeWidth: 2, fill: '#0f172a' }}
            activeDot={{ r: 6, fill: '#f59e0b' }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
