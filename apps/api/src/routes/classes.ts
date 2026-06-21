import { Router } from "express"
import { z } from "zod"
import { db, ObjectId, Role } from "../lib/db.js"
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
  const filter: any = {}
  if (req.user!.role === Role.TEACHER) {
    filter.professorId = req.user!.sub
  }

  const classesList = await db.collection("classes")
    .find(filter)
    .sort({ createdAt: -1 })
    .toArray()

  const classes = classesList.map((c: any) => ({
    id: c._id.toString(),
    nome: c.nome,
    curso: c.curso,
    courseId: c.courseId || "",
    horario: c.horario,
    diasSemana: c.diasSemana,
    professor: c.professor,
    professorId: c.professorId || "",
    capacidade: c.capacidade,
    alunosMatriculados: c.alunosMatriculados || 0,
    sala: c.sala,
    status: c.status,
    createdAt: c.createdAt,
  }))

  return res.json({ classes })
})

// POST /classes - Create class
router.post("/", requireAuth, requireRole(Role.DIRECTOR, Role.COORDINATOR), async (req: AuthRequest, res) => {
  const data = classSchema.parse(req.body)

  const newClass = {
    ...data,
    alunosMatriculados: 0,
    createdAt: new Date().toISOString().split("T")[0],
    updatedAt: new Date(),
  }

  const result = await db.collection("classes").insertOne(newClass)

  const turma = {
    id: result.insertedId.toString(),
    ...newClass,
  }

  await createAuditLog(
    req.user!.sub,
    "CREATE",
    "class",
    `Criou a turma ${newClass.nome} para o curso ${newClass.curso}`,
    turma.id
  )

  return res.status(201).json({ class: turma })
})

// PUT /classes/:id - Update class
router.put("/:id", requireAuth, requireRole(Role.DIRECTOR, Role.COORDINATOR), async (req: AuthRequest, res) => {
  const { id } = req.params
  const data = classSchema.partial().parse(req.body)

  const updateData = {
    ...data,
    updatedAt: new Date(),
  }

  await db.collection("classes").updateOne(
    { _id: new ObjectId(id) },
    { $set: updateData }
  )

  const updatedClass = await db.collection("classes").findOne({ _id: new ObjectId(id) })
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
  const existingClass = await db.collection("classes").findOne({ _id: new ObjectId(id) })
  const name = existingClass ? existingClass.nome : "Desconhecido"

  await db.collection("classes").deleteOne({ _id: new ObjectId(id) })
  
  // Clean up cascade: attendance and lessons use classId as string
  await db.collection("attendances").deleteMany({ classId: id })
  await db.collection("lessons").deleteMany({ classId: id })
  await db.collection("events").deleteMany({ turmaId: id })

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
