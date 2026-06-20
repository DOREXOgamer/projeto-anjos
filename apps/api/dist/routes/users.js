import { Router } from "express";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { db, Role } from "../lib/db.js";
import { requireAuth, requireRole } from "../middleware/auth.js";
const router = Router();
const permissionEnum = z.enum([
    "alunos",
    "turmas",
    "presenca",
    "plano_aula",
    "calendario",
    "comunicacao",
]);
const createTeacherSchema = z.object({
    name: z.string().min(1),
    email: z.string().email(),
    password: z.string().min(6),
    permissions: z.array(permissionEnum).optional(),
});
router.get("/teachers", requireAuth, requireRole(Role.DIRECTOR), async (_req, res) => {
    const teachersList = await db.collection("users")
        .find({ role: Role.TEACHER })
        .sort({ createdAt: -1 })
        .toArray();
    const teachers = teachersList.map((t) => ({
        id: t._id.toString(),
        name: t.name,
        email: t.email,
        permissions: t.permissions || [],
        createdAt: t.createdAt,
    }));
    return res.json({ teachers });
});
router.post("/teachers", requireAuth, requireRole(Role.DIRECTOR), async (req, res) => {
    const data = createTeacherSchema.parse(req.body);
    const existing = await db.collection("users").findOne({ email: data.email });
    if (existing) {
        return res.status(409).json({ error: "Email already in use" });
    }
    const passwordHash = await bcrypt.hash(data.password, 10);
    const permissions = data.permissions ?? [];
    const newUser = {
        name: data.name,
        email: data.email,
        passwordHash,
        role: Role.TEACHER,
        permissions,
        createdAt: new Date(),
        updatedAt: new Date(),
    };
    const result = await db.collection("users").insertOne(newUser);
    const user = {
        id: result.insertedId.toString(),
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
        permissions: newUser.permissions,
        createdAt: newUser.createdAt,
    };
    return res.status(201).json({ user });
});
export const usersRouter = router;
