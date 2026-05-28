import { useContext, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import AnalyticsTable from "../components/AnalyticsTable";
import TimelineGraph from "../components/TimelineGraph";
import AlgorithmBarGraph from "../components/AlgorithmBarGraph";
import SecurityScoreGraph from "../components/SecurityScoreGraph";
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
      <h2 className="mb-3 text-lg font-semibold text-blue-200">Detailed Communication Analytics</h2>
      <AnalyticsTable rows={rows} />
      <section className="mt-4 grid grid-cols-1 gap-4 xl:grid-cols-3">
        <TimelineGraph rows={rows} />
        <AlgorithmBarGraph rows={rows} />
        <SecurityScoreGraph rows={rows} />
      </section>
    </main>
  );
}
