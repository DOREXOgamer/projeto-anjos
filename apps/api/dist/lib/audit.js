import { db, ObjectId } from "./db.js";
export async function createAuditLog(userId, action, resource, description, targetId) {
    try {
        const userDoc = await db.collection("users").findOne({ _id: new ObjectId(userId) });
        const userName = userDoc ? userDoc.name : "Desconhecido";
        const userRole = userDoc ? userDoc.role : "UNKNOWN";
        await db.collection("audit_logs").insertOne({
            userId,
            userName,
            userRole,
            action,
            resource,
            description,
            targetId,
            createdAt: new Date(),
        });
    }
    catch (err) {
        console.error("Failed to write audit log:", err);
    }
}
