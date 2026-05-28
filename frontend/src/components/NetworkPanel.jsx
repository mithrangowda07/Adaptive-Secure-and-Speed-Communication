import { useState } from "react";
import { createPortal } from "react-dom";

const tone = { normal: "text-emerald-400", moderate: "text-yellow-400", slow: "text-red-400" };

export default function NetworkPanel({ state, algorithm }) {
  const [openInfo, setOpenInfo] = useState(false);

  return (
    <div className="glass rounded-3xl p-5 shadow-xl shadow-blue-950/20">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-lg font-semibold text-blue-300">Live Network Status</h3>
        <button
          onClick={() => setOpenInfo(true)}
          className="rounded-full border border-slate-500 px-2 text-xs text-slate-200 hover:border-cyan-400"
        >
          i
        </button>
      </div>
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
        <p>Current Jitter: <span className="text-slate-200">{state.jitter} ms</span></p>
        <p>Current Throughput: <span className="text-slate-200">{state.throughput} Mbps</span></p>
        <p>Connection Stability: <span className="text-slate-200">{state.connection_stability}%</span></p>
        <p>Response Time: <span className="text-slate-200">{state.response_time} ms</span></p>
        <p>Error Rate: <span className="text-slate-200">{state.error_rate}%</span></p>
        <p>QoS Score: <span className="font-semibold text-cyan-300">{state.qos_score}</span></p>
        <p>QoS Status: <span className="font-semibold text-cyan-300">{state.qos_status}</span></p>
      </div>
      {openInfo &&
        createPortal(
          <div className="fixed inset-0 z-[100] grid place-items-center bg-slate-950/85 p-4">
            <div className="glass w-full max-w-2xl rounded-3xl border border-cyan-400/30 p-6">
              <h4 className="mb-3 text-lg font-semibold text-cyan-300">QoS Calculation Details</h4>
              <p className="mb-3 text-sm text-slate-300">
                Parameters used: latency, bandwidth, packet_loss, jitter, throughput,
                connection_stability, response_time, error_rate.
              </p>
              <div className="rounded-xl bg-slate-900/50 p-3 font-mono text-xs text-slate-100">
                qos_score = latencyScore*0.18 + bandwidthScore*0.17 + packetLossScore*0.15 +
                jitterScore*0.10 + throughputScore*0.12 + stabilityScore*0.13 +
                responseScore*0.10 + errorScore*0.05
              </div>
              <p className="mt-3 text-sm text-slate-300">
                Status rule: QoS &gt;= 70 = Good, 40-69 = Average, below 40 = Poor.
              </p>
              <div className="mt-5 flex justify-end">
                <button
                  onClick={() => setOpenInfo(false)}
                  className="rounded-xl bg-cyan-600 px-4 py-2 text-sm font-semibold hover:bg-cyan-500"
                >
                  Close
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}
    </div>
  );
}
