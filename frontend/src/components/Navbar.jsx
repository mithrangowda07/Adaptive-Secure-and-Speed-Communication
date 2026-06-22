import { useContext } from "react";
import { Link, useLocation } from "react-router-dom";
import { ThemeContext } from "../context/ThemeContext";

export default function Navbar({ user, onLogout }) {
  const location = useLocation();
  const { theme, toggleTheme } = useContext(ThemeContext);

  const getLinkClass = (path) => {
    const isActive = location.pathname === path;
    return `rounded px-3 py-2 font-medium transition ${
      isActive
        ? "bg-blue-600 text-white shadow-lg shadow-blue-500/20"
        : "bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white"
    }`;
  };

  return (
    <header className="glass mb-4 flex items-center justify-between rounded-2xl px-4 py-2 border border-slate-700/30">
      <div>
        <h1 className="text-[22px] font-bold text-blue-300 leading-tight">
          Adaptive Secure Communication System
        </h1>
        <p className="text-sm text-slate-350">Logged in as {user?.username}</p>
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
          onClick={toggleTheme}
          className="rounded-lg p-2 bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white transition duration-200"
          title={theme === "dark" ? "Switch to Light Mode" : "Switch to Dark Mode"}
        >
          {theme === "dark" ? (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707m0-12.728l.707.707m12.728 12.728l.707.707M12 8a4 4 0 100 8 4 4 0 000-8z" />
            </svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
            </svg>
          )}
        </button>
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
