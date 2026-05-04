import type { ProjectRole } from "@prisma/client";

export type JwtPayload = { sub: string; email: string };

export type AuthedRequestUser = { id: string; email: string };

export type ProjectAccess = {
  membership: { id: string; role: ProjectRole };
};
