import { useContext, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import TimelineGraph from "../components/TimelineGraph";
import AlgorithmBarGraph from "../components/AlgorithmBarGraph";
import EncryptedSizeBarGraph from "../components/EncryptedSizeBarGraph";
import NetworkQualityTimelineGraph from "../components/NetworkQualityTimelineGraph";
import TransferAnalyticsCard from "../components/TransferAnalyticsCard";
import AnalyticsKpis from "../components/AnalyticsKpis";
import AnalyticsInsights from "../components/AnalyticsInsights";
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
    <main className="min-h-screen p-4 max-w-7xl mx-auto">
      <Navbar user={user} onLogout={() => { logout(); navigate("/"); }} />
      
      {/* Executive Summary KPI Cards */}
      <AnalyticsKpis rows={rows} />

      {/* Main Chart Section: Network Quality Score Timeline */}
      <section className="mt-4 animate-[fadeIn_0.5s_ease-out]">
        <NetworkQualityTimelineGraph rows={rows} />
      </section>

      {/* Secondary Charts Grid (3 Columns) */}
      <section className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-3">
        <TimelineGraph rows={rows} />
        <AlgorithmBarGraph rows={rows} />
        <EncryptedSizeBarGraph rows={rows} />
      </section>

      {/* Messages Analytics Card */}
      <section className="mt-6 animate-[fadeIn_0.5s_ease-out]">
        <TransferAnalyticsCard 
          title="Message Transfer Analytics" 
          type="messages" 
          rows={rows} 
        />
      </section>

      {/* Files Analytics Card */}
      <section className="mt-6 animate-[fadeIn_0.5s_ease-out]">
        <TransferAnalyticsCard 
          title="File Transfer Analytics" 
          type="files" 
          rows={rows} 
        />
      </section>

      {/* Insights Panel */}
      <AnalyticsInsights rows={rows} />
    </main>
  );
}
