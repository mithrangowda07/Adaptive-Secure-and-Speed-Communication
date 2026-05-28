export default function MessageBubble({ item, currentUser }) {
  const own = item.sender === currentUser?.username;
  return (
    <div className={`my-3 flex ${own ? "justify-end" : "justify-start"} animate-[fadeIn_220ms_ease-out]`}>
      <div
        className={`max-w-[78%] rounded-2xl px-4 py-3 text-sm shadow-lg ${
          own ? "bg-blue-600/90 text-white" : "bg-slate-700/85 text-slate-100"
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
        <div className="mt-2 text-[11px] opacity-75">
          {new Date(item.timestamp).toLocaleTimeString()}
        </div>
      </div>
    </div>
  );
}
