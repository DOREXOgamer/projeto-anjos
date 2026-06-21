import { Router } from "express";
import { z } from "zod";
import { db, Role } from "../lib/db.js";
import { requireAuth } from "../middleware/auth.js";
const router = Router();
const attendanceRecordSchema = z.object({
    studentId: z.string(),
    status: z.enum(["presente", "ausente", "PRESENT", "ABSENT"]),
});
const bulkAttendanceSchema = z.object({
    date: z.string(),
    classId: z.string().optional(),
    records: z.array(attendanceRecordSchema),
});
// GET /attendance - Get attendance records with lookup
router.get("/", requireAuth, async (req, res) => {
    const { date, classId, startDate, endDate } = req.query;
    const filter = {};
    if (date) {
        filter.date = date;
    }
    if (classId) {
        filter.classId = classId;
    }
    if (startDate || endDate) {
        filter.date = {};
        if (startDate) {
            filter.date.$gte = startDate;
        }
        if (endDate) {
            filter.date.$lte = endDate;
        }
    }
    if (req.user.role === Role.TEACHER) {
        const teacherClasses = await db.collection("classes")
            .find({ professorId: req.user.sub })
            .toArray();
        const classIds = teacherClasses.map(c => c._id.toString());
        if (classId) {
            if (!classIds.includes(classId)) {
                return res.json({ records: [] });
            }
        }
        else {
            filter.classId = { $in: classIds };
        }
    }
    // Aggregate to lookup student details
    const attendanceList = await db.collection("attendances")
        .aggregate([
        { $match: filter },
        {
            $lookup: {
                from: "students",
                let: { studentIdObj: { $toObjectId: "$studentId" } },
                pipeline: [
                    { $match: { $expr: { $eq: ["$_id", "$$studentIdObj"] } } }
                ],
                as: "studentInfo"
            }
        }
    ])
        .toArray();
    const records = attendanceList.map((a) => ({
        id: a._id.toString(),
        alunoId: a.studentId,
        studentId: a.studentId,
        data: a.date,
        date: a.date,
        status: (a.status === "presente" || a.status === "PRESENT") ? "PRESENT" : "ABSENT",
        classId: a.classId,
        student: a.studentInfo?.[0] ? { name: a.studentInfo[0].nome } : null
    }));
    return res.json({ records });
});
// POST /attendance - Bulk upsert daily attendance
router.post("/", requireAuth, async (req, res) => {
    const { date, classId, records } = bulkAttendanceSchema.parse(req.body);
    const studentIds = records.map(r => r.studentId);
    await db.collection("attendances").deleteMany({
        date,
        studentId: { $in: studentIds }
    });
    if (records.length > 0) {
        const documents = records.map(r => ({
            studentId: r.studentId,
            classId,
            date,
            status: (r.status === "PRESENT" || r.status === "presente") ? "presente" : "ausente",
            createdAt: new Date()
        }));
        await db.collection("attendances").insertMany(documents);
    }
    return res.json({ success: true });
});
export const attendanceRouter = router;
