import { Router } from "express";
import { prisma } from "../db.js";
import { getProjectMembership, requireAdmin } from "../lib/projectAccess.js";
import { addMemberSchema, parseBody, updateMemberRoleSchema } from "../validation/schemas.js";

export const membersRouter = Router({ mergeParams: true });

membersRouter.get("/", async (req, res) => {
  const userId = req.user!.id;
  const { projectId } = req.params as { projectId: string };
  const access = await getProjectMembership(userId, projectId);
  if (!access) {
    res.status(404).json({ error: "Project not found" });
    return;
  }
  const members = await prisma.projectMember.findMany({
    where: { projectId },
    include: { user: { select: { id: true, name: true, email: true } } },
    orderBy: { joinedAt: "asc" },
  });
  res.json({ members });
});

membersRouter.post("/", async (req, res) => {
  const userId = req.user!.id;
  const { projectId } = req.params as { projectId: string };
  const access = await getProjectMembership(userId, projectId);
  if (!access) {
    res.status(404).json({ error: "Project not found" });
    return;
  }
  if (!requireAdmin(access.membership.role)) {
    res.status(403).json({ error: "Admin role required to add members" });
    return;
  }
  const parsed = parseBody(addMemberSchema, req.body);
  if (!parsed.ok) {
    res.status(400).json({ error: parsed.error });
    return;
  }
  const email = parsed.data.email.toLowerCase();
  const role = parsed.data.role;
  const target = await prisma.user.findUnique({ where: { email } });
  if (!target) {
    res.status(404).json({ error: "No user with that email" });
    return;
  }
  try {
    const member = await prisma.projectMember.create({
      data: { projectId, userId: target.id, role },
      include: { user: { select: { id: true, name: true, email: true } } },
    });
    res.status(201).json({ member });
  } catch {
    res.status(409).json({ error: "User is already a member of this project" });
  }
});

membersRouter.patch("/:memberId", async (req, res) => {
  const userId = req.user!.id;
  const { projectId, memberId } = req.params as { projectId: string; memberId: string };
  const access = await getProjectMembership(userId, projectId);
  if (!access) {
    res.status(404).json({ error: "Project not found" });
    return;
  }
  if (!requireAdmin(access.membership.role)) {
    res.status(403).json({ error: "Admin role required" });
    return;
  }
  const parsed = parseBody(updateMemberRoleSchema, req.body);
  if (!parsed.ok) {
    res.status(400).json({ error: parsed.error });
    return;
  }
  const member = await prisma.projectMember.findFirst({
    where: { id: memberId, projectId },
    include: { user: { select: { id: true, email: true } } },
  });
  if (!member) {
    res.status(404).json({ error: "Member not found" });
    return;
  }
  if (parsed.data.role === "MEMBER" && member.role === "ADMIN") {
    const adminCount = await prisma.projectMember.count({
      where: { projectId, role: "ADMIN" },
    });
    if (adminCount <= 1) {
      res.status(400).json({ error: "Project must have at least one admin" });
      return;
    }
  }
  const updated = await prisma.projectMember.update({
    where: { id: member.id },
    data: { role: parsed.data.role },
    include: { user: { select: { id: true, name: true, email: true } } },
  });
  res.json({ member: updated });
});

membersRouter.delete("/:memberId", async (req, res) => {
  const userId = req.user!.id;
  const { projectId, memberId } = req.params as { projectId: string; memberId: string };
  const access = await getProjectMembership(userId, projectId);
  if (!access) {
    res.status(404).json({ error: "Project not found" });
    return;
  }
  if (!requireAdmin(access.membership.role)) {
    res.status(403).json({ error: "Admin role required" });
    return;
  }
  const member = await prisma.projectMember.findFirst({
    where: { id: memberId, projectId },
  });
  if (!member) {
    res.status(404).json({ error: "Member not found" });
    return;
  }
  if (member.role === "ADMIN") {
    const adminCount = await prisma.projectMember.count({
      where: { projectId, role: "ADMIN" },
    });
    if (adminCount <= 1) {
      res.status(400).json({ error: "Cannot remove the only admin" });
      return;
    }
  }
  await prisma.projectMember.delete({ where: { id: member.id } });
  res.status(204).send();
});
