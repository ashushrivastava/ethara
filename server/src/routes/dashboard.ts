import { Router } from "express";
import { prisma } from "../db.js";
import { authRequired } from "../middleware/auth.js";

export const dashboardRouter = Router();
dashboardRouter.use(authRequired);

dashboardRouter.get("/", async (req, res) => {
  const userId = req.user!.id;
  const now = new Date();

  const projectIds = (
    await prisma.projectMember.findMany({
      where: { userId },
      select: { projectId: true },
    })
  ).map((m) => m.projectId);

  if (projectIds.length === 0) {
    res.json({
      summary: {
        projectCount: 0,
        totalTasks: 0,
        byStatus: { TODO: 0, IN_PROGRESS: 0, DONE: 0 },
        overdueCount: 0,
        myOpenAssigned: 0,
      },
      recentTasks: [],
    });
    return;
  }

  const tasks = await prisma.task.findMany({
    where: { projectId: { in: projectIds } },
    include: {
      project: { select: { id: true, name: true } },
      assignee: { select: { id: true, name: true, email: true } },
    },
  });

  const byStatus = { TODO: 0, IN_PROGRESS: 0, DONE: 0 };
  let overdueCount = 0;
  let myOpenAssigned = 0;

  for (const t of tasks) {
    byStatus[t.status]++;
    const open = t.status !== "DONE";
    if (open && t.dueDate && t.dueDate < now) overdueCount++;
    if (open && t.assigneeId === userId) myOpenAssigned++;
  }

  const recentTasks = [...tasks]
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
    .slice(0, 12)
    .map((t) => ({
      id: t.id,
      title: t.title,
      status: t.status,
      dueDate: t.dueDate,
      overdue: t.status !== "DONE" && t.dueDate !== null && t.dueDate < now,
      project: t.project,
      assignee: t.assignee,
    }));

  res.json({
    summary: {
      projectCount: projectIds.length,
      totalTasks: tasks.length,
      byStatus,
      overdueCount,
      myOpenAssigned,
    },
    recentTasks,
  });
});
