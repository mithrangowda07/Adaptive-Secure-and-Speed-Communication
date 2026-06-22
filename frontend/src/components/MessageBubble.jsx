export default function MessageBubble({ item, currentUser }) {
  const own = item.sender === currentUser?.username;
  const compromised = item.integrity_status === "FAILED";
  
  return (
    <div className={`my-3 flex ${own ? "justify-end" : "justify-start"} animate-[fadeIn_220ms_ease-out]`}>
      <div
        className={`max-w-[70%] rounded-[18px] px-3.5 py-2 text-sm transition-all ${
          compromised
            ? "border border-red-500 bg-red-900/35 text-red-100 shadow-[0_2px_5px_rgba(239,68,68,0.2)]"
            : own
              ? "bg-blue-600 text-white shadow-[0_2px_5px_rgba(0,0,0,0.08)]"
              : "bg-slate-200 text-slate-800 dark:bg-slate-700/85 dark:text-slate-100 shadow-[0_2px_5px_rgba(0,0,0,0.08)] dark:shadow-slate-950/5"
        }`}
      >
        {/* Header containing Sender info */}
        <div className="mb-1 text-[10px] font-bold tracking-wide opacity-75">
          {own ? "You" : item.sender}
        </div>

        {/* Content */}
        {item.file_name ? (
          <div className="py-1">
            <div className="font-bold flex items-center gap-1">
              <span>📎</span> 
              <span className="truncate max-w-[180px]">{item.file_name}</span>
            </div>
            <div className="text-[10px] opacity-75 mt-0.5">Size: {(item.file_size / 1024).toFixed(1)} KB</div>
          </div>
        ) : (
          <div className="leading-relaxed text-xs md:text-sm">{item.message}</div>
        )}

        {/* Unified compact footer containing metadata + timestamp */}
        <div className="mt-1.5 flex items-center justify-between gap-4 text-[9px] opacity-75 border-t border-slate-500/15 pt-1.5 font-mono">
          <span className="truncate max-w-[150px]">
            {item.encryption_algorithm} • K-{item.key_id || 1} • {item.integrity_status || "VERIFIED"}
          </span>
          <span className="shrink-0">
            {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
        </div>

        {compromised && (
          <div className="mt-1.5 rounded border border-red-400 bg-red-500/20 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-red-100 flex items-center gap-1">
            <span>⚠</span> Compromised
          </div>
        )}
      </div>
    </div>
  );
}
