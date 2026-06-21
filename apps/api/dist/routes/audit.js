import { Router } from "express";
import { db, Role } from "../lib/db.js";
import { requireAuth, requireRole } from "../middleware/auth.js";
const router = Router();
// GET /audit-logs - List all audit logs (Director only)
router.get("/", requireAuth, requireRole(Role.DIRECTOR), async (_req, res) => {
    const logsList = await db.collection("audit_logs")
        .find()
        .sort({ createdAt: -1 })
        .limit(200) // limit to recent 200 logs
        .toArray();
    const logs = logsList.map((log) => ({
        id: log._id.toString(),
        userId: log.userId,
        userName: log.userName,
        userRole: log.userRole,
        action: log.action,
        resource: log.resource,
        description: log.description,
        targetId: log.targetId || null,
        createdAt: log.createdAt,
    }));
    return res.json({ logs });
});
export const auditRouter = router;
