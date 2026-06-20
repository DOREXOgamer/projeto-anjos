import { Router } from "express"
import { z } from "zod"
import { db } from "../lib/db.js"
import { requireAuth } from "../middleware/auth.js"

const router = Router()

const attendanceRecordSchema = z.object({
  studentId: z.string(),
  status: z.enum(["presente", "ausente"]),
})

const bulkAttendanceSchema = z.object({
  date: z.string(),
  records: z.array(attendanceRecordSchema),
})

// GET /attendance - Get attendance records (optional filter by date)
router.get("/", requireAuth, async (req, res) => {
  const { date } = req.query
  const filter: any = {}
  
  if (date) {
    filter.date = date
  }

  const attendanceList = await db.collection("attendances")
    .find(filter)
    .toArray()

  const records = attendanceList.map((a: any) => ({
    id: a._id.toString(),
    alunoId: a.studentId,
    data: a.date,
    status: a.status,
  }))

  return res.json({ records })
})

// POST /attendance - Bulk upsert daily attendance
router.post("/", requireAuth, async (req, res) => {
  const { date, records } = bulkAttendanceSchema.parse(req.body)

  // Remove existing records for the specified date and students
  const studentIds = records.map(r => r.studentId)
  await db.collection("attendances").deleteMany({
    date,
    studentId: { $in: studentIds }
  })

  // Bulk insert new records if any
  if (records.length > 0) {
    const documents = records.map(r => ({
      studentId: r.studentId,
      date,
      status: r.status,
      createdAt: new Date()
    }))

    await db.collection("attendances").insertMany(documents)
  }

  return res.json({ success: true })
})

export const attendanceRouter = router
