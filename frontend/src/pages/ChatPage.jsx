import { useContext, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import NetworkPanel from "../components/NetworkPanel";
import ChatBox from "../components/ChatBox";
import FileUpload from "../components/FileUpload";
import TransferStabilityCard from "../components/TransferStabilityCard";
import AlgorithmDecisionCard from "../components/AlgorithmDecisionCard";
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
      <div className="glass mb-4 rounded-2xl p-3 text-sm">
        Current Network Quality:{" "}
        <span className="font-semibold capitalize text-blue-300">{network.qos_status || "N/A"}</span>
      </div>
      <section className="grid grid-cols-1 gap-4 lg:grid-cols-12">
        <aside className="lg:col-span-4 xl:col-span-3">
          <NetworkPanel state={network} algorithm={algorithm} />
          <div className="mt-4">
            <TransferStabilityCard rows={messages} />
          </div>
          <AlgorithmDecisionCard security={security} algorithm={algorithm} />
        </aside>
        <section className="lg:col-span-8 xl:col-span-9">
          {integrityAlert && (
            <div className="mb-3 rounded-2xl border-2 border-red-400 bg-red-950/70 p-3 text-sm font-semibold text-red-100 shadow-[0_0_20px_rgba(248,113,113,.35)] animate-pulse">
              ⚠ {integrityAlert}
            </div>
          )}
          <ChatBox messages={messages} user={user} />
          <div className="mt-4 flex items-center gap-3">
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
              className="flex-1 rounded-2xl border border-slate-700 bg-slate-900/85 p-4 text-base outline-none transition focus:border-blue-500"
            />
            <FileUpload receiver={receiver} onUploaded={(analytics) => setMessages((p) => [analytics, ...p])} />
            <button
              onClick={sendMessage}
              className="rounded-2xl bg-blue-600 px-6 py-3 text-sm font-semibold transition hover:bg-blue-500"
            >
              Send
            </button>
          </div>
        </section>
      </section>
    </main>
  );
}
