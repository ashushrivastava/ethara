import { NavLink, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { RESUME_URL } from "../config";

const navMuted = "text-sm text-zinc-400 transition hover:text-white";
const navActive = "text-sm font-medium text-magenta";

function Logo() {
  return (
    <Link to="/" className="group flex items-center gap-2.5">
      <span className="flex h-9 w-9 items-center justify-center rounded-full border border-white/15 bg-white/5 ring-1 ring-magenta/30 transition group-hover:ring-magenta/60">
        <span className="h-3 w-3 rounded-full bg-magenta shadow-[0_0_12px_rgba(209,0,209,0.7)]" />
      </span>
      <span className="text-[15px] font-semibold tracking-tight text-white">
        Ethara<span className="text-zinc-500">.AI</span>
      </span>
    </Link>
  );
}

export function Navbar() {
  const { user, loading, logout } = useAuth();

  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-void/85 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
        <Logo />
        <nav className="hidden items-center gap-6 md:flex" aria-label="Marketing">
          <a href={RESUME_URL} target="_blank" rel="noopener noreferrer" className={navMuted}>
            RLaaS
          </a>
          <a href={RESUME_URL} target="_blank" rel="noopener noreferrer" className={navMuted}>
            Research
          </a>
          <a href={RESUME_URL} target="_blank" rel="noopener noreferrer" className={navMuted}>
            OTS
          </a>
          <a href={RESUME_URL} target="_blank" rel="noopener noreferrer" className={navMuted}>
            Careers
          </a>
          <a href={RESUME_URL} target="_blank" rel="noopener noreferrer" className={navMuted}>
            Contact
          </a>
        </nav>
        <div className="flex items-center gap-2 sm:gap-3">
          {!loading && user ? (
            <>
              <NavLink to="/" end className={({ isActive }) => (isActive ? navActive : navMuted)}>
                Dashboard
              </NavLink>
              <NavLink to="/projects" className={({ isActive }) => (isActive ? navActive : navMuted)}>
                Projects
              </NavLink>
              <span className="hidden max-w-[8rem] truncate text-xs text-zinc-500 sm:inline" title={user.email}>
                {user.name}
              </span>
              <button
                type="button"
                onClick={logout}
                className="rounded-lg border border-white/15 bg-white/5 px-3 py-1.5 text-xs font-medium text-zinc-200 hover:border-magenta/50 hover:text-white"
              >
                Log out
              </button>
            </>
          ) : !loading ? (
            <>
              <NavLink to="/login" className={({ isActive }) => (isActive ? navActive : navMuted)}>
                Sign in
              </NavLink>
              <NavLink
                to="/register"
                className="rounded-lg bg-magenta px-3 py-1.5 text-xs font-semibold text-white shadow-[0_0_20px_rgba(209,0,209,0.35)] hover:bg-magenta-bright"
              >
                Get started
              </NavLink>
            </>
          ) : (
            <span className="text-xs text-zinc-500">…</span>
          )}
        </div>
      </div>
    </header>
  );
}
