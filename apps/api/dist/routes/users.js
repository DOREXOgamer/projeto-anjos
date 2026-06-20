import { Router } from "express";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { db, Role, ObjectId } from "../lib/db.js";
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
const updateTeacherSchema = z.object({
    name: z.string().min(1).optional(),
    email: z.string().email().optional(),
    permissions: z.array(permissionEnum).optional(),
    active: z.boolean().optional(),
});
const resetPasswordSchema = z.object({
    password: z.string().min(6),
});
const updateProfileSchema = z.object({
    name: z.string().min(1).optional(),
    email: z.string().email().optional(),
});
const changePasswordSchema = z.object({
    currentPassword: z.string().min(6),
    newPassword: z.string().min(6),
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
        active: t.active !== false,
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
        active: true,
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
        active: true,
        createdAt: newUser.createdAt,
    };
    return res.status(201).json({ user });
});
router.put("/teachers/:id", requireAuth, requireRole(Role.DIRECTOR), async (req, res) => {
    const { id } = req.params;
    const data = updateTeacherSchema.parse(req.body);
    const updateData = {
        ...data,
        updatedAt: new Date(),
    };
    await db.collection("users").updateOne({ _id: new ObjectId(id) }, { $set: updateData });
    const updatedUser = await db.collection("users").findOne({ _id: new ObjectId(id) });
    if (!updatedUser) {
        return res.status(404).json({ error: "Teacher not found" });
    }
    return res.json({
        user: {
            id: updatedUser._id.toString(),
            name: updatedUser.name,
            email: updatedUser.email,
            role: updatedUser.role,
            permissions: updatedUser.permissions || [],
            active: updatedUser.active !== false,
            createdAt: updatedUser.createdAt,
        }
    });
});
router.delete("/teachers/:id", requireAuth, requireRole(Role.DIRECTOR), async (req, res) => {
    const { id } = req.params;
    await db.collection("users").deleteOne({ _id: new ObjectId(id) });
    return res.json({ success: true });
});
router.post("/teachers/:id/reset-password", requireAuth, requireRole(Role.DIRECTOR), async (req, res) => {
    const { id } = req.params;
    const { password } = resetPasswordSchema.parse(req.body);
    const passwordHash = await bcrypt.hash(password, 10);
    await db.collection("users").updateOne({ _id: new ObjectId(id) }, { $set: { passwordHash, updatedAt: new Date() } });
    return res.json({ success: true });
});
router.put("/profile", requireAuth, async (req, res) => {
    const data = updateProfileSchema.parse(req.body);
    const userId = new ObjectId(req.user.sub);
    await db.collection("users").updateOne({ _id: userId }, { $set: { ...data, updatedAt: new Date() } });
    const updatedUser = await db.collection("users").findOne({ _id: userId });
    if (!updatedUser) {
        return res.status(404).json({ error: "User not found" });
    }
    return res.json({
        user: {
            id: updatedUser._id.toString(),
            name: updatedUser.name,
            email: updatedUser.email,
            role: updatedUser.role,
            permissions: updatedUser.permissions || [],
        }
    });
});
router.post("/change-password", requireAuth, async (req, res) => {
    const { currentPassword, newPassword } = changePasswordSchema.parse(req.body);
    const userId = new ObjectId(req.user.sub);
    const userDoc = await db.collection("users").findOne({ _id: userId });
    if (!userDoc) {
        return res.status(404).json({ error: "User not found" });
    }
    const valid = await bcrypt.compare(currentPassword, userDoc.passwordHash);
    if (!valid) {
        return res.status(400).json({ error: "Senha atual incorreta" });
    }
    const passwordHash = await bcrypt.hash(newPassword, 10);
    await db.collection("users").updateOne({ _id: userId }, { $set: { passwordHash, updatedAt: new Date() } });
    return res.json({ success: true });
});
export const usersRouter = router;
