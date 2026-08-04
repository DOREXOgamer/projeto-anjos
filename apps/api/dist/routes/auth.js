import { Router } from "express";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { supabase, Role, ROLE_PERMISSIONS } from "../lib/db.js";
import { signToken } from "../lib/jwt.js";
import { requireAuth } from "../middleware/auth.js";
const router = Router();
const registerSchema = z.object({
    name: z.string().min(1),
    email: z.string().email(),
    password: z.string().min(6),
    role: z.nativeEnum(Role).optional(),
});
const loginSchema = z.object({
    email: z.string().email(),
    password: z.string().min(6),
});
router.post("/register", async (req, res) => {
    const data = registerSchema.parse(req.body);
    const { data: existing } = await supabase.from("users").select("id").eq("email", data.email).single();
    if (existing) {
        return res.status(409).json({ error: "Email already in use" });
    }
    if (data.role === "DIRECTOR") {
        const { count } = await supabase.from("users").select("*", { count: "exact", head: true });
        if (count && count > 0) {
            return res.status(403).json({
                error: "Director role can only be assigned to the first user",
            });
        }
    }
    const passwordHash = await bcrypt.hash(data.password, 10);
    const role = (data.role ?? Role.TEACHER);
    const id = crypto.randomUUID();
    const row = {
        id,
        name: data.name,
        email: data.email,
        password: passwordHash,
        role,
        permissions: ROLE_PERMISSIONS[role] || [],
        active: true,
        created_at: new Date().toISOString()
    };
    const { error } = await supabase.from("users").insert(row);
    if (error) {
        return res.status(400).json({ error: error.message });
    }
    const token = signToken({ sub: id, email: data.email, role });
    return res.status(201).json({
        token,
        user: {
            id,
            name: data.name,
            email: data.email,
            role,
            permissions: ROLE_PERMISSIONS[role] || [],
            active: true,
        },
    });
});
router.post("/login", async (req, res) => {
    const data = loginSchema.parse(req.body);
    const { data: userDoc } = await supabase.from("users").select("*").eq("email", data.email).single();
    if (!userDoc) {
        return res.status(401).json({ error: "Invalid credentials" });
    }
    if (userDoc.active === false) {
        return res.status(403).json({ error: "Sua conta está desativada. Entre em contato com a administração." });
    }
    const valid = await bcrypt.compare(data.password, userDoc.password);
    if (!valid) {
        return res.status(401).json({ error: "Invalid credentials" });
    }
    const userIdStr = userDoc.id;
    const token = signToken({ sub: userIdStr, email: userDoc.email, role: userDoc.role });
    return res.json({
        token,
        user: {
            id: userIdStr,
            name: userDoc.name,
            email: userDoc.email,
            role: userDoc.role,
            permissions: ROLE_PERMISSIONS[userDoc.role] || [],
            active: userDoc.active !== false,
        },
    });
});
router.get("/me", requireAuth, async (req, res) => {
    let user = null;
    if (req.user?.sub) {
        try {
            const { data: userDoc } = await supabase.from("users").select("*").eq("id", req.user.sub).single();
            if (userDoc) {
                if (userDoc.active === false) {
                    return res.status(403).json({ error: "Sua conta está desativada" });
                }
                user = {
                    id: userDoc.id,
                    name: userDoc.name,
                    email: userDoc.email,
                    role: userDoc.role,
                    permissions: ROLE_PERMISSIONS[userDoc.role] || [],
                    active: true,
                    createdAt: userDoc.created_at,
                };
            }
        }
        catch {
            // Invalid format
        }
    }
    if (!user) {
        return res.status(404).json({ error: "User not found" });
    }
    return res.json({ user });
});
export const authRouter = router;
