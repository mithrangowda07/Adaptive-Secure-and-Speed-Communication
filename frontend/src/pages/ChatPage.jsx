import { useContext, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import NetworkPanel from "../components/NetworkPanel";
import ChatBox from "../components/ChatBox";
import FileUpload from "../components/FileUpload";
import TransferStabilityCard from "../components/TransferStabilityCard";
import AlgorithmDecisionCard from "../components/AlgorithmDecisionCard";
import KpiCards from "../components/KpiCards";
import socket from "../socket/socket";
import { AuthContext } from "../context/AuthContext";
import api from "../services/api";

export default function ChatPage() {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([]);
  const [network, setNetwork] = useState({
    mode: "normal",
    latency: 20,
    bandwidth: 30,
    packet_loss: 0.5,
    jitter: 5,
    throughput: 25,
    connection_stability: 90,
    response_time: 40,
    error_rate: 0.2,
    qos_score: 80,
    qos_status: "Good"
  });
  const [algorithm, setAlgorithm] = useState({ currentAlgorithm: "ECC", previousAlgorithm: "ECC" });
  const [security, setSecurity] = useState({
    securityScore: 82,
    riskLevel: "LOW RISK",
    integrityStatus: "VERIFIED",
    keyId: 1,
    algorithmReason: "Good network and strong security",
    performanceLevel: "GOOD",
    securityParams: null
  });
  const [integrityAlert, setIntegrityAlert] = useState("");
  const receiver = user?.username === "device1" ? "device2" : "device1";

  useEffect(() => {
    if (!user) navigate("/");
  }, [user, navigate]);

  useEffect(() => {
    if (!user) return;
    api.get("/analytics").then(({ data }) => {
      setMessages(data.rows || []);
      if (data.currentAlgorithm) {
        setAlgorithm((prev) => ({ ...prev, currentAlgorithm: data.currentAlgorithm }));
      }
      if (data.rows?.length) {
        const latest = data.rows[0];
        setSecurity((prev) => ({
          ...prev,
          securityScore: latest.security_score || prev.securityScore,
          riskLevel: latest.risk_level || prev.riskLevel,
          integrityStatus: latest.integrity_status || prev.integrityStatus,
          keyId: latest.key_id || prev.keyId,
          algorithmReason: latest.algorithm_reason || prev.algorithmReason
        }));
      }
    });
    api.get("/network/state").then(({ data }) => setNetwork(data.state));
  }, [user]);

  useEffect(() => {
    socket.on("receive_message", (payload) => {
      setMessages((prev) => [payload, ...prev].slice(0, 200));
    });
    socket.on("network_update", (state) => setNetwork(state));
    socket.on("algorithm_update", (state) => {
      setAlgorithm(state);
    });
    socket.on("security_update", (payload) => setSecurity(payload));
    socket.on("integrity_alert", (payload) => {
      setIntegrityAlert(payload.message || "WARNING: Message Integrity Compromised");
      setTimeout(() => setIntegrityAlert(""), 5000);
    });
    socket.on("key_rotation", (payload) => {
      setSecurity((prev) => ({ ...prev, keyId: payload.keyId || prev.keyId }));
    });
    return () => {
      socket.off("receive_message");
      socket.off("network_update");
      socket.off("algorithm_update");
      socket.off("security_update");
      socket.off("integrity_alert");
      socket.off("key_rotation");
    };
  }, []);

  function sendMessage() {
    if (!message.trim()) return;
    socket.emit("send_message", {
      sender: user.username,
      receiver,
      message
    });
    setMessage("");
  }

  return (
    <main className="min-h-screen p-4">
      <Navbar user={user} onLogout={() => { logout(); navigate("/"); }} />
      <KpiCards network={network} algorithm={algorithm} />
      <section className="flex flex-col lg:flex-row gap-4 h-[calc(100vh-140px)]">
        <aside className="w-full lg:w-[28%] flex-shrink-0 flex flex-col gap-4 overflow-y-auto pr-1">
          <NetworkPanel state={network} algorithm={algorithm} security={security} />
          <div>
            <TransferStabilityCard rows={messages} />
          </div>
          <AlgorithmDecisionCard security={security} algorithm={algorithm} />
        </aside>
        <section className="w-full lg:w-[72%] flex flex-col h-full relative">
          {integrityAlert && (
            <div className="mb-3 rounded-2xl border-2 border-red-400 bg-red-950/70 p-3 text-sm font-semibold text-red-100 shadow-[0_0_20px_rgba(248,113,113,.35)] animate-pulse">
              ⚠ {integrityAlert}
            </div>
          )}
          <div className="flex-1 overflow-y-auto mb-4 pb-2">
            <ChatBox messages={messages} user={user} />
          </div>
          <div className="sticky bottom-0 glass rounded-2xl p-2 flex items-center gap-2 border border-slate-700/30 focus-within:ring-2 focus-within:ring-blue-500/40 focus-within:border-blue-500/50 transition-all duration-300 shadow-[0_-2px_10px_rgba(0,0,0,0.08)] light:bg-white z-10">
            {/* Encryption Icon / Status */}
            <div className="pl-3 text-slate-400 select-none flex items-center gap-1.5" title="Encrypted Channel Active">
              <span className="text-sm">🔒</span>
              <span className="hidden sm:inline text-[9px] font-bold text-emerald-500 bg-emerald-500/10 border border-emerald-500/20 px-1.5 py-0.5 rounded tracking-widest uppercase">Secure</span>
            </div>
            
            {/* Message Input */}
            <input
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  sendMessage();
                }
              }}
              placeholder="Type secure message..."
              className="flex-1 bg-transparent py-2.5 px-2 text-sm md:text-base text-slate-100 placeholder-slate-400 outline-none border-none focus:ring-0 focus:outline-none"
            />
            
            {/* Attachment Button */}
            <FileUpload receiver={receiver} onUploaded={(analytics) => setMessages((p) => [analytics, ...p])} />
            
            {/* Send Button */}
            <button
              onClick={sendMessage}
              className="rounded-xl bg-blue-600 px-5 py-2.5 text-xs md:text-sm font-semibold text-white hover:bg-blue-500 shadow-md transition duration-200"
            >
              Send
            </button>
          </div>
        </section>
      </section>
    </main>
  );
}
