import { Router } from "express";
import { prisma } from "../db.js";
import { authRequired } from "../middleware/auth.js";
import { getProjectMembership, requireAdmin } from "../lib/projectAccess.js";
import { createProjectSchema, parseBody, updateProjectSchema } from "../validation/schemas.js";
import { membersRouter } from "./members.js";
import { tasksRouter } from "./tasks.js";

export const projectsRouter = Router();
projectsRouter.use(authRequired);

projectsRouter.get("/", async (req, res) => {
  const userId = req.user!.id;
  const projects = await prisma.project.findMany({
    where: { members: { some: { userId } } },
    include: {
      createdBy: { select: { id: true, name: true, email: true } },
      members: {
        include: { user: { select: { id: true, name: true, email: true } } },
      },
      _count: { select: { tasks: true } },
    },
    orderBy: { updatedAt: "desc" },
  });
  const withRole = projects.map((p) => {
    const mine = p.members.find((m) => m.userId === userId);
    return {
      id: p.id,
      name: p.name,
      description: p.description,
      createdAt: p.createdAt,
      updatedAt: p.updatedAt,
      createdBy: p.createdBy,
      myRole: mine?.role ?? null,
      memberCount: p.members.length,
      taskCount: p._count.tasks,
    };
  });
  res.json({ projects: withRole });
});

projectsRouter.post("/", async (req, res) => {
  const parsed = parseBody(createProjectSchema, req.body);
  if (!parsed.ok) {
    res.status(400).json({ error: parsed.error });
    return;
  }
  const userId = req.user!.id;
  const { name, description } = parsed.data;
  const project = await prisma.project.create({
    data: {
      name,
      description: description ?? null,
      createdById: userId,
      members: { create: { userId, role: "ADMIN" } },
    },
    include: {
      createdBy: { select: { id: true, name: true, email: true } },
      members: {
        include: { user: { select: { id: true, name: true, email: true } } },
      },
    },
  });
  res.status(201).json({ project });
});

projectsRouter.get("/:projectId", async (req, res) => {
  const userId = req.user!.id;
  const { projectId } = req.params;
  const access = await getProjectMembership(userId, projectId);
  if (!access) {
    res.status(404).json({ error: "Project not found" });
    return;
  }
  const project = await prisma.project.findUniqueOrThrow({
    where: { id: projectId },
    include: {
      createdBy: { select: { id: true, name: true, email: true } },
      members: {
        include: { user: { select: { id: true, name: true, email: true } } },
        orderBy: { joinedAt: "asc" },
      },
      tasks: {
        include: {
          assignee: { select: { id: true, name: true, email: true } },
          createdBy: { select: { id: true, name: true, email: true } },
        },
        orderBy: [{ dueDate: "asc" }, { createdAt: "desc" }],
      },
    },
  });
  res.json({
    project: {
      ...project,
      myRole: access.membership.role,
    },
  });
});

projectsRouter.patch("/:projectId", async (req, res) => {
  const userId = req.user!.id;
  const { projectId } = req.params;
  const access = await getProjectMembership(userId, projectId);
  if (!access) {
    res.status(404).json({ error: "Project not found" });
    return;
  }
  if (!requireAdmin(access.membership.role)) {
    res.status(403).json({ error: "Admin role required" });
    return;
  }
  const parsed = parseBody(updateProjectSchema, req.body);
  if (!parsed.ok) {
    res.status(400).json({ error: parsed.error });
    return;
  }
  const data = parsed.data;
  if (Object.keys(data).length === 0) {
    res.status(400).json({ error: "No fields to update" });
    return;
  }
  const project = await prisma.project.update({
    where: { id: projectId },
    data: {
      ...(data.name !== undefined && { name: data.name }),
      ...(data.description !== undefined && { description: data.description }),
    },
    include: {
      createdBy: { select: { id: true, name: true, email: true } },
      members: { include: { user: { select: { id: true, name: true, email: true } } } },
    },
  });
  res.json({ project });
});

projectsRouter.delete("/:projectId", async (req, res) => {
  const userId = req.user!.id;
  const { projectId } = req.params;
  const access = await getProjectMembership(userId, projectId);
  if (!access) {
    res.status(404).json({ error: "Project not found" });
    return;
  }
  if (!requireAdmin(access.membership.role)) {
    res.status(403).json({ error: "Admin role required" });
    return;
  }
  await prisma.project.delete({ where: { id: projectId } });
  res.status(204).send();
});

projectsRouter.use("/:projectId/members", membersRouter);
projectsRouter.use("/:projectId/tasks", tasksRouter);
