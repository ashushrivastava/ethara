import { useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export function Login() {
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setErr(null);
    setPending(true);
    try {
      await login(email.trim(), password);
    } catch (ex) {
      setErr(ex instanceof Error ? ex.message : "Login failed");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="flex flex-1 flex-col items-center justify-center px-4 py-16">
      <div className="w-full max-w-md rounded-2xl border border-white/10 bg-surface-2/90 p-8 shadow-2xl shadow-magenta/10 backdrop-blur">
        <h1 className="text-xl font-semibold text-white">Sign in</h1>
        <p className="mt-1 text-sm text-zinc-400">Use your workspace account.</p>
        <form className="mt-6 space-y-4" onSubmit={onSubmit}>
          <label className="block">
            <span className="text-xs font-medium uppercase tracking-wide text-zinc-500">Email</span>
            <input
              type="email"
              required
              autoComplete="email"
              className="mt-1 w-full rounded-lg border border-white/10 bg-void px-3 py-2 text-white outline-none focus:border-magenta focus:ring-2 focus:ring-magenta/30"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </label>
          <label className="block">
            <span className="text-xs font-medium uppercase tracking-wide text-zinc-500">Password</span>
            <input
              type="password"
              required
              autoComplete="current-password"
              className="mt-1 w-full rounded-lg border border-white/10 bg-void px-3 py-2 text-white outline-none focus:border-magenta focus:ring-2 focus:ring-magenta/30"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </label>
          {err && <p className="text-sm text-danger">{err}</p>}
          <button
            type="submit"
            disabled={pending}
            className="w-full rounded-lg bg-magenta px-4 py-2.5 text-sm font-semibold text-white shadow-[0_0_20px_rgba(209,0,209,0.35)] hover:bg-magenta-bright disabled:opacity-50"
          >
            {pending ? "Signing in…" : "Sign in"}
          </button>
        </form>
        <p className="mt-6 text-center text-sm text-zinc-400">
          No account?{" "}
          <Link to="/register" className="font-medium text-magenta hover:underline">
            Create one
          </Link>
        </p>
      </div>
    </div>
  );
}
