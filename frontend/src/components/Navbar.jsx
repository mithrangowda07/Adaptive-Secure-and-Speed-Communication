import { Link, useLocation } from "react-router-dom";

export default function Navbar({ user, onLogout }) {
  const location = useLocation();

  const getLinkClass = (path) => {
    const isActive = location.pathname === path;
    return `rounded px-3 py-2 font-medium transition ${
      isActive
        ? "bg-blue-600 text-white shadow-lg shadow-blue-500/20"
        : "bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white"
    }`;
  };

  return (
    <header className="glass mb-4 flex items-center justify-between rounded-2xl px-4 py-3">
      <div>
        <h1 className="text-lg font-semibold text-blue-300">
          Adaptive Secure Communication System
        </h1>
        <p className="text-sm text-slate-300">Logged in as {user?.username}</p>
      </div>
      <nav className="flex items-center gap-3 text-sm">
        <Link to="/chat" className={getLinkClass("/chat")}>
          Chat
        </Link>
        <Link to="/analytics" className={getLinkClass("/analytics")}>
          Analytics
        </Link>
        <Link to="/transmission-log" className={getLinkClass("/transmission-log")}>
          Transmission Log
        </Link>
        <button
          onClick={onLogout}
          className="rounded bg-red-600 px-3 py-2 font-medium text-white transition hover:bg-red-500"
        >
          Logout
        </button>
      </nav>
    </header>
  );
}
