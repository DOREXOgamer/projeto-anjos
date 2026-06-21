import { Router } from "express";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { db, Role, ObjectId, ROLE_PERMISSIONS } from "../lib/db.js";
import { requireAuth, requireRole } from "../middleware/auth.js";
import { createAuditLog } from "../lib/audit.js";
const router = Router();
const permissionEnum = z.enum([
    "alunos",
    "turmas",
    "presenca",
    "plano_aula",
    "calendario",
    "comunicacao",
    "notas",
]);
const createTeacherSchema = z.object({
    name: z.string().min(1),
    email: z.string().email(),
    password: z.string().min(6),
    role: z.nativeEnum(Role).optional().default(Role.TEACHER),
    permissions: z.array(permissionEnum).optional(),
    cpf: z.string().or(z.literal("")).optional(),
    telefone: z.string().or(z.literal("")).optional(),
    dataNascimento: z.string().or(z.literal("")).optional(),
    endereco: z.string().or(z.literal("")).optional(),
});
const updateTeacherSchema = z.object({
    name: z.string().min(1).optional(),
    email: z.string().email().optional(),
    role: z.nativeEnum(Role).optional(),
    permissions: z.array(permissionEnum).optional(),
    active: z.boolean().optional(),
    cpf: z.string().or(z.literal("")).optional(),
    telefone: z.string().or(z.literal("")).optional(),
    dataNascimento: z.string().or(z.literal("")).optional(),
    endereco: z.string().or(z.literal("")).optional(),
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
router.get("/teachers", requireAuth, requireRole(Role.DIRECTOR, Role.COORDINATOR), async (_req, res) => {
    const teachersList = await db.collection("users")
        .find({ role: { $ne: Role.STUDENT } })
        .sort({ createdAt: -1 })
        .toArray();
    const teachers = teachersList.map((t) => ({
        id: t._id.toString(),
        name: t.name,
        email: t.email,
        role: t.role || Role.TEACHER,
        permissions: ROLE_PERMISSIONS[t.role] || [],
        active: t.active !== false,
        cpf: t.cpf || "",
        telefone: t.telefone || "",
        dataNascimento: t.dataNascimento || "",
        endereco: t.endereco || "",
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
    const role = data.role ?? Role.TEACHER;
    const permissions = ROLE_PERMISSIONS[role] || [];
    const newUser = {
        name: data.name,
        email: data.email,
        passwordHash,
        role,
        permissions,
        active: true,
        cpf: data.cpf || "",
        telefone: data.telefone || "",
        dataNascimento: data.dataNascimento || "",
        endereco: data.endereco || "",
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
        cpf: newUser.cpf,
        telefone: newUser.telefone,
        dataNascimento: newUser.dataNascimento,
        endereco: newUser.endereco,
        createdAt: newUser.createdAt,
    };
    await createAuditLog(req.user.sub, "CREATE", "user", `Cadastrou o colaborador ${newUser.name} com o cargo ${newUser.role}`, user.id);
    return res.status(201).json({ user });
});
router.put("/teachers/:id", requireAuth, requireRole(Role.DIRECTOR), async (req, res) => {
    const { id } = req.params;
    const data = updateTeacherSchema.parse(req.body);
    const existingUser = await db.collection("users").findOne({ _id: new ObjectId(id) });
    if (!existingUser) {
        return res.status(404).json({ error: "Teacher not found" });
    }
    const finalRole = data.role ?? existingUser.role ?? Role.TEACHER;
    const updateData = {
        ...data,
        permissions: ROLE_PERMISSIONS[finalRole] || [],
        updatedAt: new Date(),
    };
    await db.collection("users").updateOne({ _id: new ObjectId(id) }, { $set: updateData });
    const updatedUser = await db.collection("users").findOne({ _id: new ObjectId(id) });
    if (!updatedUser) {
        return res.status(404).json({ error: "Teacher not found" });
    }
    await createAuditLog(req.user.sub, "UPDATE", "user", `Atualizou o colaborador ${updatedUser.name} (cargo: ${updatedUser.role}, ativo: ${updatedUser.active !== false})`, id);
    return res.json({
        user: {
            id: updatedUser._id.toString(),
            name: updatedUser.name,
            email: updatedUser.email,
            role: updatedUser.role,
            permissions: ROLE_PERMISSIONS[updatedUser.role] || [],
            active: updatedUser.active !== false,
            cpf: updatedUser.cpf || "",
            telefone: updatedUser.telefone || "",
            dataNascimento: updatedUser.dataNascimento || "",
            endereco: updatedUser.endereco || "",
            createdAt: updatedUser.createdAt,
        }
    });
});
router.delete("/teachers/:id", requireAuth, requireRole(Role.DIRECTOR), async (req, res) => {
    const { id } = req.params;
    const existingUser = await db.collection("users").findOne({ _id: new ObjectId(id) });
    const name = existingUser ? existingUser.name : "Desconhecido";
    await db.collection("users").deleteOne({ _id: new ObjectId(id) });
    await createAuditLog(req.user.sub, "DELETE", "user", `Excluiu o colaborador ${name}`, id);
    return res.json({ success: true });
});
router.post("/teachers/:id/reset-password", requireAuth, requireRole(Role.DIRECTOR), async (req, res) => {
    const { id } = req.params;
    const existingUser = await db.collection("users").findOne({ _id: new ObjectId(id) });
    const name = existingUser ? existingUser.name : "Desconhecido";
    const { password } = resetPasswordSchema.parse(req.body);
    const passwordHash = await bcrypt.hash(password, 10);
    await db.collection("users").updateOne({ _id: new ObjectId(id) }, { $set: { passwordHash, updatedAt: new Date() } });
    await createAuditLog(req.user.sub, "RESET_PASSWORD", "user", `Redefiniu a senha do colaborador ${name}`, id);
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
            permissions: ROLE_PERMISSIONS[updatedUser.role] || [],
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
