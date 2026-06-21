import { Router } from "express"
import { z } from "zod"
import { db, Role, ObjectId } from "../lib/db.js"
import { requireAuth, requireRole, type AuthRequest } from "../middleware/auth.js"
import { createAuditLog } from "../lib/audit.js"

const router = Router()

const createSchema = z.object({
  title: z.string().min(1),
  body: z.string().min(1),
})

// GET /announcements - List all announcements (all authenticated users)
router.get("/", requireAuth, async (_req, res) => {
  const announcementsList = await db.collection("announcements")
    .aggregate([
      { $sort: { createdAt: -1 } },
      { $limit: 20 },
      {
        $lookup: {
          from: "users",
          localField: "authorId",
          foreignField: "_id",
          as: "author",
        },
      },
      {
        $unwind: {
          path: "$author",
          preserveNullAndEmptyArrays: true,
        },
      },
    ])
    .toArray()

  const announcements = announcementsList.map((a: any) => ({
    id: a._id.toString(),
    title: a.title,
    body: a.body,
    createdAt: a.createdAt,
    author: a.author ? {
      id: a.author._id.toString(),
      name: a.author.name,
      role: a.author.role,
    } : null,
  }))

  return res.json({ announcements })
})

// POST /announcements - Create announcement (Director, Coordinator, Secretary)
router.post(
  "/",
  requireAuth,
  requireRole(Role.DIRECTOR, Role.COORDINATOR, Role.SECRETARY),
  async (req: AuthRequest, res) => {
    const data = createSchema.parse(req.body)

    const authorId = new ObjectId(req.user!.sub)
    const newAnnouncement = {
      title: data.title,
      body: data.body,
      authorId,
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    const result = await db.collection("announcements").insertOne(newAnnouncement)

    const announcement = {
      id: result.insertedId.toString(),
      title: newAnnouncement.title,
      body: newAnnouncement.body,
      authorId: authorId.toString(),
      createdAt: newAnnouncement.createdAt,
    }

    await createAuditLog(
      req.user!.sub,
      "CREATE",
      "announcement",
      `Criou o aviso mural: ${newAnnouncement.title}`,
      announcement.id
    )

    return res.status(201).json({ announcement })
  },
)

// DELETE /announcements/:id - Delete announcement (Director, Coordinator, Secretary)
router.delete(
  "/:id",
  requireAuth,
  requireRole(Role.DIRECTOR, Role.COORDINATOR, Role.SECRETARY),
  async (req: AuthRequest, res) => {
    const { id } = req.params
    const existingAnn = await db.collection("announcements").findOne({ _id: new ObjectId(id) })
    const title = existingAnn ? existingAnn.title : "Desconhecido"

    await db.collection("announcements").deleteOne({ _id: new ObjectId(id) })

    await createAuditLog(
      req.user!.sub,
      "DELETE",
      "announcement",
      `Excluiu o aviso mural: ${title}`,
      id
    )

    return res.json({ success: true })
  },
)

export const announcementsRouter = router
