import { Router } from "express"
import { z } from "zod"
import { db, ObjectId } from "../lib/db.js"
import { requireAuth } from "../middleware/auth.js"

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
router.get("/", requireAuth, async (_req, res) => {
  const classesList = await db.collection("classes")
    .find()
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
router.post("/", requireAuth, async (req, res) => {
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

  return res.status(201).json({ class: turma })
})

// PUT /classes/:id - Update class
router.put("/:id", requireAuth, async (req, res) => {
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

  return res.json({ success: true })
})

// DELETE /classes/:id - Delete class
router.delete("/:id", requireAuth, async (req, res) => {
  const { id } = req.params

  await db.collection("classes").deleteOne({ _id: new ObjectId(id) })
  
  // Clean up cascade: attendance and lessons use classId as string
  await db.collection("attendances").deleteMany({ classId: id })
  await db.collection("lessons").deleteMany({ classId: id })
  await db.collection("events").deleteMany({ turmaId: id })

  return res.json({ success: true })
})

export const classesRouter = router
