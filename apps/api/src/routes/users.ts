import { Router } from "express"
import { z } from "zod"
import bcrypt from "bcryptjs"
import { supabase, Role, ROLE_PERMISSIONS } from "../lib/db.js"
import { requireAuth, requireRole, type AuthRequest } from "../middleware/auth.js"
import { createAuditLog } from "../lib/audit.js"

const router = Router()

const permissionEnum = z.enum([
  "alunos",
  "turmas",
  "presenca",
  "plano_aula",
  "calendario",
  "comunicacao",
  "notas",
])

const createTeacherSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  password: z.string().min(6),
  role: z.nativeEnum(Role).optional().default(Role.TEACHER),
  permissions: z.array(permissionEnum).optional(),
  cpf: z.string().or(z.literal("")).optional(),
  telefone: z.string().or(z.literal("")).optional(),
  dataNascimento: z.string().or(z.literal("")).optional(),
  endereco: z.string().or(z.literal("")).optional(),
})

const updateTeacherSchema = z.object({
  name: z.string().min(1).optional(),
  email: z.string().email().optional(),
  role: z.nativeEnum(Role).optional(),
  permissions: z.array(permissionEnum).optional(),
  active: z.boolean().optional(),
  cpf: z.string().or(z.literal("")).optional(),
  telefone: z.string().or(z.literal("")).optional(),
  dataNascimento: z.string().or(z.literal("")).optional(),
  endereco: z.string().or(z.literal("")).optional(),
})

const resetPasswordSchema = z.object({
  password: z.string().min(6),
})

const updateProfileSchema = z.object({
  name: z.string().min(1).optional(),
  email: z.string().email().optional(),
})

const changePasswordSchema = z.object({
  currentPassword: z.string().min(6),
  newPassword: z.string().min(6),
})

router.get("/teachers", requireAuth, requireRole(Role.DIRECTOR, Role.COORDINATOR), async (_req, res) => {
  const { data: teachersList, error } = await supabase
    .from("users")
    .select("*")
    .neq("role", Role.STUDENT)
    .order("created_at", { ascending: false })

  if (error || !teachersList) {
    return res.json({ teachers: [] })
  }

  const teachers = teachersList.map((t: any) => ({
    id: t.id,
    name: t.name,
    email: t.email,
    role: t.role || Role.TEACHER,
    permissions: ROLE_PERMISSIONS[t.role as Role] || [],
    active: t.active !== false,
    cpf: t.cpf || "",
    telefone: t.telefone || "",
    dataNascimento: t.data_nascimento || t.dataNascimento || "",
    endereco: t.endereco || "",
    createdAt: t.created_at,
  }))

  return res.json({ teachers })
})

router.post("/teachers", requireAuth, requireRole(Role.DIRECTOR), async (req: AuthRequest, res) => {
  const data = createTeacherSchema.parse(req.body)

  const { data: existing } = await supabase.from("users").select("id").eq("email", data.email).single()
  if (existing) {
    return res.status(409).json({ error: "Email already in use" })
  }

  const passwordHash = await bcrypt.hash(data.password, 10)
  const role = data.role ?? Role.TEACHER
  const permissions = ROLE_PERMISSIONS[role] || []
  const id = crypto.randomUUID()

  const row = {
    id,
    name: data.name,
    email: data.email,
    password: passwordHash,
    role,
    permissions,
    active: true,
    cpf: data.cpf || "",
    telefone: data.telefone || "",
    data_nascimento: data.dataNascimento || "",
    endereco: data.endereco || "",
    created_at: new Date().toISOString()
  }

  const { error } = await supabase.from("users").insert(row)
  if (error) {
    return res.status(400).json({ error: error.message })
  }

  const user = {
    id,
    name: data.name,
    email: data.email,
    role,
    permissions,
    active: true,
    cpf: data.cpf || "",
    telefone: data.telefone || "",
    dataNascimento: data.dataNascimento || "",
    endereco: data.endereco || "",
    createdAt: row.created_at,
  }

  await createAuditLog(
    req.user!.sub,
    "CREATE",
    "user",
    `Cadastrou o colaborador ${data.name} com o cargo ${role}`,
    id
  )

  return res.status(201).json({ user })
})

