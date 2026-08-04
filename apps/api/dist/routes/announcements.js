import { Router } from "express";
import { z } from "zod";
import { supabase, Role } from "../lib/db.js";
import { requireAuth, requireRole } from "../middleware/auth.js";
import { createAuditLog } from "../lib/audit.js";
const router = Router();
const attachmentSchema = z.object({
    name: z.string(),
    type: z.string(),
    data: z.string(),
    size: z.number(),
});
const createSchema = z.object({
    title: z.string().trim().min(1, "O título é obrigatório"),
    body: z.string().trim().min(1, "A mensagem é obrigatória"),
    attachments: z.array(attachmentSchema).optional(),
});
// GET /announcements - List all announcements
router.get("/", requireAuth, async (_req, res) => {
    const { data: announcementsList, error } = await supabase
        .from("announcements")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(20);
    if (error || !announcementsList) {
        return res.json({ announcements: [] });
    }
    const { data: users } = await supabase.from("users").select("id, name, role");
    const userMap = new Map(users ? users.map(u => [u.id, u]) : []);
    const announcements = announcementsList.map((a) => {
        const author = userMap.get(a.author_id || a.authorId);
        return {
            id: a.id,
            title: a.title,
            body: a.content || a.body,
            attachments: a.attachments || [],
            createdAt: a.created_at,
            author: author ? {
                id: author.id,
                name: author.name,
                role: author.role,
            } : null,
        };
    });
    return res.json({ announcements });
});
// POST /announcements - Create announcement
router.post("/", requireAuth, requireRole(Role.DIRECTOR, Role.COORDINATOR, Role.SECRETARY), async (req, res) => {
    const data = createSchema.parse(req.body);
    const id = crypto.randomUUID();
    const authorId = req.user.sub;
    const { data: author } = await supabase.from("users").select("name").eq("id", authorId).single();
    const authorName = author ? author.name : "";
    const row = {
        id,
        title: data.title,
        content: data.body,
        attachments: data.attachments || [],
        author_id: authorId,
        author_name: authorName,
        created_at: new Date().toISOString()
    };
    const { error } = await supabase.from("announcements").insert(row);
    if (error) {
        return res.status(400).json({ error: error.message });
    }
    const announcement = {
        id,
        title: data.title,
        body: data.body,
        attachments: data.attachments || [],
        authorId,
        createdAt: row.created_at,
    };
    await createAuditLog(req.user.sub, "CREATE", "announcement", `Criou o aviso mural: ${data.title}`, id);
    return res.status(201).json({ announcement });
});
// PUT /announcements/:id - Update announcement
router.put("/:id", requireAuth, requireRole(Role.DIRECTOR, Role.COORDINATOR, Role.SECRETARY), async (req, res) => {
    const { id } = req.params;
    const data = createSchema.partial().parse(req.body);
    const { data: existingAnn } = await supabase.from("announcements").select("title").eq("id", id).single();
    if (!existingAnn) {
        return res.status(404).json({ error: "Aviso não encontrado" });
    }
    const updateRow = {};
    if (data.title !== undefined)
        updateRow.title = data.title;
    if (data.body !== undefined)
        updateRow.content = data.body;
    if (data.attachments !== undefined)
        updateRow.attachments = data.attachments;
    await supabase.from("announcements").update(updateRow).eq("id", id);
    await createAuditLog(req.user.sub, "UPDATE", "announcement", `Atualizou o aviso mural: ${data.title || existingAnn.title}`, id);
    return res.json({ success: true });
});
// DELETE /announcements/:id - Delete announcement
router.delete("/:id", requireAuth, requireRole(Role.DIRECTOR, Role.COORDINATOR, Role.SECRETARY), async (req, res) => {
    const { id } = req.params;
    const { data: existingAnn } = await supabase.from("announcements").select("title").eq("id", id).single();
    const title = existingAnn ? existingAnn.title : "Desconhecido";
    await supabase.from("announcements").delete().eq("id", id);
    await createAuditLog(req.user.sub, "DELETE", "announcement", `Excluiu o aviso mural: ${title}`, id);
    return res.json({ success: true });
});
export const announcementsRouter = router;
