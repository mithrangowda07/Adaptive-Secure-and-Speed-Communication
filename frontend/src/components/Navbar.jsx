import { Link } from "react-router-dom";

export default function Navbar({ user, onLogout }) {
  return (
    <header className="glass mb-4 flex items-center justify-between rounded-2xl px-4 py-3">
      <div>
        <h1 className="text-lg font-semibold text-blue-300">
          Adaptive Secure Communication System
        </h1>
        <p className="text-sm text-slate-300">Logged in as {user?.username}</p>
      </div>
      <nav className="flex items-center gap-3 text-sm">
        <Link to="/chat" className="rounded bg-blue-600 px-3 py-2 hover:bg-blue-500">
          Chat
        </Link>
        <Link to="/analytics" className="rounded bg-slate-700 px-3 py-2 hover:bg-slate-600">
          Analytics
        </Link>
        <button onClick={onLogout} className="rounded bg-red-600 px-3 py-2 hover:bg-red-500">
          Logout
        </button>
      </nav>
    </header>
  );
}
