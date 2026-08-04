import { Router } from "express";
import { z } from "zod";
import { supabase, Role } from "../lib/db.js";
import { requireAuth, requireRole } from "../middleware/auth.js";
import { createAuditLog } from "../lib/audit.js";
const router = Router();
const courseSchema = z.object({
    name: z.string().min(1),
    description: z.string().or(z.literal("")).optional(),
});
// GET /courses - List all courses
router.get("/", requireAuth, async (_req, res) => {
    const { data: coursesList, error } = await supabase
        .from("courses")
        .select("*")
        .order("created_at", { ascending: false });
    if (error || !coursesList) {
        return res.json({ courses: [] });
    }
    const courses = coursesList.map((c) => ({
        id: c.id,
        name: c.name,
        description: c.description || "",
    }));
    return res.json({ courses });
});
// POST /courses - Create course
router.post("/", requireAuth, requireRole(Role.DIRECTOR, Role.COORDINATOR), async (req, res) => {
    const data = courseSchema.parse(req.body);
    const id = crypto.randomUUID();
    const row = {
        id,
        name: data.name,
        description: data.description || "",
        created_at: new Date().toISOString()
    };
    const { error } = await supabase.from("courses").insert(row);
    if (error) {
        return res.status(400).json({ error: error.message });
    }
    const course = {
        id,
        ...data,
    };
    await createAuditLog(req.user.sub, "CREATE", "course", `Criou o curso ${data.name}`, id);
    return res.status(201).json({ course });
});
// PUT /courses/:id - Update course
router.put("/:id", requireAuth, requireRole(Role.DIRECTOR, Role.COORDINATOR), async (req, res) => {
    const { id } = req.params;
    const data = courseSchema.partial().parse(req.body);
    const updateRow = {};
    if (data.name !== undefined)
        updateRow.name = data.name;
    if (data.description !== undefined)
        updateRow.description = data.description;
    await supabase.from("courses").update(updateRow).eq("id", id);
    const { data: updatedCourse } = await supabase.from("courses").select("name").eq("id", id).single();
    const name = updatedCourse ? updatedCourse.name : "Desconhecido";
    await createAuditLog(req.user.sub, "UPDATE", "course", `Atualizou o curso ${name}`, id);
    return res.json({ success: true });
});
// DELETE /courses/:id - Delete course
router.delete("/:id", requireAuth, requireRole(Role.DIRECTOR, Role.COORDINATOR), async (req, res) => {
    const { id } = req.params;
    const { data: existingCourse } = await supabase.from("courses").select("name").eq("id", id).single();
    const name = existingCourse ? existingCourse.name : "Desconhecido";
    await supabase.from("courses").delete().eq("id", id);
    await createAuditLog(req.user.sub, "DELETE", "course", `Excluiu o curso ${name}`, id);
    return res.json({ success: true });
});
export const coursesRouter = router;
