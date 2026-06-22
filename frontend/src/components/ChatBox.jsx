import { useEffect, useRef } from "react";
import MessageBubble from "./MessageBubble";

export default function ChatBox({ messages, user }) {
  const ref = useRef(null);
  const orderedMessages = messages.slice().reverse();

  useEffect(() => {
    if (ref.current) ref.current.scrollTop = ref.current.scrollHeight;
  }, [orderedMessages.length]);

  if (orderedMessages.length === 0) {
    return (
      <div className="glass h-[72vh] rounded-3xl p-5 shadow-xl flex flex-col justify-center items-center text-center select-none border border-slate-700/30">
        <div className="w-14 h-14 rounded-full bg-blue-500/10 border border-blue-500/20 flex items-center justify-center mb-4 text-2xl animate-pulse shadow-[0_0_15px_rgba(59,130,246,0.1)]">
          🔒
        </div>
        <h4 className="text-sm font-extrabold text-blue-300 tracking-wide uppercase">End-to-End Encrypted Channel Active</h4>
        <p className="text-xs text-slate-400 mt-2 max-w-xs leading-relaxed">
          Your messages and file transfers are secured dynamically. Switch network conditions to observe adaptive encryption.
        </p>
        <span className="text-[10px] font-bold text-slate-500 mt-6 tracking-widest uppercase border border-slate-700/25 px-3 py-1.5 rounded-full bg-slate-900/10 dark:bg-slate-850/20">
          Waiting for transmissions...
        </span>
      </div>
    );
  }

  const renderMessageList = () => {
    let lastDate = "";
    return orderedMessages.map((item, index) => {
      const msgDate = new Date(item.timestamp).toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
      
      const showDivider = msgDate !== lastDate;
      lastDate = msgDate;

      // Determine divider text (e.g. "Today" or "Yesterday")
      const todayStr = new Date().toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' });
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' });

      let dividerText = msgDate;
      if (msgDate === todayStr) dividerText = "Today";
      else if (msgDate === yesterdayStr) dividerText = "Yesterday";

      return (
        <div key={item.id || item.timestamp + item.sender + index}>
          {showDivider && (
            <div className="flex justify-center my-6 animate-[fadeIn_0.3s_ease-out]">
              <span className="text-[10px] font-bold text-slate-400 dark:text-slate-550 uppercase tracking-widest bg-slate-900/10 dark:bg-slate-800/35 border border-slate-700/20 px-3 py-1 rounded-full shadow-sm">
                {dividerText}
              </span>
            </div>
          )}
          <MessageBubble item={item} currentUser={user} />
        </div>
      );
    });
  };

  return (
    <div ref={ref} className="glass h-[72vh] overflow-y-auto rounded-3xl p-5 shadow-xl border border-slate-700/30">
      <div className="w-full space-y-1">
        {renderMessageList()}
      </div>
    </div>
  );
}
