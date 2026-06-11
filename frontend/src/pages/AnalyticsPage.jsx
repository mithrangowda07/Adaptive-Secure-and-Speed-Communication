import { useContext, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import TimelineGraph from "../components/TimelineGraph";
import AlgorithmBarGraph from "../components/AlgorithmBarGraph";
import NetworkQualityTimelineGraph from "../components/NetworkQualityTimelineGraph";
import TransferTimeGraph from "../components/TransferTimeGraph";
import TransferStabilityCard from "../components/TransferStabilityCard";
import socket from "../socket/socket";
import api from "../services/api";
import { AuthContext } from "../context/AuthContext";

export default function AnalyticsPage() {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const [rows, setRows] = useState([]);

  useEffect(() => {
    if (!user) navigate("/");
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
      <section className="mt-4 grid grid-cols-1 gap-4 xl:grid-cols-3">
        <TimelineGraph rows={rows} />
        <AlgorithmBarGraph rows={rows} />
        <NetworkQualityTimelineGraph rows={rows} />
      </section>
      <section className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-4 animate-[fadeIn_0.5s_ease-out]">
        <div className="lg:col-span-3">
          <TransferTimeGraph rows={rows} />
        </div>
        <div className="lg:col-span-1">
          <TransferStabilityCard rows={rows} />
        </div>
      </section>
    </main>
  );
}
