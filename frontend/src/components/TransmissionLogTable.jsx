import { useState } from "react";

function CopyButton({ text }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = (e) => {
    e.stopPropagation();
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <button
      onClick={handleCopy}
      title="Copy to clipboard"
      className="ml-1 rounded-lg bg-slate-800/80 dark:bg-slate-700/50 p-1 text-slate-400 hover:bg-slate-750 hover:text-white transition-all duration-200 border border-slate-700/30"
    >
      {copied ? (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 text-emerald-450 dark:text-emerald-400" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
        </svg>
      ) : (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
          <path d="M8 2a1 1 0 000 2h2a1 1 0 100-2H8z" />
          <path d="M3 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H5a2 2 0 01-2-2V5z" />
        </svg>
      )}
    </button>
  );
}

export default function TransmissionLogTable({ rows }) {
  const [selectedRow, setSelectedRow] = useState(null);

  const formatBytes = (bytes) => {
    if (!bytes) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const getIntegrityBadge = (r) => {
    const isIntact = r.encrypted_message_sent === r.encrypted_message_received && r.integrity_status !== "FAILED";
    const isTampered = r.integrity_status === "FAILED" || (r.encrypted_message_sent && r.encrypted_message_received && r.encrypted_message_sent !== r.encrypted_message_received);

    if (isIntact) {
      return (
        <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500"></span>
          Intact
        </span>
      );
    } else if (isTampered) {
      return (
        <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-rose-600 dark:text-rose-450 bg-rose-500/10 border border-rose-500/25 px-2 py-0.5 rounded-full animate-pulse">
          <span className="h-1.5 w-1.5 rounded-full bg-rose-500"></span>
          Modified
        </span>
      );
    } else {
      return (
        <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-amber-600 dark:text-amber-450 bg-amber-500/10 border border-amber-500/25 px-2 py-0.5 rounded-full">
          <span className="h-1.5 w-1.5 rounded-full bg-amber-500"></span>
          Warning
        </span>
      );
    }
  };

  return (
    <div className="glass overflow-hidden rounded-3xl p-0 shadow-2xl shadow-slate-950/45 mb-6 border border-slate-700/30">
      <div className="max-h-[35rem] overflow-auto">
        <table className="min-w-[1000px] w-full text-sm text-slate-100">
          <thead className="sticky top-0 z-20 bg-slate-800 dark:bg-slate-900/98 text-white dark:text-blue-300 border-b border-slate-700/60 dark:border-blue-600/30">
            <tr>
              <th className="px-5 py-4 text-left font-bold tracking-wider text-xs uppercase text-slate-350">Sender</th>
              <th className="px-5 py-4 text-left font-bold tracking-wider text-xs uppercase text-slate-350">Receiver</th>
              <th className="px-5 py-4 text-left font-bold tracking-wider text-xs uppercase text-slate-350">Message</th>
              <th className="px-5 py-4 text-left font-bold tracking-wider text-xs uppercase text-slate-350">Algorithm</th>
              <th className="px-5 py-4 text-left font-bold tracking-wider text-xs uppercase text-slate-350">Integrity</th>
              <th className="px-5 py-4 text-left font-bold tracking-wider text-xs uppercase text-slate-350">Hash</th>
              <th className="px-5 py-4 text-center font-bold tracking-wider text-xs uppercase text-slate-350">Details</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/40">
            {rows.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-5 py-12 text-center text-slate-400 font-medium bg-slate-900/5">
                  No transmissions found matching the search filters.
                </td>
              </tr>
            ) : (
              rows.map((r, index) => {
                const uniqueId = r.id || `${r.timestamp}-${index}`;
                const isFile = !!r.file_name || r.file_size > 0;
                
                const rawContent = isFile 
                  ? `📄 ${r.file_name}`
                  : (r.decrypted_message || r.sent_message || "-");

                const truncatedContent = rawContent.length > 20 
                  ? `${rawContent.slice(0, 20)}...`
                  : rawContent;

                return (
                  <tr
                    key={uniqueId}
                    onClick={() => setSelectedRow(r)}
                    className="soc-table-row cursor-pointer border-b border-slate-200 dark:border-slate-800/20 text-slate-800 dark:text-slate-100 odd:bg-white even:bg-slate-50 hover:bg-sky-50 dark:odd:bg-transparent dark:even:bg-transparent dark:hover:bg-[#13203a] transition-colors"
                  >
                    {/* Sender */}
                    <td className="px-5 py-4 font-bold text-slate-800 dark:text-slate-200">{r.sender}</td>

                    {/* Receiver */}
                    <td className="px-5 py-4 font-bold text-slate-800 dark:text-slate-200">{r.receiver}</td>
                    
                    {/* Plaintext Message content */}
                    <td className="px-5 py-4 font-mono text-xs text-slate-700 dark:text-slate-100 max-w-[200px] truncate">
                      {isFile ? (
                        <span className="text-blue-300 font-semibold">{truncatedContent}</span>
                      ) : (
                        truncatedContent
                      )}
                    </td>

                    {/* Encryption Algorithm */}
                    <td className="px-5 py-4">
                      <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md border border-blue-500/25 bg-blue-500/5 text-blue-300">
                        {r.encryption_algorithm || "NONE"}
                      </span>
                    </td>

                    {/* Integrity Status */}
                    <td className="px-5 py-4">{getIntegrityBadge(r)}</td>

                    {/* Message Hash */}
                    <td className="px-5 py-4 font-mono text-xs">
                      {r.message_hash ? (
                        <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                          <span className="text-slate-350">{r.message_hash.slice(0, 10)}...</span>
                          <CopyButton text={r.message_hash} />
                        </div>
                      ) : (
                        "-"
                      )}
                    </td>

                    {/* View Details */}
                    <td className="px-5 py-4 text-center" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={() => setSelectedRow(r)}
                        className="text-xs font-bold px-3 py-1.5 rounded-lg bg-blue-100 text-blue-700 hover:bg-blue-600 hover:text-white dark:bg-transparent dark:text-blue-400 dark:hover:text-blue-300 dark:hover:underline focus:outline-none transition-colors"
                      >
                        [ View Payload ]
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Details Slide-out Drawer */}
      {selectedRow && (
        <div className="fixed inset-0 z-50 overflow-hidden flex justify-end">
          {/* Backdrop blur */}
          <div 
            className="absolute inset-0 bg-slate-950/70 backdrop-blur-sm transition-opacity duration-300"
            onClick={() => setSelectedRow(null)}
          />

          {/* Sliding Drawer Container */}
          <div className="relative w-full max-w-lg bg-slate-900/98 dark:bg-slate-950/98 border-l border-slate-800 dark:border-slate-800 shadow-2xl h-full flex flex-col p-6 text-slate-100 overflow-y-auto animate-[slideIn_0.25s_ease-out]">
            
            {/* Header */}
            <div className="flex justify-between items-center pb-4 border-b border-slate-800/80 mb-5">
              <div>
                <h3 className="text-base font-extrabold text-blue-300 uppercase tracking-widest">
                  Transmission Payload
                </h3>
                <p className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold mt-0.5">
                  Secure Logging Telemetry ID: #{selectedRow.id || "N/A"}
                </p>
              </div>
              <button
                onClick={() => setSelectedRow(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-slate-800/60 border border-slate-700/30 transition"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Content Sections */}
            <div className="flex-1 space-y-5 text-xs">
              
              {/* Section 1: Overview */}
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-2">
                  1. Lifecycle Overview
                </span>
                <div className="bg-slate-900/40 border border-slate-800 rounded-xl p-3 grid grid-cols-2 gap-3">
                  <div>
                    <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider block">Sender</span>
                    <span className="font-extrabold text-slate-100 text-sm mt-0.5 block">{selectedRow.sender || "N/A"}</span>
                  </div>
                  <div>
                    <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider block">Receiver</span>
                    <span className="font-extrabold text-slate-100 text-sm mt-0.5 block">{selectedRow.receiver || "N/A"}</span>
                  </div>
                  <div className="col-span-2 border-t border-slate-800/40 pt-2 mt-1">
                    <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider block">Timestamp</span>
                    <span className="font-mono text-slate-200 mt-0.5 block">
                      {selectedRow.timestamp ? new Date(selectedRow.timestamp).toLocaleString() : "N/A"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Section 2: Cipher Specs */}
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-2">
                  2. Cryptographic Specifications
                </span>
                <div className="bg-slate-900/40 border border-slate-800 rounded-xl p-3 grid grid-cols-2 gap-3">
                  <div>
                    <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider block">Algorithm</span>
                    <span className="text-[10px] font-black uppercase text-blue-300 bg-blue-500/10 border border-blue-500/20 px-2 py-0.5 rounded inline-block mt-1">
                      {selectedRow.encryption_algorithm || "NONE"}
                    </span>
                  </div>
                  <div>
                    <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider block">Key Version ID</span>
                    <span className="font-mono text-slate-200 mt-1 block">{selectedRow.key_id || "N/A"}</span>
                  </div>
                  <div className="border-t border-slate-800/40 pt-2 mt-1">
                    <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider block">Security Score</span>
                    <span className="font-bold text-emerald-400 mt-0.5 block">{selectedRow.security_score || "N/A"}/100</span>
                  </div>
                  <div className="border-t border-slate-800/40 pt-2 mt-1">
                    <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider block">Threat Level</span>
                    <span className={`font-bold mt-0.5 block uppercase ${
                      selectedRow.risk_level === "HIGH" ? "text-rose-450" : "text-slate-200"
                    }`}>{selectedRow.risk_level || "LOW"}</span>
                  </div>
                </div>
              </div>

              {/* Section 3: Data Integrity */}
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-2">
                  3. Integrity & SHA-256 Hash
                </span>
                <div className="bg-slate-900/40 border border-slate-800 rounded-xl p-3">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">Integrity Status</span>
                    {getIntegrityBadge(selectedRow)}
                  </div>
                  <div className="border-t border-slate-800/40 pt-2">
                    <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider block mb-1">Payload SHA-256 Hash</span>
                    <div className="flex items-center bg-slate-950/40 border border-slate-800 rounded-lg p-2 font-mono text-[10px] text-slate-300 break-all select-all">
                      <span className="flex-1">{selectedRow.message_hash || "N/A"}</span>
                      {selectedRow.message_hash && <CopyButton text={selectedRow.message_hash} />}
                    </div>
                  </div>
                </div>
              </div>

              {/* Section 4: Plaintext & Ciphertexts */}
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-2">
                  4. Raw Transmission Payloads
                </span>
                <div className="space-y-3">
                  
                  {/* Sent Plaintext */}
                  <div className="bg-slate-900/40 border border-slate-800 rounded-xl p-3">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">Plaintext Payload</span>
                      {!!selectedRow.file_name && (
                        <span className="text-[10px] font-bold text-blue-300 uppercase">
                          {formatBytes(selectedRow.file_size)} File
                        </span>
                      )}
                    </div>
                    <div className="bg-slate-950/40 border border-slate-800 rounded-lg p-2 text-slate-200 font-mono break-all whitespace-pre-wrap">
                      {selectedRow.file_name ? `📄 ${selectedRow.file_name}` : (selectedRow.sent_message || "-")}
                    </div>
                  </div>

                  {/* Sent Ciphertext */}
                  <div className="bg-slate-900/40 border border-slate-800 rounded-xl p-3">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">Ciphertext Sent</span>
                      {selectedRow.encrypted_message_sent && <CopyButton text={selectedRow.encrypted_message_sent} />}
                    </div>
                    <div className="bg-slate-950/40 border border-slate-800 rounded-lg p-2 text-slate-405 font-mono break-all max-h-[80px] overflow-y-auto">
                      {selectedRow.encrypted_message_sent || "-"}
                    </div>
                  </div>

                  {/* Received Ciphertext */}
                  <div className="bg-slate-900/40 border border-slate-800 rounded-xl p-3">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">Ciphertext Received</span>
                      {selectedRow.encrypted_message_received && <CopyButton text={selectedRow.encrypted_message_received} />}
                    </div>
                    <div className="bg-slate-950/40 border border-slate-800 rounded-lg p-2 text-slate-405 font-mono break-all max-h-[80px] overflow-y-auto">
                      {selectedRow.encrypted_message_received || "-"}
                    </div>
                  </div>

                  {/* Decrypted Output */}
                  <div className="bg-slate-900/40 border border-slate-800 rounded-xl p-3">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">Decrypted Output</span>
                      {selectedRow.decrypted_message && <CopyButton text={selectedRow.decrypted_message} />}
                    </div>
                    <div className="bg-slate-950/40 border border-slate-800 rounded-lg p-2 text-emerald-400 font-mono break-all">
                      {selectedRow.file_name ? `📄 Decrypted File: ${selectedRow.file_name}` : (selectedRow.decrypted_message || "-")}
                    </div>
                  </div>
                </div>
              </div>

              {/* Section 5: Telemetry stats */}
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-2">
                  5. Performance Telemetry
                </span>
                <div className="bg-slate-900/40 border border-slate-800 rounded-xl p-3 grid grid-cols-3 gap-3">
                  <div>
                    <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider block">Crypt-Time</span>
                    <span className="font-semibold text-slate-200 mt-0.5 block">{selectedRow.encryption_time_ms || 0} ms</span>
                  </div>
                  <div>
                    <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider block">Trans-Time</span>
                    <span className="font-semibold text-slate-200 mt-0.5 block">{selectedRow.transfer_time_ms || 0} ms</span>
                  </div>
                  <div>
                    <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider block">Decrypt-Time</span>
                    <span className="font-semibold text-slate-200 mt-0.5 block">{selectedRow.decryption_time_ms || 0} ms</span>
                  </div>
                  <div className="border-t border-slate-800/40 pt-2 mt-1">
                    <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider block">Latency</span>
                    <span className="font-semibold text-slate-250 mt-0.5 block">{selectedRow.latency_ms || 0} ms</span>
                  </div>
                  <div className="border-t border-slate-800/40 pt-2 mt-1">
                    <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider block">Bandwidth</span>
                    <span className="font-semibold text-slate-250 mt-0.5 block">{selectedRow.bandwidth_mbps || 0} Mbps</span>
                  </div>
                  <div className="border-t border-slate-800/40 pt-2 mt-1">
                    <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider block">Packet Loss</span>
                    <span className="font-semibold text-rose-400 mt-0.5 block">{selectedRow.packet_loss_percent || 0}%</span>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </div>
      )}
    </div>
  );
}
