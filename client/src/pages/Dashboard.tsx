import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api";

type DashboardData = {
  summary: {
    projectCount: number;
    totalTasks: number;
    byStatus: { TODO: number; IN_PROGRESS: number; DONE: number };
    overdueCount: number;
    myOpenAssigned: number;
  };
  recentTasks: Array<{
    id: string;
    title: string;
    status: string;
    dueDate: string | null;
    overdue: boolean;
    project: { id: string; name: string };
    assignee: { id: string; name: string; email: string } | null;
  }>;
};

export function Dashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const r = await api<DashboardData>("/api/dashboard");
        if (!cancelled) setData(r);
      } catch (e) {
        if (!cancelled) setErr(e instanceof Error ? e.message : "Failed to load");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  if (err) return <p className="text-danger">{err}</p>;
  if (!data) return <p className="text-slate-400">Loading dashboard…</p>;

  const { summary, recentTasks } = data;

  const stat = (label: string, value: number | string, tone?: "warn" | "accent") => (
    <div
      className={`rounded-xl border border-border bg-surface-2/60 px-4 py-3 ${
        tone === "warn" && value !== 0 ? "border-warn/40" : ""
      } ${tone === "accent" ? "border-accent/30" : ""}`}
    >
      <p className="text-xs uppercase tracking-wide text-slate-500">{label}</p>
      <p
        className={`mt-1 text-2xl font-semibold tabular-nums ${
          tone === "warn" && Number(value) > 0 ? "text-warn" : "text-white"
        }`}
      >
        {value}
      </p>
    </div>
  );

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-lg font-semibold text-white">Overview</h2>
        <p className="text-sm text-slate-400">Tasks across every project you belong to.</p>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {stat("Projects", summary.projectCount)}
        {stat("Total tasks", summary.totalTasks)}
        {stat("Overdue (open)", summary.overdueCount, "warn")}
        {stat("Assigned to you (open)", summary.myOpenAssigned, "accent")}
      </div>
      <div className="rounded-xl border border-border bg-surface-2/40 p-4">
        <h3 className="text-sm font-medium text-slate-300">By status</h3>
        <div className="mt-3 flex flex-wrap gap-4 text-sm">
          <span className="rounded-full bg-slate-600/40 px-3 py-1 text-slate-200">
            To do: <strong>{summary.byStatus.TODO}</strong>
          </span>
          <span className="rounded-full bg-blue-500/20 px-3 py-1 text-blue-200">
            In progress: <strong>{summary.byStatus.IN_PROGRESS}</strong>
          </span>
          <span className="rounded-full bg-emerald-500/20 px-3 py-1 text-emerald-200">
            Done: <strong>{summary.byStatus.DONE}</strong>
          </span>
        </div>
      </div>
      <div>
        <h3 className="text-sm font-medium text-slate-300">Recent activity</h3>
        {recentTasks.length === 0 ? (
          <p className="mt-3 text-sm text-slate-500">No tasks yet. Open a project to add work items.</p>
        ) : (
          <ul className="mt-3 divide-y divide-border rounded-xl border border-border bg-surface-2/40">
            {recentTasks.map((t) => (
              <li key={t.id} className="flex flex-col gap-1 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <Link
                    to={`/projects/${t.project.id}`}
                    className="font-mono text-[10px] uppercase tracking-wider text-accent hover:underline"
                  >
                    {t.project.name}
                  </Link>
                  <p className="font-medium text-white">{t.title}</p>
                  <p className="text-xs text-slate-500">
                    {t.assignee ? `Assigned: ${t.assignee.name}` : "Unassigned"} · {t.status.replace("_", " ")}
                  </p>
                </div>
                <div className="text-right text-xs">
                  {t.dueDate && (
                    <span className={t.overdue ? "font-medium text-warn" : "text-slate-400"}>
                      Due {new Date(t.dueDate).toLocaleDateString()}
                      {t.overdue ? " · overdue" : ""}
                    </span>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
