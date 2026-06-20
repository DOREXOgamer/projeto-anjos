import "express-async-errors"
import express from "express"
import cors from "cors"
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
import { env } from "./lib/env.js"

export const app = express()

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

app.get("/health", (_req, res) => {
  res.json({ ok: true })
})

app.use("/auth", authRouter)
app.use("/announcements", announcementsRouter)
app.use("/users", usersRouter)
app.use("/students", studentsRouter)
app.use("/classes", classesRouter)
app.use("/attendance", attendanceRouter)
app.use("/lessons", lessonsRouter)
app.use("/events", eventsRouter)
app.use("/stats", statsRouter)
app.use("/courses", coursesRouter)


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
