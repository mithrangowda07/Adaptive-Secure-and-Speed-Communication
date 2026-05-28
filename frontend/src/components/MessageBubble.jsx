export default function MessageBubble({ item, currentUser }) {
  const own = item.sender === currentUser?.username;
  const compromised = item.integrity_status === "FAILED";
  return (
    <div className={`my-3 flex ${own ? "justify-end" : "justify-start"} animate-[fadeIn_220ms_ease-out]`}>
      <div
        className={`max-w-[78%] rounded-2xl px-4 py-3 text-sm shadow-lg ${
          compromised
            ? "border border-red-400 bg-red-900/35 text-red-100 shadow-red-950/80"
            : own
              ? "bg-blue-600/90 text-white"
              : "bg-slate-700/85 text-slate-100"
        }`}
      >
        <div className="mb-2 text-xs opacity-80">
          {item.sender} → {item.receiver}
        </div>
        {item.file_name ? (
          <div>
            <div className="font-semibold">File: {item.file_name}</div>
            <div className="text-xs">Size: {item.file_size} bytes</div>
          </div>
        ) : (
          <div className="leading-relaxed">{item.message}</div>
        )}
        <div className="mt-2 text-[11px] font-semibold opacity-90">
          {item.encryption_algorithm} | KEY-{item.key_id || 1} | {item.integrity_status || "VERIFIED"}
        </div>
        {compromised && (
          <div className="mt-2 rounded border border-red-400 bg-red-500/20 px-2 py-1 text-xs font-semibold">
            ⚠ WARNING: Message Integrity Compromised
          </div>
        )}
        <div className="mt-2 text-[11px] opacity-75">
          {new Date(item.timestamp).toLocaleTimeString()}
        </div>
      </div>
    </div>
  );
}
