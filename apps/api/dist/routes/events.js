import { Router } from "express";
import { z } from "zod";
import { supabase, Role } from "../lib/db.js";
import { requireAuth, requireRole } from "../middleware/auth.js";
import { createAuditLog } from "../lib/audit.js";
const router = Router();
const eventSchema = z.object({
    titulo: z.string().min(1),
    descricao: z.string().or(z.literal("")).optional(),
    data: z.string().min(1),
    horario: z.string().or(z.literal("")).optional(),
    tipo: z.enum(["aula", "evento", "feriado", "reuniao"]),
    turmaId: z.string().or(z.literal("")).optional(),
});
// GET /events - List all events
router.get("/", requireAuth, async (req, res) => {
    let { data: eventsList, error } = await supabase
        .from("events")
        .select("*")
        .order("date", { ascending: true });
    if (error || !eventsList) {
        return res.json({ events: [] });
    }
    if (req.user.role === Role.TEACHER) {
        const { data: teacherClasses } = await supabase
            .from("classes")
            .select("id")
            .eq("professor_id", req.user.sub);
        const classIds = teacherClasses ? teacherClasses.map(c => c.id) : [];
        eventsList = eventsList.filter(e => !e.turma_id || e.turma_id === "" || classIds.includes(e.turma_id));
    }
    const events = eventsList.map((e) => ({
        id: e.id,
        titulo: e.title || e.titulo,
        descricao: e.description || e.descricao || "",
        data: e.date || e.data,
        horario: e.time || e.horario || "",
        tipo: e.type || e.tipo,
        turmaId: e.turma_id || e.turmaId || "",
    }));
    return res.json({ events });
});
// POST /events - Create event
router.post("/", requireAuth, requireRole(Role.DIRECTOR, Role.COORDINATOR, Role.SECRETARY), async (req, res) => {
    const data = eventSchema.parse(req.body);
    const id = crypto.randomUUID();
    const row = {
        id,
        title: data.titulo,
        description: data.descricao || "",
        date: data.data,
        time: data.horario || "",
        type: data.tipo,
        created_at: new Date().toISOString()
    };
    const { error } = await supabase.from("events").insert(row);
    if (error) {
        return res.status(400).json({ error: error.message });
    }
    const event = {
        id,
        ...data,
    };
    await createAuditLog(req.user.sub, "CREATE", "event", `Criou o evento ${data.titulo} para a data ${data.data}`, id);
    return res.status(201).json({ event });
});
// PUT /events/:id - Update event
router.put("/:id", requireAuth, requireRole(Role.DIRECTOR, Role.COORDINATOR, Role.SECRETARY), async (req, res) => {
    const { id } = req.params;
    const data = eventSchema.partial().parse(req.body);
    const updateRow = {};
    if (data.titulo !== undefined)
        updateRow.title = data.titulo;
    if (data.descricao !== undefined)
        updateRow.description = data.descricao;
    if (data.data !== undefined)
        updateRow.date = data.data;
    if (data.horario !== undefined)
        updateRow.time = data.horario;
    if (data.tipo !== undefined)
        updateRow.type = data.tipo;
    await supabase.from("events").update(updateRow).eq("id", id);
    const { data: updatedEvent } = await supabase.from("events").select("title").eq("id", id).single();
    const name = updatedEvent ? updatedEvent.title : "Desconhecido";
    await createAuditLog(req.user.sub, "UPDATE", "event", `Atualizou o evento ${name}`, id);
    return res.json({ success: true });
});
// DELETE /events/:id - Delete event
router.delete("/:id", requireAuth, requireRole(Role.DIRECTOR, Role.COORDINATOR, Role.SECRETARY), async (req, res) => {
    const { id } = req.params;
    const { data: existingEvent } = await supabase.from("events").select("title").eq("id", id).single();
    const name = existingEvent ? existingEvent.title : "Desconhecido";
    await supabase.from("events").delete().eq("id", id);
    await createAuditLog(req.user.sub, "DELETE", "event", `Excluiu o evento ${name}`, id);
    return res.json({ success: true });
});
export const eventsRouter = router;
