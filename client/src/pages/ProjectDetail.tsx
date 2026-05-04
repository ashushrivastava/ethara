import type { FormEvent } from "react";
import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { api } from "../api";

type Member = {
  id: string;
  role: "ADMIN" | "MEMBER";
  user: { id: string; name: string; email: string };
};

type Task = {
  id: string;
  title: string;
  description: string | null;
  status: "TODO" | "IN_PROGRESS" | "DONE";
  dueDate: string | null;
  assignee: { id: string; name: string; email: string } | null;
  createdBy: { id: string; name: string; email: string };
};

type ProjectPayload = {
  project: {
    id: string;
    name: string;
    description: string | null;
    myRole: "ADMIN" | "MEMBER";
    createdBy: { id: string; name: string; email: string };
    members: Member[];
    tasks: Task[];
  };
};

export function ProjectDetail() {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const [data, setData] = useState<ProjectPayload["project"] | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<"ADMIN" | "MEMBER">("MEMBER");
  const [taskTitle, setTaskTitle] = useState("");
  const [taskDue, setTaskDue] = useState("");
  const [taskAssignee, setTaskAssignee] = useState("");
  const [editName, setEditName] = useState("");
  const [editDesc, setEditDesc] = useState("");

  const load = useCallback(async () => {
    if (!projectId) return;
    setErr(null);
    try {
      const r = await api<ProjectPayload>(`/api/projects/${projectId}`);
      setData(r.project);
      setEditName(r.project.name);
      setEditDesc(r.project.description ?? "");
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Failed to load project");
      setData(null);
    }
  }, [projectId]);

  useEffect(() => {
    void load();
  }, [load]);

  const isAdmin = data?.myRole === "ADMIN";

  async function saveProject(e: FormEvent) {
    e.preventDefault();
    if (!projectId || !isAdmin) return;
    try {
      await api(`/api/projects/${projectId}`, {
        method: "PATCH",
        json: { name: editName.trim(), description: editDesc.trim() || null },
      });
      await load();
    } catch (ex) {
      setErr(ex instanceof Error ? ex.message : "Update failed");
    }
  }

  async function deleteProject() {
    if (!projectId || !isAdmin) return;
    if (!confirm("Delete this project and all tasks?")) return;
    try {
      await api(`/api/projects/${projectId}`, { method: "DELETE" });
      navigate("/projects");
    } catch (ex) {
      setErr(ex instanceof Error ? ex.message : "Delete failed");
    }
  }

  async function inviteMember(e: FormEvent) {
    e.preventDefault();
    if (!projectId || !isAdmin) return;
    try {
      await api(`/api/projects/${projectId}/members`, {
        method: "POST",
        json: { email: inviteEmail.trim(), role: inviteRole },
      });
      setInviteEmail("");
      await load();
    } catch (ex) {
      setErr(ex instanceof Error ? ex.message : "Invite failed");
    }
  }

  async function setMemberRole(memberId: string, role: "ADMIN" | "MEMBER") {
    if (!projectId) return;
    try {
      await api(`/api/projects/${projectId}/members/${memberId}`, {
        method: "PATCH",
        json: { role },
      });
      await load();
    } catch (ex) {
      setErr(ex instanceof Error ? ex.message : "Role update failed");
    }
  }

  async function removeMember(memberId: string) {
    if (!projectId) return;
    if (!confirm("Remove this member?")) return;
    try {
      await api(`/api/projects/${projectId}/members/${memberId}`, { method: "DELETE" });
      await load();
    } catch (ex) {
      setErr(ex instanceof Error ? ex.message : "Remove failed");
    }
  }

  async function addTask(e: FormEvent) {
    e.preventDefault();
    if (!projectId) return;
    const json: Record<string, unknown> = {
      title: taskTitle.trim(),
      dueDate: taskDue ? new Date(taskDue).toISOString() : null,
    };
    if (isAdmin && taskAssignee.trim()) {
      json.assigneeEmail = taskAssignee.trim();
    }
    try {
      await api(`/api/projects/${projectId}/tasks`, { method: "POST", json });
      setTaskTitle("");
      setTaskDue("");
      setTaskAssignee("");
      await load();
    } catch (ex) {
      setErr(ex instanceof Error ? ex.message : "Task create failed");
    }
  }

  async function patchTask(taskId: string, body: Record<string, unknown>) {
    if (!projectId) return;
    try {
      await api(`/api/projects/${projectId}/tasks/${taskId}`, { method: "PATCH", json: body });
      await load();
    } catch (ex) {
      setErr(ex instanceof Error ? ex.message : "Task update failed");
    }
  }

  async function deleteTask(taskId: string) {
    if (!projectId) return;
    if (!confirm("Delete this task?")) return;
    try {
      await api(`/api/projects/${projectId}/tasks/${taskId}`, { method: "DELETE" });
      await load();
    } catch (ex) {
      setErr(ex instanceof Error ? ex.message : "Delete failed");
    }
  }

  if (!projectId) return null;
  if (err && !data) return <p className="text-danger">{err}</p>;
  if (!data) return <p className="text-slate-400">Loading…</p>;

  const now = new Date();

  return (
    <div className="space-y-10">
      {err && <p className="rounded-lg border border-danger/40 bg-danger/10 px-3 py-2 text-sm text-danger">{err}</p>}
      <div className="flex flex-col gap-4 border-b border-border pb-6 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <Link to="/projects" className="text-sm text-accent hover:underline">
            ← All projects
          </Link>
          <h2 className="mt-2 text-2xl font-semibold text-white">{data.name}</h2>
          {data.description && <p className="mt-1 max-w-2xl text-slate-400">{data.description}</p>}
          <p className="mt-2 text-xs text-slate-500">
            Created by {data.createdBy.name} · Your role:{" "}
            <span className="font-mono text-accent">{data.myRole}</span>
          </p>
        </div>
        {isAdmin && (
          <button
            type="button"
            onClick={deleteProject}
            className="self-start rounded-lg border border-danger/50 px-3 py-1.5 text-sm text-danger hover:bg-danger/10"
          >
            Delete project
          </button>
        )}
      </div>

      {isAdmin && (
        <section className="rounded-xl border border-border bg-surface-2/40 p-4">
          <h3 className="text-sm font-medium text-white">Edit project</h3>
          <form className="mt-3 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end" onSubmit={saveProject}>
            <label className="block flex-1 min-w-[10rem]">
              <span className="text-xs text-slate-500">Name</span>
              <input
                className="mt-1 w-full rounded-lg border border-border bg-surface px-3 py-2 text-white"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
              />
            </label>
            <label className="block flex-[2] min-w-[14rem]">
              <span className="text-xs text-slate-500">Description</span>
              <input
                className="mt-1 w-full rounded-lg border border-border bg-surface px-3 py-2 text-white"
                value={editDesc}
                onChange={(e) => setEditDesc(e.target.value)}
              />
            </label>
            <button type="submit" className="rounded-lg bg-white/10 px-4 py-2 text-sm text-white hover:bg-white/15">
              Save
            </button>
          </form>
        </section>
      )}

      <section>
        <h3 className="text-sm font-medium text-white">Team</h3>
        {isAdmin && (
          <form className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-end" onSubmit={inviteMember}>
            <label className="block flex-1">
              <span className="text-xs text-slate-500">Invite by email</span>
              <input
                type="email"
                required
                className="mt-1 w-full rounded-lg border border-border bg-surface px-3 py-2 text-white"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                placeholder="colleague@company.com"
              />
            </label>
            <label className="block w-full sm:w-36">
              <span className="text-xs text-slate-500">Role</span>
              <select
                className="mt-1 w-full rounded-lg border border-border bg-surface px-3 py-2 text-white"
                value={inviteRole}
                onChange={(e) => setInviteRole(e.target.value as "ADMIN" | "MEMBER")}
              >
                <option value="MEMBER">Member</option>
                <option value="ADMIN">Admin</option>
              </select>
            </label>
            <button type="submit" className="rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-surface">
              Add member
            </button>
          </form>
        )}
        <ul className="mt-4 divide-y divide-border rounded-xl border border-border">
          {data.members.map((m) => (
            <li key={m.id} className="flex flex-col gap-2 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="font-medium text-white">{m.user.name}</p>
                <p className="text-xs text-slate-500">{m.user.email}</p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-md bg-white/5 px-2 py-1 font-mono text-xs uppercase text-slate-300">
                  {m.role}
                </span>
                {isAdmin && (
                  <>
                    <select
                      className="rounded-lg border border-border bg-surface px-2 py-1 text-xs text-white"
                      value={m.role}
                      onChange={(e) => void setMemberRole(m.id, e.target.value as "ADMIN" | "MEMBER")}
                    >
                      <option value="MEMBER">Member</option>
                      <option value="ADMIN">Admin</option>
                    </select>
                    <button
                      type="button"
                      onClick={() => void removeMember(m.id)}
                      className="text-xs text-danger hover:underline"
                    >
                      Remove
                    </button>
                  </>
                )}
              </div>
            </li>
          ))}
        </ul>
      </section>

      <section>
        <h3 className="text-sm font-medium text-white">Tasks</h3>
        <form className="mt-3 grid gap-3 rounded-xl border border-border bg-surface-2/40 p-4 sm:grid-cols-2 lg:grid-cols-4" onSubmit={addTask}>
          <label className="sm:col-span-2">
            <span className="text-xs text-slate-500">Title</span>
            <input
              required
              className="mt-1 w-full rounded-lg border border-border bg-surface px-3 py-2 text-white"
              value={taskTitle}
              onChange={(e) => setTaskTitle(e.target.value)}
            />
          </label>
          <label>
            <span className="text-xs text-slate-500">Due (optional)</span>
            <input
              type="datetime-local"
              className="mt-1 w-full rounded-lg border border-border bg-surface px-3 py-2 text-white"
              value={taskDue}
              onChange={(e) => setTaskDue(e.target.value)}
            />
          </label>
          {isAdmin ? (
            <label>
              <span className="text-xs text-slate-500">Assignee email (optional)</span>
              <input
                type="email"
                className="mt-1 w-full rounded-lg border border-border bg-surface px-3 py-2 text-white"
                value={taskAssignee}
                onChange={(e) => setTaskAssignee(e.target.value)}
                placeholder="member@…"
              />
            </label>
          ) : (
            <p className="self-end text-xs text-slate-500 sm:col-span-1">
              Members create unassigned tasks; admins assign.
            </p>
          )}
          <div className="flex items-end sm:col-span-2 lg:col-span-4">
            <button type="submit" className="rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-surface">
              Add task
            </button>
          </div>
        </form>

        <div className="mt-4 overflow-x-auto rounded-xl border border-border">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-surface-2/80 text-xs uppercase text-slate-500">
              <tr>
                <th className="px-4 py-2">Task</th>
                <th className="px-4 py-2">Status</th>
                <th className="px-4 py-2">Assignee</th>
                <th className="px-4 py-2">Due</th>
                <th className="px-4 py-2" />
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {data.tasks.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-6 text-center text-slate-500">
                    No tasks yet.
                  </td>
                </tr>
              ) : (
                data.tasks.map((t) => {
                  const overdue = t.status !== "DONE" && t.dueDate && new Date(t.dueDate) < now;
                  return (
                    <tr key={t.id} className="bg-surface/40">
                      <td className="px-4 py-3">
                        <p className="font-medium text-white">{t.title}</p>
                        {t.description && <p className="text-xs text-slate-500">{t.description}</p>}
                      </td>
                      <td className="px-4 py-3">
                        <select
                          className="rounded border border-border bg-surface px-2 py-1 text-xs text-white"
                          value={t.status}
                          onChange={(e) =>
                            void patchTask(t.id, { status: e.target.value as Task["status"] })
                          }
                        >
                          <option value="TODO">To do</option>
                          <option value="IN_PROGRESS">In progress</option>
                          <option value="DONE">Done</option>
                        </select>
                      </td>
                      <td className="px-4 py-3 text-slate-400">
                        {isAdmin ? (
                          <input
                            type="email"
                            defaultValue={t.assignee?.email ?? ""}
                            placeholder="Unassigned"
                            className="w-full min-w-[10rem] rounded border border-border bg-surface px-2 py-1 text-xs"
                            onBlur={(e) => {
                              const v = e.target.value.trim().toLowerCase();
                              const next = v === "" ? null : v;
                              const cur = t.assignee?.email?.toLowerCase() ?? null;
                              if (next === cur) return;
                              void patchTask(t.id, { assigneeEmail: next });
                            }}
                          />
                        ) : (
                          <span>{t.assignee?.name ?? "—"}</span>
                        )}
                      </td>
                      <td className={`px-4 py-3 text-xs ${overdue ? "font-medium text-warn" : "text-slate-400"}`}>
                        {t.dueDate ? new Date(t.dueDate).toLocaleString() : "—"}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          type="button"
                          onClick={() => void deleteTask(t.id)}
                          className="text-xs text-danger hover:underline"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
