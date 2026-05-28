const tone = { normal: "text-emerald-400", moderate: "text-yellow-400", slow: "text-red-400" };

export default function NetworkPanel({ state, algorithm }) {
  return (
    <div className="glass rounded-3xl p-5 shadow-xl shadow-blue-950/20">
      <h3 className="mb-4 text-lg font-semibold text-blue-300">Live Network Status</h3>
      <div className="space-y-3 text-sm">
        <p>
          Current Network Mode:{" "}
          <span className={`font-semibold uppercase ${tone[state.mode] || "text-slate-200"}`}>
            {state.mode}
          </span>
        </p>
        <p>
          Current Encryption Algorithm:{" "}
          <span className="font-semibold text-blue-300">{algorithm.currentAlgorithm}</span>
        </p>
        <p>Current Latency: <span className="text-slate-200">{state.latency} ms</span></p>
        <p>Current Bandwidth: <span className="text-slate-200">{state.bandwidth} Mbps</span></p>
        <p>Current Packet Loss: <span className="text-slate-200">{state.packet_loss}%</span></p>
      </div>
    </div>
  );
}
