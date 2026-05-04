import { useEffect, useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { api } from "../api";

type ProjectRow = {
  id: string;
  name: string;
  description: string | null;
  myRole: "ADMIN" | "MEMBER" | null;
  memberCount: number;
  taskCount: number;
};

export function Projects() {
  const [projects, setProjects] = useState<ProjectRow[]>([]);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);

  async function load() {
    setErr(null);
    try {
      const r = await api<{ projects: ProjectRow[] }>("/api/projects");
      setProjects(r.projects);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  async function createProject(e: FormEvent) {
    e.preventDefault();
    setCreating(true);
    setErr(null);
    try {
      await api("/api/projects", {
        method: "POST",
        json: { name: name.trim(), description: description.trim() || null },
      });
      setName("");
      setDescription("");
      await load();
    } catch (ex) {
      setErr(ex instanceof Error ? ex.message : "Create failed");
    } finally {
      setCreating(false);
    }
  }

  if (loading) return <p className="text-slate-400">Loading projects…</p>;

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-lg font-semibold text-white">Projects</h2>
        <p className="text-sm text-slate-400">Create a project; you start as admin and can invite teammates by email.</p>
      </div>
      <form
        onSubmit={createProject}
        className="rounded-xl border border-border bg-surface-2/50 p-4 sm:flex sm:flex-wrap sm:items-end sm:gap-3"
      >
        <label className="block flex-1 min-w-[12rem]">
          <span className="text-xs font-medium text-slate-500">Name</span>
          <input
            required
            className="mt-1 w-full rounded-lg border border-border bg-surface px-3 py-2 text-white outline-none focus:border-accent focus:ring-1 focus:ring-accent"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Q2 launch"
          />
        </label>
        <label className="mt-3 block flex-[2] min-w-[14rem] sm:mt-0">
          <span className="text-xs font-medium text-slate-500">Description (optional)</span>
          <input
            className="mt-1 w-full rounded-lg border border-border bg-surface px-3 py-2 text-white outline-none focus:border-accent focus:ring-1 focus:ring-accent"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </label>
        <button
          type="submit"
          disabled={creating}
          className="mt-3 w-full rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-surface hover:bg-accent-dim disabled:opacity-50 sm:mt-0 sm:w-auto"
        >
          {creating ? "Creating…" : "New project"}
        </button>
      </form>
      {err && <p className="text-sm text-danger">{err}</p>}
      <ul className="space-y-2">
        {projects.length === 0 ? (
          <li className="rounded-xl border border-dashed border-border px-4 py-8 text-center text-slate-500">
            No projects yet. Add one above.
          </li>
        ) : (
          projects.map((p) => (
            <li key={p.id}>
              <Link
                to={`/projects/${p.id}`}
                className="flex flex-col gap-1 rounded-xl border border-border bg-surface-2/40 px-4 py-4 transition hover:border-accent/40 hover:bg-surface-2 sm:flex-row sm:items-center sm:justify-between"
              >
                <div>
                  <p className="font-medium text-white">{p.name}</p>
                  {p.description && <p className="text-sm text-slate-400 line-clamp-2">{p.description}</p>}
                </div>
                <div className="flex flex-wrap gap-2 text-xs text-slate-400">
                  <span className="rounded-md bg-white/5 px-2 py-1 font-mono uppercase">{p.myRole}</span>
                  <span>{p.memberCount} members</span>
                  <span>{p.taskCount} tasks</span>
                </div>
              </Link>
            </li>
          ))
        )}
      </ul>
    </div>
  );
}
