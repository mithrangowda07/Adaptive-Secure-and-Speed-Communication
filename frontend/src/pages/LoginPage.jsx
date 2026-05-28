import { useContext, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import { AuthContext } from "../context/AuthContext";

export default function LoginPage() {
  const [form, setForm] = useState({ username: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();

  async function handleLogin(event) {
    event.preventDefault();
    setLoading(true);
    setError("");
    try {
      const { data } = await api.post("/login", form);
      login(data.token, data.user);
      navigate("/chat");
    } catch (err) {
      setError(err.response?.data?.message || "Login failed.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center p-4">
      <form onSubmit={handleLogin} className="glass w-full max-w-md rounded-3xl p-8">
        <h1 className="mb-2 text-center text-2xl font-bold text-blue-300">Adaptive Secure Communication System</h1>
        <p className="mb-6 text-center text-sm text-slate-300">Dynamic cryptographic algorithm switching based on network quality</p>
        <input className="mb-3 w-full rounded bg-slate-800 p-3" placeholder="Username" value={form.username} onChange={(e) => setForm((v) => ({ ...v, username: e.target.value }))} />
        <input className="mb-3 w-full rounded bg-slate-800 p-3" type="password" placeholder="Password" value={form.password} onChange={(e) => setForm((v) => ({ ...v, password: e.target.value }))} />
        {error && <p className="mb-3 text-sm text-red-400">{error}</p>}
        <button className="w-full rounded bg-blue-600 p-3 font-semibold hover:bg-blue-500" disabled={loading}>
          {loading ? "Logging in..." : "Login"}
        </button>
      </form>
    </main>
  );
}
