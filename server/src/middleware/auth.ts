import type { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import type { JwtPayload, AuthedRequestUser } from "../types.js";

declare global {
  namespace Express {
    interface Request {
      user?: AuthedRequestUser;
    }
  }
}

const JWT_SECRET: string = process.env.JWT_SECRET ?? "";
if (!JWT_SECRET) {
  throw new Error("JWT_SECRET is required");
}

export function signToken(user: { id: string; email: string }): string {
  return jwt.sign({ sub: user.id, email: user.email } satisfies JwtPayload, JWT_SECRET, {
    expiresIn: "7d",
  });
}

export function authRequired(req: Request, res: Response, next: NextFunction): void {
  const header = req.headers.authorization;
  const token = header?.startsWith("Bearer ") ? header.slice(7) : null;
  if (!token) {
    res.status(401).json({ error: "Missing bearer token" });
    return;
  }
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    if (typeof decoded !== "object" || decoded === null) {
      res.status(401).json({ error: "Invalid or expired token" });
      return;
    }
    const rec = decoded as Record<string, unknown>;
    const sub = typeof rec.sub === "string" ? rec.sub : null;
    const email = typeof rec.email === "string" ? rec.email : null;
    if (!sub || !email) {
      res.status(401).json({ error: "Invalid or expired token" });
      return;
    }
    req.user = { id: sub, email };
    next();
  } catch {
    res.status(401).json({ error: "Invalid or expired token" });
  }
}
