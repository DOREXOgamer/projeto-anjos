import { Router } from "express"
import { z } from "zod"
import { supabase, Role } from "../lib/db.js"
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
  let query = supabase.from("grades").select("*")

  if (classId) {
    query = query.eq("class_id", classId as string)
  }
  if (studentId) {
    query = query.eq("student_id", studentId as string)
  }

  if (req.user!.role === Role.TEACHER) {
    const { data: teacherClasses } = await supabase
      .from("classes")
      .select("id")
      .eq("professor_id", req.user!.sub)
    const classIds = teacherClasses ? teacherClasses.map((c: any) => c.id) : []
    
    if (classId) {
      if (!classIds.includes(classId as string)) {
        return res.json({ grades: [] })
      }
    } else {
      query = query.in("class_id", classIds)
    }
  }

  const { data: gradesList, error } = await query
  if (error || !gradesList) {
    return res.json({ grades: [] })
  }

  const { data: students } = await supabase.from("students").select("id, nome")
  const studentMap = new Map(students ? students.map((s: any) => [s.id, s.nome]) : [])

  const grades = gradesList.map((g: any) => ({
    id: g.id,
    studentId: g.student_id || g.studentId,
    studentName: studentMap.get(g.student_id || g.studentId) || "Aluno não encontrado",
    classId: g.class_id || g.classId,
    disciplina: g.disciplina,
    tipo: g.tipo,
    nota: g.nota,
    notaMaxima: g.nota_maxima || g.notaMaxima,
    data: g.date || g.data,
    observacoes: g.observacoes || "",
    professorId: g.professor_id || g.professorId || "",
    professor: g.professor || "",
    createdAt: g.created_at,
  }))

  return res.json({ grades })
})

// POST /grades - Create grade
router.post("/", requireAuth, requireRole(Role.DIRECTOR, Role.COORDINATOR, Role.TEACHER), async (req: AuthRequest, res) => {
  const data = gradeSchema.parse(req.body)

  const professorId = req.user!.sub
  const { data: user } = await supabase.from("users").select("name").eq("id", professorId).single()
  const professorName = user ? user.name : "Desconhecido"
  const id = crypto.randomUUID()

  const row = {
    id,
    student_id: data.studentId,
    class_id: data.classId,
    disciplina: data.disciplina,
    tipo: data.tipo,
    nota: data.nota,
    nota_maxima: data.notaMaxima,
    date: data.data,
    observacoes: data.observacoes || "",
    professor_id: professorId,
    professor: professorName,
    created_at: new Date().toISOString(),
  }

  const { error } = await supabase.from("grades").insert(row)
  if (error) {
    return res.status(400).json({ error: error.message })
  }

  const grade = {
    id,
    ...data,
    professorId,
    professor: professorName,
    createdAt: row.created_at
  }

  try {
    const { data: studentDoc } = await supabase.from("students").select("nome").eq("id", data.studentId).single()
    const studentName = studentDoc ? studentDoc.nome : "Desconhecido"
    await createAuditLog(
      req.user!.sub,
      "CREATE",
      "grade",
      `Lançou nota ${data.nota}/${data.notaMaxima} para o aluno ${studentName} no curso ${data.disciplina}`,
      id
    )
  } catch (e) {}

  return res.status(201).json({ grade })
})

// PUT /grades/:id - Update grade
router.put("/:id", requireAuth, requireRole(Role.DIRECTOR, Role.COORDINATOR, Role.TEACHER), async (req: AuthRequest, res) => {
  const { id } = req.params
  const data = gradeSchema.partial().parse(req.body)

  const { data: existing } = await supabase.from("grades").select("*").eq("id", id).single()
  if (!existing) {
    return res.status(404).json({ error: "Nota não encontrada" })
  }

  if (req.user!.role === Role.TEACHER && existing.professor_id !== req.user!.sub) {
    return res.status(403).json({ error: "Acesso negado: Você só pode editar notas lançadas por você mesmo." })
  }

  const updateRow: any = {}
  if (data.studentId !== undefined) updateRow.student_id = data.studentId
  if (data.classId !== undefined) updateRow.class_id = data.classId
  if (data.disciplina !== undefined) updateRow.disciplina = data.disciplina
  if (data.tipo !== undefined) updateRow.tipo = data.tipo
  if (data.nota !== undefined) updateRow.nota = data.nota
  if (data.notaMaxima !== undefined) updateRow.nota_maxima = data.notaMaxima
  if (data.data !== undefined) updateRow.date = data.data
  if (data.observacoes !== undefined) updateRow.observacoes = data.observacoes

  await supabase.from("grades").update(updateRow).eq("id", id)

  return res.json({ success: true })
})

// DELETE /grades/:id - Delete grade
router.delete("/:id", requireAuth, requireRole(Role.DIRECTOR, Role.COORDINATOR, Role.TEACHER), async (req: AuthRequest, res) => {
  const { id } = req.params

  const { data: existingGrade } = await supabase.from("grades").select("*").eq("id", id).single()
  if (!existingGrade) {
    return res.status(404).json({ error: "Nota não encontrada" })
  }

  if (req.user!.role === Role.TEACHER && existingGrade.professor_id !== req.user!.sub) {
    return res.status(403).json({ error: "Acesso negado: Você só pode excluir notas lançadas por você mesmo." })
  }

  await supabase.from("grades").delete().eq("id", id)

  return res.json({ success: true })
})

export const gradesRouter = router
