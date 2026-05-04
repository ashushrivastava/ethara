import { Router } from "express";
import { prisma } from "../db.js";
import { getProjectMembership, requireAdmin } from "../lib/projectAccess.js";
import { createTaskSchema, parseBody, updateTaskSchema } from "../validation/schemas.js";

export const tasksRouter = Router({ mergeParams: true });

function parseDueDate(iso: string | null | undefined): Date | null | undefined {
  if (iso === undefined) return undefined;
  if (iso === null) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return undefined;
  return d;
}

tasksRouter.get("/", async (req, res) => {
  const userId = req.user!.id;
  const { projectId } = req.params as { projectId: string };
  const access = await getProjectMembership(userId, projectId);
  if (!access) {
    res.status(404).json({ error: "Project not found" });
    return;
  }
  const tasks = await prisma.task.findMany({
    where: { projectId },
    include: {
      assignee: { select: { id: true, name: true, email: true } },
      createdBy: { select: { id: true, name: true, email: true } },
    },
    orderBy: [{ dueDate: "asc" }, { createdAt: "desc" }],
  });
  res.json({ tasks });
});

tasksRouter.post("/", async (req, res) => {
  const userId = req.user!.id;
  const { projectId } = req.params as { projectId: string };
  const access = await getProjectMembership(userId, projectId);
  if (!access) {
    res.status(404).json({ error: "Project not found" });
    return;
  }
  const parsed = parseBody(createTaskSchema, req.body);
  if (!parsed.ok) {
    res.status(400).json({ error: parsed.error });
    return;
  }
  const { title, description, status, dueDate, assigneeEmail } = parsed.data;
  let assigneeId: string | null = null;
  if (assigneeEmail) {
    if (!requireAdmin(access.membership.role)) {
      res.status(403).json({ error: "Only admins can assign tasks to others" });
      return;
    }
    const assignee = await prisma.user.findUnique({
      where: { email: assigneeEmail.toLowerCase() },
    });
    if (!assignee) {
      res.status(404).json({ error: "Assignee not found" });
      return;
    }
    const inProject = await prisma.projectMember.findFirst({
      where: { projectId, userId: assignee.id },
    });
    if (!inProject) {
      res.status(400).json({ error: "Assignee must be a project member" });
      return;
    }
    assigneeId = assignee.id;
  }
  const due = parseDueDate(dueDate ?? undefined);
  if (dueDate !== undefined && dueDate !== null && due === undefined) {
    res.status(400).json({ error: "Invalid dueDate" });
    return;
  }
  const task = await prisma.task.create({
    data: {
      title,
      description: description ?? null,
      status: status ?? "TODO",
      dueDate: due ?? null,
      projectId,
      assigneeId,
      createdById: userId,
    },
    include: {
      assignee: { select: { id: true, name: true, email: true } },
      createdBy: { select: { id: true, name: true, email: true } },
    },
  });
  res.status(201).json({ task });
});

tasksRouter.patch("/:taskId", async (req, res) => {
  const userId = req.user!.id;
  const { projectId, taskId } = req.params as { projectId: string; taskId: string };
  const access = await getProjectMembership(userId, projectId);
  if (!access) {
    res.status(404).json({ error: "Project not found" });
    return;
  }
  const task = await prisma.task.findFirst({
    where: { id: taskId, projectId },
  });
  if (!task) {
    res.status(404).json({ error: "Task not found" });
    return;
  }
  const isAdmin = requireAdmin(access.membership.role);
  const isAssignee = task.assigneeId === userId;
  const isCreator = task.createdById === userId;
  if (!isAdmin && !isAssignee && !isCreator) {
    res.status(403).json({ error: "You can only edit tasks you created, are assigned to, or if you are admin" });
    return;
  }
  const parsed = parseBody(updateTaskSchema, req.body);
  if (!parsed.ok) {
    res.status(400).json({ error: parsed.error });
    return;
  }
  const body = parsed.data;
  if (Object.keys(body).length === 0) {
    res.status(400).json({ error: "No fields to update" });
    return;
  }
  if (body.assigneeEmail !== undefined && !isAdmin) {
    res.status(403).json({ error: "Only admins can change assignee" });
    return;
  }
  if (
    (body.title !== undefined || body.description !== undefined) &&
    !isAdmin &&
    !isCreator
  ) {
    res.status(403).json({ error: "Only the creator or an admin can change title or description" });
    return;
  }
  let assigneeId: string | null | undefined = undefined;
  if (body.assigneeEmail !== undefined) {
    if (body.assigneeEmail === null) {
      assigneeId = null;
    } else {
      const assignee = await prisma.user.findUnique({
        where: { email: body.assigneeEmail.toLowerCase() },
      });
      if (!assignee) {
        res.status(404).json({ error: "Assignee not found" });
        return;
      }
      const inProject = await prisma.projectMember.findFirst({
        where: { projectId, userId: assignee.id },
      });
      if (!inProject) {
        res.status(400).json({ error: "Assignee must be a project member" });
        return;
      }
      assigneeId = assignee.id;
    }
  }
  const due = parseDueDate(body.dueDate);
  if (body.dueDate !== undefined && body.dueDate !== null && due === undefined) {
    res.status(400).json({ error: "Invalid dueDate" });
    return;
  }
  const dueUpdate =
    body.dueDate === undefined ? {} : { dueDate: due === undefined ? task.dueDate : due };
  const updated = await prisma.task.update({
    where: { id: task.id },
    data: {
      ...(body.title !== undefined && { title: body.title }),
      ...(body.description !== undefined && { description: body.description }),
      ...(body.status !== undefined && { status: body.status }),
      ...dueUpdate,
      ...(assigneeId !== undefined && { assigneeId }),
    },
    include: {
      assignee: { select: { id: true, name: true, email: true } },
      createdBy: { select: { id: true, name: true, email: true } },
    },
  });
  res.json({ task: updated });
});

tasksRouter.delete("/:taskId", async (req, res) => {
  const userId = req.user!.id;
  const { projectId, taskId } = req.params as { projectId: string; taskId: string };
  const access = await getProjectMembership(userId, projectId);
  if (!access) {
    res.status(404).json({ error: "Project not found" });
    return;
  }
  const task = await prisma.task.findFirst({
    where: { id: taskId, projectId },
  });
  if (!task) {
    res.status(404).json({ error: "Task not found" });
    return;
  }
  const isAdmin = requireAdmin(access.membership.role);
  if (!isAdmin && task.createdById !== userId) {
    res.status(403).json({ error: "Only the task creator or an admin can delete this task" });
    return;
  }
  await prisma.task.delete({ where: { id: task.id } });
  res.status(204).send();
});
