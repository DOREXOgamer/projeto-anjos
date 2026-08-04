import { supabase } from "./db.js"

export async function createAuditLog(
  userId: string,
  action: string,
  resource: string,
  description: string,
  targetId?: string
) {
  try {
    const { data: userDoc } = await supabase.from("users").select("name, role").eq("id", userId).single()
    
    await supabase.from("audit_logs").insert({
      id: crypto.randomUUID(),
      user_id: userId,
      action,
      resource,
      details: description,
      resource_id: targetId || null,
      timestamp: new Date().toISOString(),
    })
  } catch (err) {
    console.error("Failed to write audit log:", err)
  }
}
