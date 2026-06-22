import { useMemo } from "react";

export default function TransmissionSummaryKpis({ rows }) {
  const stats = useMemo(() => {
    const total = rows.length;
    if (total === 0) {
      return {
        totalTransmissions: 0,
        integrityRate: 100,
        encryptionRate: 100,
        activeAlgorithms: 0,
        avgPayloadSize: 0,
        successRate: 100
      };
    }

    const intactCount = rows.filter(r => {
      const match = r.encrypted_message_sent === r.encrypted_message_received;
      const notFailed = r.integrity_status !== "FAILED";
      return match && notFailed;
    }).length;

    const integrityRate = Math.round((intactCount / total) * 100);

    // Filter distinct algorithms
    const algs = new Set(rows.map(r => r.encryption_algorithm).filter(Boolean));
    const activeAlgorithms = algs.size;

    // Average payload size
    const totalSize = rows.reduce((sum, r) => {
      const size = r.file_size > 0 ? Number(r.file_size) : (r.sent_message?.length || 0);
      return sum + size;
    }, 0);
    const avgPayloadSize = Math.round(totalSize / total);

    // Success rate is where integrity passed and decryption didn't fail
    const successCount = rows.filter(r => {
      const match = r.encrypted_message_sent === r.encrypted_message_received;
      const notFailed = r.integrity_status !== "FAILED";
      const decrypted = !!r.decrypted_message;
      return match && notFailed && decrypted;
    }).length;
    const successRate = Math.round((successCount / total) * 100);

    return {
      totalTransmissions: total,
      integrityRate,
      encryptionRate: 100, // all communications are encrypted
      activeAlgorithms,
      avgPayloadSize,
      successRate
    };
  }, [rows]);

  const getIntegrityColor = (rate) => {
    if (rate >= 95) return "text-emerald-500 dark:text-emerald-400 bg-emerald-500/10 border-emerald-500/25";
    if (rate >= 80) return "text-amber-600 dark:text-amber-400 bg-amber-500/10 border-amber-500/25";
    return "text-rose-600 dark:text-rose-400 bg-rose-500/10 border-rose-500/25";
  };

  return (
    <section className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6 animate-[fadeIn_0.4s_ease-out]">
      {/* Messages / Transmissions */}
      <div className="glass rounded-2xl p-4 flex flex-col justify-between hover:border-blue-500/20 transition duration-200 shadow-lg">
        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Messages</span>
        <div className="flex items-baseline mt-2 gap-1.5">
          <span className="text-2xl font-black text-slate-100">{stats.totalTransmissions}</span>
          <span className="text-[10px] font-extrabold text-slate-400 uppercase">Logged</span>
        </div>
      </div>

      {/* Encryption Rate */}
      <div className="glass primary-card rounded-2xl p-4 flex flex-col justify-between hover:border-blue-500/35 transition duration-200 shadow-lg">
        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Encrypted</span>
        <div className="flex items-baseline mt-2 gap-1">
          <span className="text-2xl font-black text-blue-600 dark:text-blue-400">{stats.encryptionRate}%</span>
          <span className="text-[10px] font-extrabold text-slate-400 uppercase">Secured</span>
        </div>
      </div>

      {/* Integrity Rate */}
      <div className="glass primary-card rounded-2xl p-4 flex flex-col justify-between hover:border-blue-500/35 transition duration-200 shadow-lg">
        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Integrity</span>
        <div className="flex items-baseline mt-2 gap-1.5">
          <span className="text-2xl font-black text-slate-100">{stats.integrityRate}%</span>
          <span className={`text-[10px] font-extrabold uppercase px-1.5 py-0.5 rounded border ${getIntegrityColor(stats.integrityRate)}`}>
            {stats.integrityRate === 100 ? "Intact" : "Warning"}
          </span>
        </div>
      </div>

      {/* Active Algorithms */}
      <div className="glass rounded-2xl p-4 flex flex-col justify-between hover:border-blue-500/20 transition duration-200 shadow-lg">
        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Algorithms</span>
        <div className="flex items-baseline mt-2 gap-1">
          <span className="text-2xl font-black text-slate-100">{stats.activeAlgorithms}</span>
          <span className="text-[10px] font-extrabold text-slate-400 uppercase">Active</span>
        </div>
      </div>

      {/* Average Payload Size */}
      <div className="glass rounded-2xl p-4 flex flex-col justify-between hover:border-blue-500/20 transition duration-200 shadow-lg">
        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Avg Payload</span>
        <div className="flex items-baseline mt-2 gap-1">
          <span className="text-2xl font-black text-slate-100">{stats.avgPayloadSize}</span>
          <span className="text-[10px] font-extrabold text-slate-400 uppercase">Bytes</span>
        </div>
      </div>

      {/* Success Rate */}
      <div className="glass primary-card rounded-2xl p-4 flex flex-col justify-between hover:border-blue-500/35 transition duration-200 shadow-lg">
        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Success Rate</span>
        <div className="flex items-baseline mt-2 gap-1">
          <span className="text-2xl font-black text-emerald-500 dark:text-emerald-400">{stats.successRate}%</span>
          <span className="text-[10px] font-extrabold text-slate-400 uppercase">Delivery</span>
        </div>
      </div>
    </section>
  );
}
