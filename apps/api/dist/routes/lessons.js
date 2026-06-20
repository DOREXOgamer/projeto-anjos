import { Router } from "express";
import { z } from "zod";
import { db, ObjectId } from "../lib/db.js";
import { requireAuth } from "../middleware/auth.js";
const router = Router();
const lessonSchema = z.object({
    data: z.string().min(1),
    turma: z.string().min(1),
    disciplina: z.string().min(1),
    conteudo: z.string().min(1),
    observacoes: z.string().or(z.literal("")).optional(),
});
// GET /lessons - List all lesson plans
router.get("/", requireAuth, async (_req, res) => {
    const lessonsList = await db.collection("lessons")
        .find()
        .sort({ createdAt: -1 })
        .toArray();
    const lessons = lessonsList.map((l) => ({
        id: l._id.toString(),
        data: l.data,
        turma: l.turma,
        disciplina: l.disciplina,
        conteudo: l.conteudo,
        observacoes: l.observacoes || "",
        createdAt: l.createdAt,
    }));
    return res.json({ lessons });
});
// POST /lessons - Create lesson plan
router.post("/", requireAuth, async (req, res) => {
    const data = lessonSchema.parse(req.body);
    const newLesson = {
        ...data,
        createdAt: new Date().toISOString().split("T")[0],
        updatedAt: new Date(),
    };
    const result = await db.collection("lessons").insertOne(newLesson);
    const lesson = {
        id: result.insertedId.toString(),
        ...newLesson,
    };
    return res.status(201).json({ lesson });
});
// PUT /lessons/:id - Update lesson plan
router.put("/:id", requireAuth, async (req, res) => {
    const { id } = req.params;
    const data = lessonSchema.partial().parse(req.body);
    const updateData = {
        ...data,
        updatedAt: new Date(),
    };
    await db.collection("lessons").updateOne({ _id: new ObjectId(id) }, { $set: updateData });
    return res.json({ success: true });
});
// DELETE /lessons/:id - Delete lesson plan
router.delete("/:id", requireAuth, async (req, res) => {
    const { id } = req.params;
    await db.collection("lessons").deleteOne({ _id: new ObjectId(id) });
    return res.json({ success: true });
});
export const lessonsRouter = router;
