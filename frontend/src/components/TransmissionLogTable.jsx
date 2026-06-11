import { useState } from "react";

function CopyButton({ text }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <button
      onClick={handleCopy}
      title="Copy to clipboard"
      className="ml-1.5 rounded-lg bg-slate-800/80 p-1 text-slate-400 hover:bg-slate-700 hover:text-white transition-all duration-200 border border-slate-700/50"
    >
      {copied ? (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 text-emerald-400" viewBox="0 0 20 20" fill="currentColor">
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
  const [expandedCells, setExpandedCells] = useState({});

  const toggleExpand = (rowId, colKey) => {
    const cellKey = `${rowId}-${colKey}`;
    setExpandedCells((prev) => ({
      ...prev,
      [cellKey]: !prev[cellKey]
    }));
  };

  const renderTruncated = (text, maxLength, rowId, colKey) => {
    if (!text) return "-";
    if (text.length <= maxLength) return text;

    const cellKey = `${rowId}-${colKey}`;
    const isExpanded = expandedCells[cellKey];

    if (isExpanded) {
      return (
        <span className="inline-block max-w-[400px] break-all whitespace-pre-wrap">
          {text}{" "}
          <button
            onClick={() => toggleExpand(rowId, colKey)}
            className="text-xs font-semibold text-blue-400 hover:text-blue-300 ml-1 underline focus:outline-none"
          >
            Show less
          </button>
        </span>
      );
    }

    return (
      <span>
        {text.slice(0, maxLength)}...{" "}
        <button
          onClick={() => toggleExpand(rowId, colKey)}
          className="text-xs font-semibold text-blue-400 hover:text-blue-300 ml-1 underline focus:outline-none"
        >
          Show more
        </button>
      </span>
    );
  };

  return (
    <div className="glass overflow-hidden rounded-3xl p-0 shadow-2xl shadow-slate-950/45">
      <div className="max-h-[35rem] overflow-auto">
        <table className="min-w-[1200px] w-full text-sm text-slate-100">
          <thead className="sticky top-0 z-20 bg-slate-900/95 text-blue-300 border-b border-slate-700/80">
            <tr>
              <th className="px-5 py-4 text-left font-semibold">Sender</th>
              <th className="px-5 py-4 text-left font-semibold">Sent Message</th>
              <th className="px-5 py-4 text-left font-semibold">Original Message Hash</th>
              <th className="px-5 py-4 text-left font-semibold">Encrypted Message Sent</th>
              <th className="px-5 py-4 text-left font-semibold">Encrypted Message Received</th>
              <th className="px-5 py-4 text-left font-semibold">Decrypted Message</th>
              <th className="px-5 py-4 text-left font-semibold">Receiver</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/40">
            {rows.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-5 py-12 text-center text-slate-400 font-medium bg-slate-900/10">
                  No transmissions logged yet. Start a chat or upload a file.
                </td>
              </tr>
            ) : (
              rows.map((r, index) => {
                const uniqueId = r.id || `${r.timestamp}-${index}`;
                const ciphertextsMatch = r.encrypted_message_sent === r.encrypted_message_received;
                const integrityFailed = r.integrity_status === "FAILED";

                return (
                  <tr
                    key={uniqueId}
                    className={`${
                      index % 2 === 0 ? "bg-slate-900/10" : "bg-slate-800/10"
                    } hover:bg-blue-950/20 transition-colors duration-150`}
                  >
                    <td className="px-5 py-3 font-semibold text-slate-300">{r.sender}</td>
                    
                    <td className="px-5 py-3 text-slate-200 font-mono text-xs max-w-[220px]">
                      {renderTruncated(r.sent_message, 40, uniqueId, "sent_msg")}
                    </td>

                    <td className="px-5 py-3 font-mono text-xs text-slate-300">
                      {r.message_hash ? (
                        <div className="flex items-center">
                          <span>{r.message_hash.slice(0, 12)}...</span>
                          <CopyButton text={r.message_hash} />
                        </div>
                      ) : (
                        "-"
                      )}
                    </td>

                    <td className="px-5 py-3 font-mono text-xs text-slate-400 max-w-[260px]">
                      {r.encrypted_message_sent ? (
                        <div className="flex items-start">
                          <span className="flex-1">{renderTruncated(r.encrypted_message_sent, 30, uniqueId, "enc_sent")}</span>
                          <CopyButton text={r.encrypted_message_sent} />
                        </div>
                      ) : (
                        "-"
                      )}
                    </td>

                    <td className="px-5 py-3 font-mono text-xs max-w-[260px]">
                      {r.encrypted_message_received ? (
                        <div className="flex items-start">
                          <span className="flex-1 text-slate-400">
                            {renderTruncated(r.encrypted_message_received, 30, uniqueId, "enc_rec")}
                          </span>
                          <CopyButton text={r.encrypted_message_received} />
                        </div>
                      ) : (
                        "-"
                      )}
                      {r.encrypted_message_sent && r.encrypted_message_received && (
                        <div className="mt-1">
                          {ciphertextsMatch ? (
                            <span className="text-[10px] font-semibold text-emerald-400 bg-emerald-950/30 border border-emerald-500/20 px-1.5 py-0.5 rounded">
                              ✓ Intact
                            </span>
                          ) : (
                            <span className="text-[10px] font-semibold text-rose-400 bg-rose-950/30 border border-rose-500/20 px-1.5 py-0.5 rounded">
                              ⚠ Tampered
                            </span>
                          )}
                        </div>
                      )}
                    </td>

                    <td className="px-5 py-3 max-w-[220px]">
                      <div className="flex items-center">
                        <span
                          className={`font-mono text-xs ${
                            integrityFailed
                              ? "text-red-400 font-bold bg-red-950/20 border border-red-500/10 px-2 py-0.5 rounded"
                              : "text-emerald-400 font-medium"
                          }`}
                        >
                          {r.decrypted_message || r.message || "-"}
                        </span>
                      </div>
                    </td>

                    <td className="px-5 py-3 font-semibold text-slate-350">{r.receiver}</td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
