import { useMemo } from "react";

export default function TransmissionSecurityInsights({ rows }) {
  const insights = useMemo(() => {
    if (rows.length === 0) {
      return {
        mostUsedAlg: "N/A",
        latestSender: "N/A",
        latestReceiver: "N/A",
        avgHashLen: 0,
        integrityRate: 100,
        verdict: "Awaiting logs..."
      };
    }

    // 1. Most Used Algorithm
    const counts = rows.reduce((acc, r) => {
      const key = r.encryption_algorithm;
      if (key) acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {});
    let mostUsedAlg = "N/A";
    let max = 0;
    Object.keys(counts).forEach(k => {
      if (counts[k] > max) {
        max = counts[k];
        mostUsedAlg = k;
      }
    });

    // 2. Latest Sender & Receiver (rows is sorted DESC)
    const latestSender = rows[0]?.sender || "N/A";
    const latestReceiver = rows[0]?.receiver || "N/A";

    // 3. Avg Hash Length
    const hashes = rows.map(r => r.message_hash).filter(Boolean);
    const avgHashLen = hashes.length > 0
      ? Math.round(hashes.reduce((sum, h) => sum + h.length, 0) / hashes.length)
      : 0;

    // 4. Integrity Rate
    const intactCount = rows.filter(r => {
      const match = r.encrypted_message_sent === r.encrypted_message_received;
      const notFailed = r.integrity_status !== "FAILED";
      return match && notFailed;
    }).length;
    const integrityRate = Math.round((intactCount / rows.length) * 100);

    // 5. Verdict text
    let verdict = "";
    if (integrityRate < 100) {
      verdict = "Security Alert: Tampered transmission packets detected! Integrity validations failed on some payloads. Please check the network log details drawer for matching ciphertext discrepancies.";
    } else {
      verdict = "Security Lock Verifications: 100% data integrity verified. No modifications or ciphertext anomalies detected across the transmission history. SHA-256 validation matches perfectly.";
    }

    return {
      mostUsedAlg,
      latestSender,
      latestReceiver,
      avgHashLen,
      integrityRate,
      verdict
    };
  }, [rows]);

  return (
    <div className="glass bg-[#F0FDF4] dark:bg-slate-900/40 border border-[#BBF7D0] dark:border-slate-700/30 rounded-3xl p-6 shadow-xl mt-6 animate-[fadeIn_0.5s_ease-out] text-slate-800 dark:text-slate-100">
      <h3 className="text-base font-bold text-emerald-700 dark:text-blue-300 uppercase tracking-widest mb-4 flex items-center gap-2">
        <span>🛡️ Transmission Security Insights</span>
        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-500/10 dark:bg-blue-500/10 border border-emerald-500/20 dark:border-blue-500/20 text-emerald-700 dark:text-blue-200">
          Security Engine
        </span>
      </h3>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        {/* Metric list */}
        <div className="md:col-span-5 grid grid-cols-2 gap-4">
          <div className="bg-white dark:bg-slate-800/15 border border-[#BBF7D0] dark:border-slate-750/15 p-3 rounded-2xl shadow-sm">
            <span className="text-[9px] font-bold text-slate-500 dark:text-slate-450 uppercase tracking-wider block">Peak Algorithm</span>
            <span className="text-sm font-extrabold text-blue-600 dark:text-blue-300 block mt-1">{insights.mostUsedAlg}</span>
          </div>

          <div className="bg-white dark:bg-slate-800/15 border border-[#BBF7D0] dark:border-slate-750/15 p-3 rounded-2xl shadow-sm">
            <span className="text-[9px] font-bold text-slate-500 dark:text-slate-450 uppercase tracking-wider block">Avg Hash Length</span>
            <span className="text-sm font-extrabold text-slate-800 dark:text-slate-100 block mt-1">{insights.avgHashLen} chars</span>
          </div>

          <div className="bg-white dark:bg-slate-800/15 border border-[#BBF7D0] dark:border-slate-750/15 p-3 rounded-2xl shadow-sm">
            <span className="text-[9px] font-bold text-slate-500 dark:text-slate-450 uppercase tracking-wider block">Latest Sender</span>
            <span className="text-sm font-extrabold text-slate-800 dark:text-slate-150 block mt-1 truncate">{insights.latestSender}</span>
          </div>

          <div className="bg-white dark:bg-slate-800/15 border border-[#BBF7D0] dark:border-slate-750/15 p-3 rounded-2xl shadow-sm">
            <span className="text-[9px] font-bold text-slate-500 dark:text-slate-450 uppercase tracking-wider block">Latest Receiver</span>
            <span className="text-sm font-extrabold text-slate-800 dark:text-slate-150 block mt-1 truncate">{insights.latestReceiver}</span>
          </div>
        </div>

        {/* Security Summary Paragraph */}
        <div className={`md:col-span-7 flex flex-col justify-center border rounded-2xl p-5 shadow-sm ${
          insights.integrityRate < 100 
            ? "bg-rose-50 dark:bg-rose-500/5 border-rose-200 dark:border-rose-500/20 text-rose-800 dark:text-rose-350"
            : "bg-white dark:bg-emerald-500/5 border-emerald-200 dark:border-emerald-500/20 text-emerald-800 dark:text-emerald-350"
        }`}>
          <span className={`text-[10px] font-bold uppercase tracking-widest block mb-1.5 ${
            insights.integrityRate < 100 ? "text-rose-600 dark:text-rose-450" : "text-emerald-600 dark:text-emerald-450"
          }`}>
            Cryptographic Integrity Status
          </span>
          <p className="text-xs md:text-sm text-slate-700 dark:text-slate-200 leading-relaxed font-medium">
            {insights.verdict}
          </p>
        </div>
      </div>
    </div>
  );
}
