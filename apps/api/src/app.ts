import express from "express"
import cors from "cors"
import type { NextFunction, Request, Response } from "express"
import { ZodError } from "zod"
import { authRouter } from "./routes/auth"
import { announcementsRouter } from "./routes/announcements"
import { usersRouter } from "./routes/users"
import { env } from "./lib/env"

export const app = express()

const corsOrigins = env.CORS_ORIGIN
  ? env.CORS_ORIGIN.split(",").map((origin) => origin.trim())
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
