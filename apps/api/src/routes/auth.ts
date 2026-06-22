import { Router } from "express"
import { z } from "zod"
import bcrypt from "bcryptjs"
import { db, Role, ObjectId, ROLE_PERMISSIONS } from "../lib/db.js"
import { signToken } from "../lib/jwt.js"
import { requireAuth, type AuthRequest } from "../middleware/auth.js"

const router = Router()

const registerSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  password: z.string().min(6),
  role: z.nativeEnum(Role).optional(),
})

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
})

router.post("/register", async (req, res) => {
  const userCount = await db.collection("users").countDocuments()
  if (userCount > 0) {
    return res.status(403).json({
      error: "O registro público está desativado. Novos colaboradores devem ser cadastrados por um administrador.",
    })
  }

  const data = registerSchema.parse(req.body)

  const existing = await db.collection("users").findOne({ email: data.email })

  if (existing) {
    return res.status(409).json({ error: "Email already in use" })
  }

  const passwordHash = await bcrypt.hash(data.password, 10)
  const role = Role.DIRECTOR // O primeiro usuário obrigatoriamente é cadastrado como DIRECTOR


  const newUser = {
    name: data.name,
    email: data.email,
    passwordHash,
    role,
    permissions: ROLE_PERMISSIONS[role] || [],
    active: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  }

  const result = await db.collection("users").insertOne(newUser)
  const userIdStr = result.insertedId.toString()

  const token = signToken({ sub: userIdStr, email: newUser.email, role: newUser.role })

  return res.status(201).json({
    token,
    user: {
      id: userIdStr,
      name: newUser.name,
      email: newUser.email,
      role: newUser.role,
      permissions: ROLE_PERMISSIONS[newUser.role] || [],
      active: true,
    },
  })
})

router.post("/login", async (req, res) => {
  const data = loginSchema.parse(req.body)

  const userDoc = await db.collection("users").findOne({ email: data.email })

  if (!userDoc) {
    return res.status(401).json({ error: "Invalid credentials" })
  }

  if (userDoc.active === false) {
    return res.status(403).json({ error: "Sua conta está desativada. Entre em contato com a administração." })
  }

  const valid = await bcrypt.compare(data.password, userDoc.passwordHash)
  if (!valid) {
    return res.status(401).json({ error: "Invalid credentials" })
  }

  const userIdStr = userDoc._id.toString()
  const token = signToken({ sub: userIdStr, email: userDoc.email, role: userDoc.role })

  return res.json({
    token,
    user: {
      id: userIdStr,
      name: userDoc.name,
      email: userDoc.email,
      role: userDoc.role,
      permissions: ROLE_PERMISSIONS[userDoc.role as Role] || [],
      active: userDoc.active !== false,
    },
  })
})

router.get("/me", requireAuth, async (req: AuthRequest, res) => {
  let user = null

  if (req.user?.sub) {
    try {
      const userDoc = await db.collection("users").findOne({ _id: new ObjectId(req.user.sub) })
      if (userDoc) {
        if (userDoc.active === false) {
          return res.status(403).json({ error: "Sua conta está desativada" })
        }
        user = {
          id: userDoc._id.toString(),
          name: userDoc.name,
          email: userDoc.email,
          role: userDoc.role,
          permissions: ROLE_PERMISSIONS[userDoc.role as Role] || [],
          active: true,
          createdAt: userDoc.createdAt,
        }
      }
    } catch {
      // Invalid ObjectId format
    }
  }

  if (!user) {
    return res.status(404).json({ error: "User not found" })
  }

  return res.json({ user })
})

export const authRouter = router
