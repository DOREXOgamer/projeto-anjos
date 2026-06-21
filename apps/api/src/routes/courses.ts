import { Router } from "express"
import { z } from "zod"
import { db, Role, ObjectId } from "../lib/db.js"
import { requireAuth, requireRole, type AuthRequest } from "../middleware/auth.js"
import { createAuditLog } from "../lib/audit.js"

const router = Router()

const courseSchema = z.object({
  name: z.string().min(1),
  description: z.string().or(z.literal("")).optional(),
})

// GET /courses - List all courses
router.get("/", requireAuth, async (_req, res) => {
  const coursesList = await db.collection("courses")
    .find()
    .sort({ createdAt: -1 })
    .toArray()

  const courses = coursesList.map((c: any) => ({
    id: c._id.toString(),
    name: c.name,
    description: c.description || "",
  }))

  return res.json({ courses })
})

// POST /courses - Create course
router.post("/", requireAuth, requireRole(Role.DIRECTOR, Role.COORDINATOR), async (req: AuthRequest, res) => {
  const data = courseSchema.parse(req.body)

  const newCourse = {
    ...data,
    createdAt: new Date(),
    updatedAt: new Date(),
  }

  const result = await db.collection("courses").insertOne(newCourse)

  const course = {
    id: result.insertedId.toString(),
    ...newCourse,
  }

  await createAuditLog(
    req.user!.sub,
    "CREATE",
    "course",
    `Criou o curso ${newCourse.name}`,
    course.id
  )

  return res.status(201).json({ course })
})

// PUT /courses/:id - Update course
router.put("/:id", requireAuth, requireRole(Role.DIRECTOR, Role.COORDINATOR), async (req: AuthRequest, res) => {
  const { id } = req.params
  const data = courseSchema.partial().parse(req.body)

  const updateData = {
    ...data,
    updatedAt: new Date(),
  }

  await db.collection("courses").updateOne(
    { _id: new ObjectId(id) },
    { $set: updateData }
  )

  const updatedCourse = await db.collection("courses").findOne({ _id: new ObjectId(id) })
  const name = updatedCourse ? updatedCourse.name : "Desconhecido"

  await createAuditLog(
    req.user!.sub,
    "UPDATE",
    "course",
    `Atualizou o curso ${name}`,
    id
  )

  return res.json({ success: true })
})

// DELETE /courses/:id - Delete course
router.delete("/:id", requireAuth, requireRole(Role.DIRECTOR, Role.COORDINATOR), async (req: AuthRequest, res) => {
  const { id } = req.params
  const existingCourse = await db.collection("courses").findOne({ _id: new ObjectId(id) })
  const name = existingCourse ? existingCourse.name : "Desconhecido"

  await db.collection("courses").deleteOne({ _id: new ObjectId(id) })

  await createAuditLog(
    req.user!.sub,
    "DELETE",
    "course",
    `Excluiu o curso ${name}`,
    id
  )

  return res.json({ success: true })
})

export const coursesRouter = router
