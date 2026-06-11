import { Navigate, Route, Routes } from "react-router-dom";
import LoginPage from "./pages/LoginPage";
import ChatPage from "./pages/ChatPage";
import AnalyticsPage from "./pages/AnalyticsPage";
import TransmissionLogPage from "./pages/TransmissionLogPage";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<LoginPage />} />
      <Route path="/chat" element={<ChatPage />} />
      <Route path="/analytics" element={<AnalyticsPage />} />
      <Route path="/transmission-log" element={<TransmissionLogPage />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
