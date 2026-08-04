import { Router } from "express"
import { supabase, Role } from "../lib/db.js"
import { requireAuth, requireRole } from "../middleware/auth.js"

const router = Router()

// GET /audit-logs - List all audit logs
router.get("/", requireAuth, requireRole(Role.DIRECTOR, Role.ADMIN), async (_req, res) => {
  const { data: logsList, error } = await supabase
    .from("audit_logs")
    .select("*")
    .order("timestamp", { ascending: false })
    .limit(200)

  if (error || !logsList) {
    return res.json({ logs: [] })
  }

  const { data: users } = await supabase.from("users").select("id, name, role")
  const userMap = new Map(users ? users.map(u => [u.id, u]) : [])

  const logs = logsList.map((log: any) => {
    const u = userMap.get(log.user_id)
    return {
      id: log.id,
      userId: log.user_id,
      userName: u ? u.name : "Desconhecido",
      userRole: u ? u.role : "UNKNOWN",
      action: log.action,
      resource: log.resource,
      description: log.details || log.description || "",
      targetId: log.resource_id || log.targetId || null,
      createdAt: log.timestamp,
    }
  })

  return res.json({ logs })
})

export const auditRouter = router
