import { Router } from "express"
import { z } from "zod"
import { db, ObjectId, Role } from "../lib/db.js"
import { requireAuth, requireRole, type AuthRequest } from "../middleware/auth.js"
import { createAuditLog } from "../lib/audit.js"

const router = Router()

const lessonSchema = z.object({
  data: z.string().min(1),
  endDate: z.string().or(z.literal("")).optional(),
  turma: z.string().min(1),
  classId: z.string().or(z.literal("")).optional(),
  disciplina: z.string().min(1),
  conteudo: z.string().min(1),
  observacoes: z.string().or(z.literal("")).optional(),
})

// GET /lessons - List all lesson plans
router.get("/", requireAuth, async (req: AuthRequest, res) => {
  const filter: any = {}
  if (req.user!.role === Role.TEACHER) {
    const teacherClasses = await db.collection("classes")
      .find({ professorId: req.user!.sub })
      .toArray()
    const classIds = teacherClasses.map(c => c._id.toString())
    filter.classId = { $in: classIds }
  }

  const lessonsList = await db.collection("lessons")
    .find(filter)
    .sort({ createdAt: -1 })
    .toArray()

  const lessons = lessonsList.map((l: any) => ({
    id: l._id.toString(),
    data: l.data,
    endDate: l.endDate || "",
    turma: l.turma,
    classId: l.classId || "",
    disciplina: l.disciplina,
    conteudo: l.conteudo,
    observacoes: l.observacoes || "",
    createdAt: l.createdAt,
  }))

  return res.json({ lessons })
})

// POST /lessons - Create lesson plan
router.post("/", requireAuth, requireRole(Role.DIRECTOR, Role.COORDINATOR, Role.TEACHER), async (req: AuthRequest, res) => {
  const data = lessonSchema.parse(req.body)

  const newLesson = {
    ...data,
    createdAt: new Date().toISOString().split("T")[0],
    updatedAt: new Date(),
  }

  const result = await db.collection("lessons").insertOne(newLesson)

  const lesson = {
    id: result.insertedId.toString(),
    ...newLesson,
  }

  await createAuditLog(
    req.user!.sub,
    "CREATE",
    "lesson",
    `Criou plano de aula para a turma ${newLesson.turma} (curso: ${newLesson.disciplina})`,
    lesson.id
  )

  return res.status(201).json({ lesson })
})

// PUT /lessons/:id - Update lesson plan
router.put("/:id", requireAuth, requireRole(Role.DIRECTOR, Role.COORDINATOR, Role.TEACHER), async (req: AuthRequest, res) => {
  const { id } = req.params
  const data = lessonSchema.partial().parse(req.body)

  const updateData = {
    ...data,
    updatedAt: new Date(),
  }

  await db.collection("lessons").updateOne(
    { _id: new ObjectId(id) },
    { $set: updateData }
  )

  const updatedLesson = await db.collection("lessons").findOne({ _id: new ObjectId(id) })
  const name = updatedLesson ? updatedLesson.turma : "Desconhecido"

  await createAuditLog(
    req.user!.sub,
    "UPDATE",
    "lesson",
    `Atualizou plano de aula da turma ${name}`,
    id
  )

  return res.json({ success: true })
})

// DELETE /lessons/:id - Delete lesson plan
router.delete("/:id", requireAuth, requireRole(Role.DIRECTOR, Role.COORDINATOR, Role.TEACHER), async (req: AuthRequest, res) => {
  const { id } = req.params
  const existingLesson = await db.collection("lessons").findOne({ _id: new ObjectId(id) })
  const name = existingLesson ? existingLesson.turma : "Desconhecido"

  await db.collection("lessons").deleteOne({ _id: new ObjectId(id) })

  await createAuditLog(
    req.user!.sub,
    "DELETE",
    "lesson",
    `Excluiu plano de aula da turma ${name}`,
    id
  )

  return res.json({ success: true })
})

export const lessonsRouter = router
