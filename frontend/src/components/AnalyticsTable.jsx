export default function AnalyticsTable({ rows }) {
  const columns = [
    { key: "sender", label: "Sender" },
    { key: "receiver", label: "Receiver" },
    { key: "message", label: "Message" },
    { key: "encryption_algorithm", label: "Encryption Algorithm" },
    { key: "encryption_time_ms", label: "Encryption Time (ms)" },
    { key: "transfer_time_ms", label: "Transfer Time (ms)" },
    { key: "network_mode", label: "Network Mode" },
    { key: "timestamp", label: "Timestamp" },
    { key: "decryption_time_ms", label: "Decryption Time (ms)" },
    { key: "latency_ms", label: "Latency (ms)" },
    { key: "bandwidth_mbps", label: "Bandwidth (Mbps)" },
    { key: "packet_loss_percent", label: "Packet Loss (%)" },
    { key: "total_processing_time_ms", label: "Total Processing Time (ms)" },
    { key: "file_name", label: "File Name" },
    { key: "file_size", label: "File Size" },
    { key: "date", label: "Date" }
  ];

  return (
    <div className="glass overflow-hidden rounded-3xl p-0">
      <div className="max-h-[31rem] overflow-auto">
        <table className="min-w-[1400px] text-sm text-slate-100">
          <thead className="sticky top-0 z-20 bg-slate-900/95 text-blue-300">
            <tr>
              {columns.map((column) => (
                <th key={column.key} className="whitespace-nowrap px-3 py-3 text-left font-semibold">
                  {column.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((r, index) => (
              <tr
                key={r.id || `${r.timestamp}-${index}`}
                className={`${index % 2 === 0 ? "bg-slate-900/20" : "bg-slate-800/20"} border-t border-slate-700/70 transition hover:bg-blue-950/25`}
              >
                <td className="px-3 py-2">{r.sender}</td>
                <td className="px-3 py-2">{r.receiver}</td>
                <td className="max-w-[360px] truncate px-3 py-2" title={r.message || "-"}>
                  {r.message || "-"}
                </td>
                <td className="px-3 py-2">{r.encryption_algorithm}</td>
                <td className="px-3 py-2">{r.encryption_time_ms}</td>
                <td className="px-3 py-2">{r.transfer_time_ms}</td>
                <td className="px-3 py-2 capitalize">{r.network_mode}</td>
                <td className="whitespace-nowrap px-3 py-2">{r.timestamp}</td>
                <td className="px-3 py-2">{r.decryption_time_ms}</td>
                <td className="px-3 py-2">{r.latency_ms}</td>
                <td className="px-3 py-2">{r.bandwidth_mbps}</td>
                <td className="px-3 py-2">{r.packet_loss_percent}</td>
                <td className="px-3 py-2">{r.total_processing_time_ms}</td>
                <td className="px-3 py-2">{r.file_name || "-"}</td>
                <td className="px-3 py-2">{r.file_size || "-"}</td>
                <td className="px-3 py-2">{r.date}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
