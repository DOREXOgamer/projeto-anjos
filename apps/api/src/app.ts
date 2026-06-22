import "express-async-errors"
import express from "express"
import cors from "cors"
import helmet from "helmet"
import { rateLimit } from "express-rate-limit"
import type { NextFunction, Request, Response } from "express"
import { ZodError } from "zod"
import { authRouter } from "./routes/auth.js"
import { announcementsRouter } from "./routes/announcements.js"
import { usersRouter } from "./routes/users.js"
import { studentsRouter } from "./routes/students.js"
import { classesRouter } from "./routes/classes.js"
import { attendanceRouter } from "./routes/attendance.js"
import { lessonsRouter } from "./routes/lessons.js"
import { eventsRouter } from "./routes/events.js"
import { statsRouter } from "./routes/stats.js"
import { coursesRouter } from "./routes/courses.js"
import { gradesRouter } from "./routes/grades.js"
import { auditRouter } from "./routes/audit.js"
import { env } from "./lib/env.js"

export const app = express()

// Configurar cabeçalhos HTTP de segurança via Helmet
app.use(helmet())

const corsOrigins = env.CORS_ORIGIN
  ? env.CORS_ORIGIN.split(",").map((origin: string) => origin.trim())
  : true

app.use(
  cors({
    origin: corsOrigins,
    credentials: true,
  }),
)

app.use(express.json())

// Rate Limiter Global
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  limit: 200, // limite de 200 requisições por IP a cada 15 minutos
  standardHeaders: "draft-7",
  legacyHeaders: false,
  message: { error: "Muitas requisições. Por favor, tente novamente mais tarde." },
})
app.use(globalLimiter)

// Rate Limiter específico para autenticação (Login/Registro)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  limit: 20, // limite de 20 requisições de autenticação por IP a cada 15 minutos
  standardHeaders: "draft-7",
  legacyHeaders: false,
  message: { error: "Muitas tentativas de acesso. Por favor, tente novamente mais tarde." },
})

app.get("/health", (_req, res) => {
  res.json({ ok: true })
})

app.use("/auth", authLimiter, authRouter)
app.use("/announcements", announcementsRouter)
app.use("/users", usersRouter)
app.use("/students", studentsRouter)
app.use("/classes", classesRouter)
app.use("/attendance", attendanceRouter)
app.use("/lessons", lessonsRouter)
app.use("/events", eventsRouter)
app.use("/stats", statsRouter)
app.use("/courses", coursesRouter)
app.use("/grades", gradesRouter)
app.use("/audit-logs", auditRouter)


app.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
  if (err instanceof ZodError) {
    return res.status(400).json({
      error: "Validation error",
      details: err.flatten(),
    })
  }

  console.error(err)
  res.status(500).json({ error: "Internal Server Error" })
})
