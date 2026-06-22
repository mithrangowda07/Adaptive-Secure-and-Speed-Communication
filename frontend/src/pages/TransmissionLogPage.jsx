import { useContext, useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import TransmissionLogTable from "../components/TransmissionLogTable";
import TransmissionSummaryKpis from "../components/TransmissionSummaryKpis";
import TransmissionSecurityInsights from "../components/TransmissionSecurityInsights";
import socket from "../socket/socket";
import api from "../services/api";
import { AuthContext } from "../context/AuthContext";

export default function TransmissionLogPage() {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const [rows, setRows] = useState([]);

  // Filter States
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedAlgorithm, setSelectedAlgorithm] = useState("all");
  const [selectedIntegrity, setSelectedIntegrity] = useState("all");
  const [selectedDateRange, setSelectedDateRange] = useState("all");

  useEffect(() => {
    if (!user) {
      navigate("/");
      return;
    }
    
    api.get("/analytics").then(({ data }) => {
      setRows(data.rows || []);
    });

    socket.on("analytics_update", (list) => setRows(list));
    return () => {
      socket.off("analytics_update");
    };
  }, [user, navigate]);

  // Unique algorithms from data
  const uniqueAlgorithms = useMemo(() => {
    const algs = new Set(rows.map(r => r.encryption_algorithm).filter(Boolean));
    return Array.from(algs);
  }, [rows]);

  // Filter Logic
  const filteredRows = useMemo(() => {
    return rows.filter(r => {
      // 1. Search Query Match
      const matchesSearch = 
        !searchQuery ||
        r.sender?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.receiver?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.sent_message?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.decrypted_message?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.message_hash?.toLowerCase().includes(searchQuery.toLowerCase());

      // 2. Algorithm Match
      const matchesAlgorithm =
        selectedAlgorithm === "all" ||
        r.encryption_algorithm === selectedAlgorithm;

      // 3. Integrity Match
      const isIntact = r.encrypted_message_sent === r.encrypted_message_received && r.integrity_status !== "FAILED";
      const matchesIntegrity =
        selectedIntegrity === "all" ||
        (selectedIntegrity === "intact" && isIntact) ||
        (selectedIntegrity === "tampered" && !isIntact);

      // 4. Date Range Match
      let matchesDate = true;
      if (selectedDateRange !== "all") {
        const now = new Date();
        const rowTime = new Date(r.timestamp);
        const diffMs = now - rowTime;
        const diffHours = diffMs / (1000 * 60 * 60);

        if (selectedDateRange === "hour") {
          matchesDate = diffHours <= 1;
        } else if (selectedDateRange === "day") {
          matchesDate = diffHours <= 24;
        } else if (selectedDateRange === "today") {
          const startOfToday = new Date();
          startOfToday.setHours(0, 0, 0, 0);
          matchesDate = rowTime >= startOfToday;
        }
      }

      return matchesSearch && matchesAlgorithm && matchesIntegrity && matchesDate;
    });
  }, [rows, searchQuery, selectedAlgorithm, selectedIntegrity, selectedDateRange]);

  // Export CSV
  const handleExportCSV = () => {
    if (filteredRows.length === 0) return;
    const headers = [
      "ID",
      "Timestamp",
      "Sender",
      "Receiver",
      "Plaintext Payload",
      "Cipher Algorithm",
      "Integrity State",
      "SHA-256 Hash",
      "Ciphertext Sent",
      "Ciphertext Received",
      "Decrypted Plaintext",
      "Security Score",
      "Risk Level"
    ];
    const csvContent = [
      headers.join(","),
      ...filteredRows.map(r => [
        r.id || "",
        new Date(r.timestamp).toISOString(),
        r.sender || "",
        r.receiver || "",
        (r.sent_message || "").replace(/"/g, '""'),
        r.encryption_algorithm || "",
        r.encrypted_message_sent === r.encrypted_message_received && r.integrity_status !== "FAILED" ? "INTACT" : "TAMPERED",
        r.message_hash || "",
        (r.encrypted_message_sent || "").replace(/"/g, '""'),
        (r.encrypted_message_received || "").replace(/"/g, '""'),
        (r.decrypted_message || "").replace(/"/g, '""'),
        r.security_score || "",
        r.risk_level || ""
      ].map(field => `"${field}"`).join(","))
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `transmission_logs_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Export JSON
  const handleExportJSON = () => {
    if (filteredRows.length === 0) return;
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(filteredRows, null, 2));
    const link = document.createElement("a");
    link.setAttribute("href", dataStr);
    link.setAttribute("download", `transmission_logs_${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <main className="min-h-screen p-4 max-w-7xl mx-auto">
      <Navbar user={user} onLogout={() => { logout(); navigate("/"); }} />
      
      {/* Title Header Section */}
      <div className="mb-5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div>
          <h2 className="text-2xl font-bold text-blue-300">Cryptographic Transmission Lifecycle</h2>
          <p className="text-xs text-slate-450 mt-1">
            Real-time tracking of message plaintext, hashes, sender/receiver ciphertexts, and decryption results
          </p>
        </div>
        
        {/* Animated Live Badge */}
        <div className="flex items-center gap-2 self-end sm:self-auto bg-slate-900/40 border border-slate-700/30 rounded-full px-3 py-1 shadow-inner animate-pulse">
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-450 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
          </span>
          <span className="text-[10px] font-black tracking-wider uppercase text-emerald-500 dark:text-emerald-400">
            Live Monitoring Active
          </span>
        </div>
      </div>

      {/* KPI Cards Summary */}
      <TransmissionSummaryKpis rows={rows} />

      {/* Search and Filters Bar */}
      <div className="glass rounded-2xl p-4 mb-5 border border-slate-700/30 flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 w-full md:w-auto flex-1 max-w-4xl">
          {/* Search Input */}
          <div className="relative">
            <input
              type="text"
              placeholder="Search sender, receiver, message, hash..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-[42px] bg-white dark:bg-slate-800/10 border border-slate-300 dark:border-slate-700/50 rounded-xl px-3 text-xs text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500/50 shadow-sm"
            />
          </div>

          {/* Algorithm Filter */}
          <div>
            <select
              value={selectedAlgorithm}
              onChange={(e) => setSelectedAlgorithm(e.target.value)}
              className="w-full h-[42px] bg-white dark:bg-slate-800/10 border border-slate-300 dark:border-slate-700/50 rounded-xl px-3 text-xs text-slate-800 dark:text-slate-350 focus:outline-none focus:ring-1 focus:ring-blue-500/50 shadow-sm"
            >
              <option value="all">All Algorithms</option>
              {uniqueAlgorithms.map(alg => (
                <option key={alg} value={alg}>{alg}</option>
              ))}
            </select>
          </div>

          {/* Integrity Filter */}
          <div>
            <select
              value={selectedIntegrity}
              onChange={(e) => setSelectedIntegrity(e.target.value)}
              className="w-full h-[42px] bg-white dark:bg-slate-800/10 border border-slate-300 dark:border-slate-700/50 rounded-xl px-3 text-xs text-slate-800 dark:text-slate-350 focus:outline-none focus:ring-1 focus:ring-blue-500/50 shadow-sm"
            >
              <option value="all">All Integrity</option>
              <option value="intact">🟢 Intact Only</option>
              <option value="tampered">🔴 Tampered Only</option>
            </select>
          </div>

          {/* Date Filter */}
          <div>
            <select
              value={selectedDateRange}
              onChange={(e) => setSelectedDateRange(e.target.value)}
              className="w-full h-[42px] bg-white dark:bg-slate-800/10 border border-slate-300 dark:border-slate-700/50 rounded-xl px-3 text-xs text-slate-800 dark:text-slate-350 focus:outline-none focus:ring-1 focus:ring-blue-500/50 shadow-sm"
            >
              <option value="all">All Time</option>
              <option value="hour">Last Hour</option>
              <option value="day">Last 24 Hours</option>
              <option value="today">Today</option>
            </select>
          </div>
        </div>

        {/* Export Buttons */}
        <div className="flex items-center gap-2.5 w-full md:w-auto justify-end">
          <button
            onClick={handleExportCSV}
            disabled={filteredRows.length === 0}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-xl bg-blue-600 text-white hover:bg-blue-500 transition duration-200 shadow-md shadow-blue-600/15 disabled:opacity-40 disabled:pointer-events-none"
          >
            <span>📥 Export CSV</span>
          </button>
          <button
            onClick={handleExportJSON}
            disabled={filteredRows.length === 0}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-xl bg-slate-800 text-slate-200 hover:bg-slate-700 border border-slate-700/50 transition duration-200 disabled:opacity-40 disabled:pointer-events-none"
          >
            <span>📄 Export JSON</span>
          </button>
        </div>
      </div>

      {/* Transmission Table */}
      <TransmissionLogTable rows={filteredRows} />

      {/* Bottom Insights Summary */}
      <TransmissionSecurityInsights rows={rows} />
    </main>
  );
}
