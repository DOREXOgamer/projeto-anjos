import { Router } from "express"
import { z } from "zod"
import { prisma } from "../lib/db"
import { requireAuth, requireRole, type AuthRequest } from "../middleware/auth"
import { Role } from "@prisma/client"

const router = Router()

const createSchema = z.object({
  title: z.string().min(1),
  body: z.string().min(1),
})

router.get("/", requireAuth, async (_req, res) => {
  const announcements = await prisma.announcement.findMany({
    orderBy: { createdAt: "desc" },
    take: 20,
    include: {
      author: {
        select: { id: true, name: true, role: true },
      },
    },
  })

  return res.json({ announcements })
})

router.post(
  "/",
  requireAuth,
  requireRole(Role.DIRECTOR),
  async (req: AuthRequest, res) => {
    const data = createSchema.parse(req.body)

    const announcement = await prisma.announcement.create({
      data: {
        title: data.title,
        body: data.body,
        authorId: req.user!.sub,
      },
    })

    return res.status(201).json({ announcement })
  },
)

export const announcementsRouter = router
