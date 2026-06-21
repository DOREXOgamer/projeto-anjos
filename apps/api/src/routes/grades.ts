import { Router } from "express"
import { z } from "zod"
import { db, ObjectId, Role } from "../lib/db.js"
import { requireAuth, requireRole, type AuthRequest } from "../middleware/auth.js"
import { createAuditLog } from "../lib/audit.js"

const router = Router()

const gradeSchema = z.object({
  studentId: z.string().min(1),
  classId: z.string().min(1),
  disciplina: z.string().min(1),
  tipo: z.enum(["prova", "trabalho", "participacao", "outro"]),
  nota: z.number().nonnegative(),
  notaMaxima: z.number().positive(),
  data: z.string().min(1),
  observacoes: z.string().optional().default(""),
})

// GET /grades - Get grades with filter (classId, studentId)
router.get("/", requireAuth, async (req: AuthRequest, res) => {
  const { classId, studentId } = req.query
  const filter: any = {}

  if (classId) {
    filter.classId = classId
  }
  if (studentId) {
    filter.studentId = studentId
  }

  if (req.user!.role === Role.TEACHER) {
    const teacherClasses = await db.collection("classes")
      .find({ professorId: req.user!.sub })
      .toArray()
    const classIds = teacherClasses.map(c => c._id.toString())
    
    if (classId) {
      if (!classIds.includes(classId as string)) {
        return res.json({ grades: [] })
      }
    } else {
      filter.classId = { $in: classIds }
    }
  }

  const gradesList = await db.collection("grades")
    .aggregate([
      { $match: filter },
      { $sort: { createdAt: -1 } },
      {
        $lookup: {
          from: "students",
          let: { studentIdObj: { $toObjectId: "$studentId" } },
          pipeline: [
            { $match: { $expr: { $eq: ["$_id", "$$studentIdObj"] } } }
          ],
          as: "studentInfo"
        }
      },
      {
        $unwind: {
          path: "$studentInfo",
          preserveNullAndEmptyArrays: true
        }
      }
    ])
    .toArray()

  const grades = gradesList.map((g: any) => ({
    id: g._id.toString(),
    studentId: g.studentId,
    studentName: g.studentInfo?.nome || "Aluno não encontrado",
    classId: g.classId,
    disciplina: g.disciplina,
    tipo: g.tipo,
    nota: g.nota,
    notaMaxima: g.notaMaxima,
    data: g.data,
    observacoes: g.observacoes || "",
    professorId: g.professorId || "",
    professor: g.professor || "",
    createdAt: g.createdAt,
  }))

  return res.json({ grades })
})

// POST /grades - Create grade
router.post("/", requireAuth, requireRole(Role.DIRECTOR, Role.COORDINATOR, Role.TEACHER), async (req: AuthRequest, res) => {
  const data = gradeSchema.parse(req.body)

  const professorId = req.user!.sub
  const user = await db.collection("users").findOne({ _id: new ObjectId(professorId) })
  const professorName = user ? user.name : "Desconhecido"

  const newGrade = {
    ...data,
    professorId,
    professor: professorName,
    createdAt: new Date().toISOString(),
  }

  const result = await db.collection("grades").insertOne(newGrade)

  const grade = {
    id: result.insertedId.toString(),
    ...newGrade,
  }

  try {
    const studentDoc = await db.collection("students").findOne({ _id: new ObjectId(newGrade.studentId) })
    const studentName = studentDoc ? studentDoc.nome : "Desconhecido"
    await createAuditLog(
      req.user!.sub,
      "CREATE",
      "grade",
      `Lançou nota ${newGrade.nota}/${newGrade.notaMaxima} para o aluno ${studentName} no curso ${newGrade.disciplina}`,
      grade.id
    )
  } catch (e) {
    // Ignore db helper errors
  }

  return res.status(201).json({ grade })
})

// PUT /grades/:id - Update grade
router.put("/:id", requireAuth, requireRole(Role.DIRECTOR, Role.COORDINATOR, Role.TEACHER), async (req: AuthRequest, res) => {
  const { id } = req.params
  const data = gradeSchema.partial().parse(req.body)

  if (req.user!.role === Role.TEACHER) {
    const existing = await db.collection("grades").findOne({ _id: new ObjectId(id) })
    if (!existing) {
      return res.status(404).json({ error: "Nota não encontrada" })
    }
    if (existing.professorId !== req.user!.sub) {
      return res.status(403).json({ error: "Acesso negado: Você só pode editar notas lançadas por você mesmo." })
    }
  }

  const updateData = {
    ...data,
    updatedAt: new Date(),
  }

  await db.collection("grades").updateOne(
    { _id: new ObjectId(id) },
    { $set: updateData }
  )

  try {
    const updatedGrade = await db.collection("grades").findOne({ _id: new ObjectId(id) })
    if (updatedGrade) {
      const studentDoc = await db.collection("students").findOne({ _id: new ObjectId(updatedGrade.studentId) })
      const studentName = studentDoc ? studentDoc.nome : "Desconhecido"
      await createAuditLog(
        req.user!.sub,
        "UPDATE",
        "grade",
        `Atualizou nota do aluno ${studentName} no curso ${updatedGrade.disciplina}`,
        id
      )
    }
  } catch (e) {}

  return res.json({ success: true })
})

// DELETE /grades/:id - Delete grade
router.delete("/:id", requireAuth, requireRole(Role.DIRECTOR, Role.COORDINATOR, Role.TEACHER), async (req: AuthRequest, res) => {
  const { id } = req.params

  const existingGrade = await db.collection("grades").findOne({ _id: new ObjectId(id) })
  if (!existingGrade) {
    return res.status(404).json({ error: "Nota não encontrada" })
  }

  if (req.user!.role === Role.TEACHER && existingGrade.professorId !== req.user!.sub) {
    return res.status(403).json({ error: "Acesso negado: Você só pode excluir notas lançadas por você mesmo." })
  }

  try {
    const studentDoc = await db.collection("students").findOne({ _id: new ObjectId(existingGrade.studentId) })
    const studentName = studentDoc ? studentDoc.nome : "Desconhecido"
    await createAuditLog(
      req.user!.sub,
      "DELETE",
      "grade",
      `Excluiu nota do aluno ${studentName} no curso ${existingGrade.disciplina}`,
      id
    )
  } catch (e) {}

  await db.collection("grades").deleteOne({ _id: new ObjectId(id) })

  return res.json({ success: true })
})

export const gradesRouter = router
