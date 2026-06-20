import { Router } from "express";
import { z } from "zod";
import { db, ObjectId } from "../lib/db.js";
import { requireAuth } from "../middleware/auth.js";
const router = Router();
const studentSchema = z.object({
    nome: z.string().min(1),
    cpf: z.string().min(1),
    dataNascimento: z.string().min(1),
    email: z.string().email().or(z.literal("")).optional(),
    telefone: z.string().min(1),
    endereco: z.string().min(1),
    curso: z.string().min(1),
});
// GET /students - List all students
router.get("/", requireAuth, async (_req, res) => {
    const studentsList = await db.collection("students")
        .find()
        .sort({ createdAt: -1 })
        .toArray();
    const students = studentsList.map((s) => ({
        id: s._id.toString(),
        nome: s.nome,
        cpf: s.cpf,
        dataNascimento: s.dataNascimento,
        email: s.email || "",
        telefone: s.telefone,
        endereco: s.endereco,
        curso: s.curso,
        createdAt: s.createdAt,
    }));
    return res.json({ students });
});
// POST /students - Create student
router.post("/", requireAuth, async (req, res) => {
    const data = studentSchema.parse(req.body);
    const newStudent = {
        ...data,
        createdAt: new Date().toISOString().split("T")[0],
        updatedAt: new Date(),
    };
    const result = await db.collection("students").insertOne(newStudent);
    const student = {
        id: result.insertedId.toString(),
        ...newStudent,
    };
    return res.status(201).json({ student });
});
// PUT /students/:id - Update student
router.put("/:id", requireAuth, async (req, res) => {
    const { id } = req.params;
    const data = studentSchema.partial().parse(req.body);
    const updateData = {
        ...data,
        updatedAt: new Date(),
    };
    await db.collection("students").updateOne({ _id: new ObjectId(id) }, { $set: updateData });
    return res.json({ success: true });
});
// DELETE /students/:id - Delete student
router.delete("/:id", requireAuth, async (req, res) => {
    const { id } = req.params;
    await db.collection("students").deleteOne({ _id: new ObjectId(id) });
    // Clean up any enrollments/attendance for this student
    await db.collection("enrollments").deleteMany({ studentId: new ObjectId(id) });
    await db.collection("attendances").deleteMany({ studentId: new ObjectId(id) });
    return res.json({ success: true });
});
export const studentsRouter = router;
