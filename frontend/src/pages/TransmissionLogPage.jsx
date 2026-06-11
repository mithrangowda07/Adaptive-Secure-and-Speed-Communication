import { useContext, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import TransmissionLogTable from "../components/TransmissionLogTable";
import socket from "../socket/socket";
import api from "../services/api";
import { AuthContext } from "../context/AuthContext";

export default function TransmissionLogPage() {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const [rows, setRows] = useState([]);

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

  return (
    <main className="min-h-screen p-4">
      <Navbar user={user} onLogout={() => { logout(); navigate("/"); }} />
      <div className="mb-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div>
          <h2 className="text-xl font-bold text-blue-200">Cryptographic Transmission Lifecycle</h2>
          <p className="text-sm text-slate-400">
            Real-time tracking of message plaintext, hashes, sender/receiver ciphertexts, and decryption results
          </p>
        </div>
        <div className="flex items-center gap-2 self-end sm:self-auto">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-450 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          <span className="text-xs font-semibold text-emerald-400 bg-emerald-950/20 border border-emerald-500/10 px-2.5 py-1 rounded-full">
            Live Stream
          </span>
        </div>
      </div>
      <TransmissionLogTable rows={rows} />
    </main>
  );
}
