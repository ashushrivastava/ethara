import cors from "cors";
import express from "express";
import { prisma } from "./db.js";
import { authRouter } from "./routes/auth.js";
import { projectsRouter } from "./routes/projects.js";
import { dashboardRouter } from "./routes/dashboard.js";

const app = express();
const PORT = Number(process.env.PORT) || 4000;

app.use(cors({ origin: true, credentials: true }));
app.use(express.json());

app.get("/health", async (_req, res) => {
  try {
    const [users, projects, members, tasks] = await Promise.all([
      prisma.user.count(),
      prisma.project.count(),
      prisma.projectMember.count(),
      prisma.task.count(),
    ]);
    res.json({
      ok: true,
      db: { users, projects, members, tasks },
      env: {
        hasDatabaseUrl: Boolean(process.env.DATABASE_URL),
        cwd: process.cwd(),
      },
    });
  } catch (err) {
    console.error("Health DB check failed:", err);
    res.status(503).json({
      ok: false,
      error: err instanceof Error ? err.message : "Database unreachable",
      env: {
        hasDatabaseUrl: Boolean(process.env.DATABASE_URL),
        cwd: process.cwd(),
      },
    });
  }
});

app.use("/api/auth", authRouter);
app.use("/api/projects", projectsRouter);
app.use("/api/dashboard", dashboardRouter);

app.use((err: unknown, _req: express.Request, res: express.Response, next: express.NextFunction) => {
  const e = err as { type?: string; status?: number };
  if (e?.type === "entity.parse.failed") {
    res.status(400).json({ error: "Invalid JSON body" });
    return;
  }
  next(err);
});

app.use((err: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error(err);
  res.status(500).json({ error: "Internal server error" });
});

app.listen(PORT, () => {
  console.log(`API listening on http://localhost:${PORT}`);
});
