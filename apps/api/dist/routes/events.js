import { Router } from "express";
import { z } from "zod";
import { db, ObjectId, Role } from "../lib/db.js";
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
    const filter = {};
    if (req.user.role === Role.TEACHER) {
        const teacherClasses = await db.collection("classes")
            .find({ professorId: req.user.sub })
            .toArray();
        const classIds = teacherClasses.map(c => c._id.toString());
        filter.$or = [
            { turmaId: { $in: classIds } },
            { turmaId: { $in: ["", null] } },
            { turmaId: { $exists: false } }
        ];
    }
    const eventsList = await db.collection("events")
        .find(filter)
        .sort({ data: 1, horario: 1 })
        .toArray();
    const events = eventsList.map((e) => ({
        id: e._id.toString(),
        titulo: e.titulo,
        descricao: e.descricao || "",
        data: e.data,
        horario: e.horario || "",
        tipo: e.tipo,
        turmaId: e.turmaId || "",
    }));
    return res.json({ events });
});
// POST /events - Create event
router.post("/", requireAuth, requireRole(Role.DIRECTOR, Role.COORDINATOR, Role.SECRETARY), async (req, res) => {
    const data = eventSchema.parse(req.body);
    const newEvent = {
        ...data,
        createdAt: new Date(),
        updatedAt: new Date(),
    };
    const result = await db.collection("events").insertOne(newEvent);
    const event = {
        id: result.insertedId.toString(),
        ...newEvent,
    };
    await createAuditLog(req.user.sub, "CREATE", "event", `Criou o evento ${newEvent.titulo} para a data ${newEvent.data}`, event.id);
    return res.status(201).json({ event });
});
// PUT /events/:id - Update event
router.put("/:id", requireAuth, requireRole(Role.DIRECTOR, Role.COORDINATOR, Role.SECRETARY), async (req, res) => {
    const { id } = req.params;
    const data = eventSchema.partial().parse(req.body);
    const updateData = {
        ...data,
        updatedAt: new Date(),
    };
    await db.collection("events").updateOne({ _id: new ObjectId(id) }, { $set: updateData });
    const updatedEvent = await db.collection("events").findOne({ _id: new ObjectId(id) });
    const name = updatedEvent ? updatedEvent.titulo : "Desconhecido";
    await createAuditLog(req.user.sub, "UPDATE", "event", `Atualizou o evento ${name}`, id);
    return res.json({ success: true });
});
// DELETE /events/:id - Delete event
router.delete("/:id", requireAuth, requireRole(Role.DIRECTOR, Role.COORDINATOR, Role.SECRETARY), async (req, res) => {
    const { id } = req.params;
    const existingEvent = await db.collection("events").findOne({ _id: new ObjectId(id) });
    const name = existingEvent ? existingEvent.titulo : "Desconhecido";
    await db.collection("events").deleteOne({ _id: new ObjectId(id) });
    await createAuditLog(req.user.sub, "DELETE", "event", `Excluiu o evento ${name}`, id);
    return res.json({ success: true });
});
export const eventsRouter = router;
