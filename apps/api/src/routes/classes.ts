import { Router } from "express"
import { z } from "zod"
import { supabase, Role } from "../lib/db.js"
import { requireAuth, requireRole, type AuthRequest } from "../middleware/auth.js"
import { createAuditLog } from "../lib/audit.js"

const router = Router()

const classSchema = z.object({
  nome: z.string().min(1),
  curso: z.string().min(1),
  courseId: z.string().or(z.literal("")).optional(),
  horario: z.string().min(1),
  diasSemana: z.array(z.string()),
  professor: z.string().min(1),
  professorId: z.string().or(z.literal("")).optional(),
  capacidade: z.number().int().positive(),
  sala: z.string().min(1),
  status: z.enum(["ativa", "inativa"]),
})

// GET /classes - List all classes
router.get("/", requireAuth, async (req: AuthRequest, res) => {
  let query = supabase.from("classes").select("*").order("created_at", { ascending: false })

  if (req.user!.role === Role.TEACHER) {
    query = query.eq("professor_id", req.user!.sub)
  }

  const { data: classesList, error } = await query
  if (error || !classesList) {
    return res.json({ classes: [] })
  }

  const classes = classesList.map((c: any) => ({
    id: c.id,
    nome: c.nome,
    curso: c.curso,
    courseId: c.course_id || c.courseId || "",
    horario: c.horario,
    diasSemana: c.dias_semana || c.diasSemana || [],
    professor: c.professor,
    professorId: c.professor_id || c.professorId || "",
    capacidade: c.capacidade,
    alunosMatriculados: c.alunos_matriculados || c.alunosMatriculados || 0,
    sala: c.sala,
    status: c.status,
    createdAt: c.created_at,
  }))

  return res.json({ classes })
})

// POST /classes - Create class
router.post("/", requireAuth, requireRole(Role.DIRECTOR, Role.COORDINATOR), async (req: AuthRequest, res) => {
  const data = classSchema.parse(req.body)
  const id = crypto.randomUUID()

  const row = {
    id,
    nome: data.nome,
    curso: data.curso,
    course_id: data.courseId || null,
    horario: data.horario,
    dias_semana: data.diasSemana,
    professor: data.professor,
    professor_id: data.professorId || null,
    capacidade: data.capacidade,
    alunos_matriculados: 0,
    sala: data.sala,
    status: data.status,
    created_at: new Date().toISOString()
  }

  const { error } = await supabase.from("classes").insert(row)
  if (error) {
    return res.status(400).json({ error: error.message })
  }

  const turma = {
    id,
    ...data,
    alunosMatriculados: 0,
    createdAt: row.created_at
  }

  await createAuditLog(
    req.user!.sub,
    "CREATE",
    "class",
    `Criou a turma ${data.nome} para o curso ${data.curso}`,
    id
  )

  return res.status(201).json({ class: turma })
})

// PUT /classes/:id - Update class
router.put("/:id", requireAuth, requireRole(Role.DIRECTOR, Role.COORDINATOR), async (req: AuthRequest, res) => {
  const { id } = req.params
  const data = classSchema.partial().parse(req.body)

  const updateRow: any = {}
  if (data.nome !== undefined) updateRow.nome = data.nome
  if (data.curso !== undefined) updateRow.curso = data.curso
  if (data.courseId !== undefined) updateRow.course_id = data.courseId
  if (data.horario !== undefined) updateRow.horario = data.horario
  if (data.diasSemana !== undefined) updateRow.dias_semana = data.diasSemana
  if (data.professor !== undefined) updateRow.professor = data.professor
  if (data.professorId !== undefined) updateRow.professor_id = data.professorId
  if (data.capacidade !== undefined) updateRow.capacidade = data.capacidade
  if (data.sala !== undefined) updateRow.sala = data.sala
  if (data.status !== undefined) updateRow.status = data.status

  await supabase.from("classes").update(updateRow).eq("id", id)

  const { data: updatedClass } = await supabase.from("classes").select("nome").eq("id", id).single()
  const name = updatedClass ? updatedClass.nome : "Desconhecido"

  await createAuditLog(
    req.user!.sub,
    "UPDATE",
    "class",
    `Atualizou a turma ${name}`,
    id
  )

  return res.json({ success: true })
})

// DELETE /classes/:id - Delete class
router.delete("/:id", requireAuth, requireRole(Role.DIRECTOR, Role.COORDINATOR), async (req: AuthRequest, res) => {
  const { id } = req.params
  const { data: existingClass } = await supabase.from("classes").select("nome").eq("id", id).single()
  const name = existingClass ? existingClass.nome : "Desconhecido"

  await supabase.from("classes").delete().eq("id", id)
  await supabase.from("attendances").delete().eq("class_id", id)
  await supabase.from("lessons").delete().eq("class_id", id)
  await supabase.from("events").delete().eq("class_id", id)

  await createAuditLog(
    req.user!.sub,
    "DELETE",
    "class",
    `Excluiu a turma ${name}`,
    id
  )

  return res.json({ success: true })
})

export const classesRouter = router
