import type { ProjectRole } from "@prisma/client";
import { prisma } from "../db.js";
import type { ProjectAccess } from "../types.js";

export async function getProjectMembership(
  userId: string,
  projectId: string
): Promise<ProjectAccess | null> {
  const membership = await prisma.projectMember.findFirst({
    where: { userId, projectId },
    select: { id: true, role: true },
  });
  if (!membership) return null;
  return { membership };
}

export function requireAdmin(role: ProjectRole): boolean {
  return role === "ADMIN";
}
