import { Router } from "express";
import { z } from "zod";
import { supabase, Role } from "../lib/db.js";
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
// GET /attendance - Get attendance records
router.get("/", requireAuth, async (req, res) => {
    const { date, classId, startDate, endDate } = req.query;
    let query = supabase.from("attendances").select("*");
    if (date) {
        query = query.eq("date", date);
    }
    if (classId) {
        query = query.eq("class_id", classId);
    }
    if (startDate) {
        query = query.gte("date", startDate);
    }
    if (endDate) {
        query = query.lte("date", endDate);
    }
    if (req.user.role === Role.TEACHER) {
        const { data: teacherClasses } = await supabase
            .from("classes")
            .select("id")
            .eq("professor_id", req.user.sub);
        const classIds = teacherClasses ? teacherClasses.map(c => c.id) : [];
        if (classId) {
            if (!classIds.includes(classId)) {
                return res.json({ records: [] });
            }
        }
        else {
            query = query.in("class_id", classIds);
        }
    }
    const { data: attendanceList, error } = await query;
    if (error || !attendanceList) {
        return res.json({ records: [] });
    }
    // Get student info for lookup
    const { data: students } = await supabase.from("students").select("id, nome");
    const studentMap = new Map(students ? students.map(s => [s.id, s.nome]) : []);
    const records = attendanceList.map((a) => ({
        id: a.id,
        alunoId: a.student_id || a.studentId,
        studentId: a.student_id || a.studentId,
        data: a.date,
        date: a.date,
        status: (a.status === "presente" || a.status === "PRESENT") ? "PRESENT" : "ABSENT",
        classId: a.class_id || a.classId,
        student: studentMap.has(a.student_id || a.studentId) ? { name: studentMap.get(a.student_id || a.studentId) } : null
    }));
    return res.json({ records });
});
// POST /attendance - Bulk upsert daily attendance
router.post("/", requireAuth, async (req, res) => {
    const { date, classId, records } = bulkAttendanceSchema.parse(req.body);
    const studentIds = records.map(r => r.studentId);
    if (studentIds.length > 0) {
        await supabase
            .from("attendances")
            .delete()
            .eq("date", date)
            .in("student_id", studentIds);
    }
    if (records.length > 0) {
        const documents = records.map(r => ({
            id: crypto.randomUUID(),
            student_id: r.studentId,
            class_id: classId || "",
            date,
            status: (r.status === "PRESENT" || r.status === "presente") ? "presente" : "ausente",
            created_at: new Date().toISOString()
        }));
        await supabase.from("attendances").insert(documents);
    }
    return res.json({ success: true });
});
export const attendanceRouter = router;
