import { Router } from "express"
import { z } from "zod"
import bcrypt from "bcryptjs"
import { prisma } from "../lib/db"
import { signToken } from "../lib/jwt"
import { requireAuth, type AuthRequest } from "../middleware/auth"
import type { Role } from "@prisma/client"

const router = Router()

const registerSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  password: z.string().min(6),
  role: z.enum(["DIRECTOR", "TEACHER"]).optional(),
})

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
})

router.post("/register", async (req, res) => {
  const data = registerSchema.parse(req.body)

  const existing = await prisma.user.findUnique({
    where: { email: data.email },
  })

  if (existing) {
    return res.status(409).json({ error: "Email already in use" })
  }

  if (data.role === "DIRECTOR") {
    const userCount = await prisma.user.count()
    if (userCount > 0) {
      return res.status(403).json({
        error: "Director role can only be assigned to the first user",
      })
    }
  }

  const passwordHash = await bcrypt.hash(data.password, 10)
  const role: Role = data.role ?? "TEACHER"

  const user = await prisma.user.create({
    data: {
      name: data.name,
      email: data.email,
      passwordHash,
      role,
    },
  })

  const token = signToken({ sub: user.id, email: user.email, role: user.role })

  return res.status(201).json({
    token,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      permissions: user.permissions,
    },
  })
})

router.post("/login", async (req, res) => {
  const data = loginSchema.parse(req.body)

  const user = await prisma.user.findUnique({
    where: { email: data.email },
  })

  if (!user) {
    return res.status(401).json({ error: "Invalid credentials" })
  }

  const valid = await bcrypt.compare(data.password, user.passwordHash)
  if (!valid) {
    return res.status(401).json({ error: "Invalid credentials" })
  }

  const token = signToken({ sub: user.id, email: user.email, role: user.role })

  return res.json({
    token,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      permissions: user.permissions,
    },
  })
})

router.get("/me", requireAuth, async (req: AuthRequest, res) => {
  const user = await prisma.user.findUnique({
    where: { id: req.user?.sub },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      permissions: true,
      createdAt: true,
    },
  })

  if (!user) {
    return res.status(404).json({ error: "User not found" })
  }

  return res.json({ user })
})

export const authRouter = router
