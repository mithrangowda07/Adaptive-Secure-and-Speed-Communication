import { useEffect, useRef } from "react";
import MessageBubble from "./MessageBubble";

export default function ChatBox({ messages, user }) {
  const ref = useRef(null);
  const orderedMessages = messages.slice().reverse();

  useEffect(() => {
    if (ref.current) ref.current.scrollTop = ref.current.scrollHeight;
  }, [orderedMessages.length]);

  return (
    <div ref={ref} className="glass h-[72vh] overflow-y-auto rounded-3xl p-5 shadow-xl shadow-slate-950/40">
      {orderedMessages.map((item) => (
        <MessageBubble key={item.id || item.timestamp + item.sender} item={item} currentUser={user} />
      ))}
    </div>
  );
}