router.put("/teachers/:id", requireAuth, requireRole(Role.DIRECTOR), async (req: AuthRequest, res) => {
  const { id } = req.params
  const data = updateTeacherSchema.parse(req.body)

  const { data: existingUser } = await supabase.from("users").select("*").eq("id", id).single()
  if (!existingUser) {
    return res.status(404).json({ error: "Teacher not found" })
  }

  const finalRole = data.role ?? existingUser.role ?? Role.TEACHER
  const updateRow: any = {
    permissions: ROLE_PERMISSIONS[finalRole as Role] || [],
    updated_at: new Date().toISOString()
  }

  if (data.name !== undefined) updateRow.name = data.name
  if (data.email !== undefined) updateRow.email = data.email
  if (data.role !== undefined) updateRow.role = data.role
  if (data.active !== undefined) updateRow.active = data.active
  if (data.cpf !== undefined) updateRow.cpf = data.cpf
  if (data.telefone !== undefined) updateRow.telefone = data.telefone
  if (data.dataNascimento !== undefined) updateRow.data_nascimento = data.dataNascimento
  if (data.endereco !== undefined) updateRow.endereco = data.endereco

  await supabase.from("users").update(updateRow).eq("id", id)

  const { data: updatedUser } = await supabase.from("users").select("*").eq("id", id).single()
  if (!updatedUser) {
    return res.status(404).json({ error: "Teacher not found" })
  }

  await createAuditLog(
    req.user!.sub,
    "UPDATE",
    "user",
    `Atualizou o colaborador ${updatedUser.name} (cargo: ${updatedUser.role}, ativo: ${updatedUser.active !== false})`,
    id
  )

  return res.json({
    user: {
      id: updatedUser.id,
      name: updatedUser.name,
      email: updatedUser.email,
      role: updatedUser.role,
      permissions: ROLE_PERMISSIONS[updatedUser.role as Role] || [],
      active: updatedUser.active !== false,
      cpf: updatedUser.cpf || "",
      telefone: updatedUser.telefone || "",
      dataNascimento: updatedUser.data_nascimento || updatedUser.dataNascimento || "",
      endereco: updatedUser.endereco || "",
      createdAt: updatedUser.created_at,
    }
  })
})

router.delete("/teachers/:id", requireAuth, requireRole(Role.DIRECTOR), async (req: AuthRequest, res) => {
  const { id } = req.params
  const { data: existingUser } = await supabase.from("users").select("name").eq("id", id).single()
  const name = existingUser ? existingUser.name : "Desconhecido"

  await supabase.from("users").delete().eq("id", id)

  await createAuditLog(
    req.user!.sub,
    "DELETE",
    "user",
    `Excluiu o colaborador ${name}`,
    id
  )

  return res.json({ success: true })
})

router.post("/teachers/:id/reset-password", requireAuth, requireRole(Role.DIRECTOR), async (req: AuthRequest, res) => {
  const { id } = req.params
  const { data: existingUser } = await supabase.from("users").select("name").eq("id", id).single()
  const name = existingUser ? existingUser.name : "Desconhecido"

  const { password } = resetPasswordSchema.parse(req.body)
  const passwordHash = await bcrypt.hash(password, 10)

  await supabase.from("users").update({ password: passwordHash, updated_at: new Date().toISOString() }).eq("id", id)

  await createAuditLog(
    req.user!.sub,
    "RESET_PASSWORD",
    "user",
    `Redefiniu a senha do colaborador ${name}`,
    id
  )

  return res.json({ success: true })
})

router.put("/profile", requireAuth, async (req: AuthRequest, res) => {
  const data = updateProfileSchema.parse(req.body)
  const userId = req.user!.sub

  await supabase.from("users").update({ ...data, updated_at: new Date().toISOString() }).eq("id", userId)

  const { data: updatedUser } = await supabase.from("users").select("*").eq("id", userId).single()
  if (!updatedUser) {
    return res.status(404).json({ error: "User not found" })
  }

  return res.json({
    user: {
      id: updatedUser.id,
      name: updatedUser.name,
      email: updatedUser.email,
      role: updatedUser.role,
      permissions: ROLE_PERMISSIONS[updatedUser.role as Role] || [],
    }
  })
})

router.post("/change-password", requireAuth, async (req: AuthRequest, res) => {
  const { currentPassword, newPassword } = changePasswordSchema.parse(req.body)
  const userId = req.user!.sub

  const { data: userDoc } = await supabase.from("users").select("password").eq("id", userId).single()
  if (!userDoc) {
    return res.status(404).json({ error: "User not found" })
  }

  const valid = await bcrypt.compare(currentPassword, userDoc.password)
  if (!valid) {
    return res.status(400).json({ error: "Senha atual incorreta" })
  }

  const passwordHash = await bcrypt.hash(newPassword, 10)
  await supabase.from("users").update({ password: passwordHash, updated_at: new Date().toISOString() }).eq("id", userId)

  return res.json({ success: true })
})

export const usersRouter = router
