import { Router } from "express";
import { z } from "zod";
import { db, ObjectId } from "../lib/db.js";
import { requireAuth } from "../middleware/auth.js";
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
router.get("/", requireAuth, async (_req, res) => {
    const eventsList = await db.collection("events")
        .find()
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
router.post("/", requireAuth, async (req, res) => {
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
    return res.status(201).json({ event });
});
// PUT /events/:id - Update event
router.put("/:id", requireAuth, async (req, res) => {
    const { id } = req.params;
    const data = eventSchema.partial().parse(req.body);
    const updateData = {
        ...data,
        updatedAt: new Date(),
    };
    await db.collection("events").updateOne({ _id: new ObjectId(id) }, { $set: updateData });
    return res.json({ success: true });
});
// DELETE /events/:id - Delete event
router.delete("/:id", requireAuth, async (req, res) => {
    const { id } = req.params;
    await db.collection("events").deleteOne({ _id: new ObjectId(id) });
    return res.json({ success: true });
});
export const eventsRouter = router;
