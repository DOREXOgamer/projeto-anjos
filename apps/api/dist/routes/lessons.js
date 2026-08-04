import { Router } from "express";
import { z } from "zod";
import { supabase, Role } from "../lib/db.js";
import { requireAuth, requireRole } from "../middleware/auth.js";
import { createAuditLog } from "../lib/audit.js";
const router = Router();
const lessonSchema = z.object({
    data: z.string().min(1),
    endDate: z.string().or(z.literal("")).optional(),
    turma: z.string().min(1),
    classId: z.string().or(z.literal("")).optional(),
    disciplina: z.string().min(1),
    conteudo: z.string().min(1),
    observacoes: z.string().or(z.literal("")).optional(),
    files: z.array(z.string()).optional(),
});
// GET /lessons - List all lesson plans
router.get("/", requireAuth, async (req, res) => {
    let query = supabase.from("lessons").select("*").order("created_at", { ascending: false });
    if (req.user.role === Role.TEACHER) {
        const { data: teacherClasses } = await supabase
            .from("classes")
            .select("id")
            .eq("professor_id", req.user.sub);
        const classIds = teacherClasses ? teacherClasses.map(c => c.id) : [];
        query = query.in("class_id", classIds);
    }
    const { data: lessonsList, error } = await query;
    if (error || !lessonsList) {
        return res.json({ lessons: [] });
    }
    const lessons = lessonsList.map((l) => ({
        id: l.id,
        data: l.data,
        endDate: l.end_date || l.endDate || "",
        turma: l.turma,
        classId: l.class_id || l.classId || "",
        disciplina: l.disciplina,
        conteudo: l.conteudo,
        observacoes: l.observacoes || "",
        files: l.files || [],
        createdAt: l.created_at,
    }));
    return res.json({ lessons });
});
// POST /lessons - Create lesson plan
router.post("/", requireAuth, requireRole(Role.DIRECTOR, Role.COORDINATOR, Role.TEACHER), async (req, res) => {
    const data = lessonSchema.parse(req.body);
    const id = crypto.randomUUID();
    const row = {
        id,
        data: data.data,
        end_date: data.endDate || "",
        turma: data.turma,
        class_id: data.classId || "",
        disciplina: data.disciplina,
        conteudo: data.conteudo,
        observacoes: data.observacoes || "",
        files: data.files || [],
        created_at: new Date().toISOString()
    };
    const { error } = await supabase.from("lessons").insert(row);
    if (error) {
        return res.status(400).json({ error: error.message });
    }
    const lesson = {
        id,
        ...data,
        createdAt: row.created_at
    };
    await createAuditLog(req.user.sub, "CREATE", "lesson", `Criou plano de aula para a turma ${data.turma} (curso: ${data.disciplina})`, id);
    return res.status(201).json({ lesson });
});
// PUT /lessons/:id - Update lesson plan
router.put("/:id", requireAuth, requireRole(Role.DIRECTOR, Role.COORDINATOR, Role.TEACHER), async (req, res) => {
    const { id } = req.params;
    const data = lessonSchema.partial().parse(req.body);
    const updateRow = {};
    if (data.data !== undefined)
        updateRow.data = data.data;
    if (data.endDate !== undefined)
        updateRow.end_date = data.endDate;
    if (data.turma !== undefined)
        updateRow.turma = data.turma;
    if (data.classId !== undefined)
        updateRow.class_id = data.classId;
    if (data.disciplina !== undefined)
        updateRow.disciplina = data.disciplina;
    if (data.conteudo !== undefined)
        updateRow.conteudo = data.conteudo;
    if (data.observacoes !== undefined)
        updateRow.observacoes = data.observacoes;
    if (data.files !== undefined)
        updateRow.files = data.files;
    await supabase.from("lessons").update(updateRow).eq("id", id);
    const { data: updatedLesson } = await supabase.from("lessons").select("turma").eq("id", id).single();
    const name = updatedLesson ? updatedLesson.turma : "Desconhecido";
    await createAuditLog(req.user.sub, "UPDATE", "lesson", `Atualizou plano de aula da turma ${name}`, id);
    return res.json({ success: true });
});
// DELETE /lessons/:id - Delete lesson plan
router.delete("/:id", requireAuth, requireRole(Role.DIRECTOR, Role.COORDINATOR, Role.TEACHER), async (req, res) => {
    const { id } = req.params;
    const { data: existingLesson } = await supabase.from("lessons").select("turma").eq("id", id).single();
    const name = existingLesson ? existingLesson.turma : "Desconhecido";
    await supabase.from("lessons").delete().eq("id", id);
    await createAuditLog(req.user.sub, "DELETE", "lesson", `Excluiu plano de aula da turma ${name}`, id);
    return res.json({ success: true });
});
export const lessonsRouter = router;
