import { Router } from "express"
import { z } from "zod"
import bcrypt from "bcryptjs"
import { prisma } from "../lib/db"
import { requireAuth, requireRole } from "../middleware/auth"
import { Role } from "@prisma/client"

const router = Router()

const permissionEnum = z.enum([
  "alunos",
  "turmas",
  "presenca",
  "plano_aula",
  "calendario",
  "comunicacao",
])

const createTeacherSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  password: z.string().min(6),
  permissions: z.array(permissionEnum).optional(),
})

router.get("/teachers", requireAuth, requireRole(Role.DIRECTOR), async (_req, res) => {
  const teachers = await prisma.user.findMany({
    where: { role: Role.TEACHER },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      name: true,
      email: true,
      permissions: true,
      createdAt: true,
    },
  })

  return res.json({ teachers })
})

router.post("/teachers", requireAuth, requireRole(Role.DIRECTOR), async (req, res) => {
  const data = createTeacherSchema.parse(req.body)

  const existing = await prisma.user.findUnique({
    where: { email: data.email },
  })

  if (existing) {
    return res.status(409).json({ error: "Email already in use" })
  }

  const passwordHash = await bcrypt.hash(data.password, 10)
  const permissions = data.permissions ?? []

  const user = await prisma.user.create({
    data: {
      name: data.name,
      email: data.email,
      passwordHash,
      role: Role.TEACHER,
      permissions,
    },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      permissions: true,
      createdAt: true,
    },
  })

  return res.status(201).json({ user })
})

export const usersRouter = router
