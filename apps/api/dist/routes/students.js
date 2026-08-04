import { Router } from "express";
import { z } from "zod";
import { supabase, Role } from "../lib/db.js";
import { requireAuth, requireRole } from "../middleware/auth.js";
import { createAuditLog } from "../lib/audit.js";
const router = Router();
const studentSchema = z.object({
    nome: z.string().min(1),
    cpf: z.string().min(1),
    dataNascimento: z.string().min(1),
    email: z.string().email().or(z.literal("")).optional(),
    telefone: z.string().or(z.literal("")).optional(),
    endereco: z.string().or(z.literal("")).optional(),
    curso: z.string().or(z.literal("")).optional(),
    classId: z.string().nullable().optional(),
    classIds: z.array(z.string()).optional(),
});
async function updateClassEnrollmentCounts() {
    const { data: classes } = await supabase.from("classes").select("*");
    if (!classes)
        return;
    const { data: students } = await supabase.from("students").select("*");
    if (!students)
        return;
    for (const c of classes) {
        const count = students.filter(s => s.class_id === c.id || (Array.isArray(s.class_ids) && s.class_ids.includes(c.id))).length;
        await supabase.from("classes").update({ alunos_matriculados: count }).eq("id", c.id);
    }
}
// GET /students - List all students
router.get("/", requireAuth, async (req, res) => {
    let { data: studentsList, error } = await supabase
        .from("students")
        .select("*")
        .order("created_at", { ascending: false });
    if (error || !studentsList) {
        return res.json({ students: [] });
    }
    if (req.user.role === Role.TEACHER) {
        const { data: teacherClasses } = await supabase
            .from("classes")
            .select("id")
            .eq("professor_id", req.user.sub);
        const classIds = teacherClasses ? teacherClasses.map(c => c.id) : [];
        studentsList = studentsList.filter(s => classIds.includes(s.class_id) || (Array.isArray(s.class_ids) && s.class_ids.some((id) => classIds.includes(id))));
    }
    const students = studentsList.map((s) => ({
        id: s.id,
        nome: s.nome,
        cpf: s.cpf,
        dataNascimento: s.data_nascimento || s.dataNascimento,
        email: s.email || "",
        telefone: s.telefone || "",
        endereco: s.endereco || "",
        curso: s.curso || "",
        classId: s.class_id || s.classId || null,
        classIds: s.class_ids || s.classIds || [],
        createdAt: s.created_at,
    }));
    return res.json({ students });
});
// POST /students - Create student
router.post("/", requireAuth, requireRole(Role.DIRECTOR, Role.COORDINATOR, Role.SECRETARY), async (req, res) => {
    const data = studentSchema.parse(req.body);
    const id = crypto.randomUUID();
    const row = {
        id,
        nome: data.nome,
        cpf: data.cpf,
        data_nascimento: data.dataNascimento,
        email: data.email || "",
        telefone: data.telefone || "",
        endereco: data.endereco || "",
        curso: data.curso || "",
        class_id: data.classId || null,
        class_ids: data.classIds || [],
        created_at: new Date().toISOString()
    };
    const { error } = await supabase.from("students").insert(row);
    if (error) {
        return res.status(400).json({ error: error.message });
    }
    await updateClassEnrollmentCounts();
    const student = {
        id,
        ...data,
        createdAt: row.created_at
    };
    await createAuditLog(req.user.sub, "CREATE", "student", `Cadastrou o aluno ${data.nome} (CPF: ${data.cpf})`, id);
    return res.status(201).json({ student });
});
// PUT /students/:id - Update student
router.put("/:id", requireAuth, requireRole(Role.DIRECTOR, Role.COORDINATOR, Role.SECRETARY), async (req, res) => {
    const { id } = req.params;
    const data = studentSchema.partial().parse(req.body);
    const updateRow = {};
    if (data.nome !== undefined)
        updateRow.nome = data.nome;
    if (data.cpf !== undefined)
        updateRow.cpf = data.cpf;
    if (data.dataNascimento !== undefined)
        updateRow.data_nascimento = data.dataNascimento;
    if (data.email !== undefined)
        updateRow.email = data.email;
    if (data.telefone !== undefined)
        updateRow.telefone = data.telefone;
    if (data.endereco !== undefined)
        updateRow.endereco = data.endereco;
    if (data.curso !== undefined)
        updateRow.curso = data.curso;
    if (data.classId !== undefined)
        updateRow.class_id = data.classId;
    if (data.classIds !== undefined)
        updateRow.class_ids = data.classIds;
    await supabase.from("students").update(updateRow).eq("id", id);
    const { data: updatedStudent } = await supabase.from("students").select("nome").eq("id", id).single();
    const name = updatedStudent ? updatedStudent.nome : "Desconhecido";
    await updateClassEnrollmentCounts();
    await createAuditLog(req.user.sub, "UPDATE", "student", `Atualizou dados do aluno ${name}`, id);
    return res.json({ success: true });
});
// DELETE /students/:id - Delete student
router.delete("/:id", requireAuth, requireRole(Role.DIRECTOR, Role.COORDINATOR, Role.SECRETARY), async (req, res) => {
    const { id } = req.params;
    const { data: existingStudent } = await supabase.from("students").select("nome").eq("id", id).single();
    const name = existingStudent ? existingStudent.nome : "Desconhecido";
    await supabase.from("students").delete().eq("id", id);
    await supabase.from("attendances").delete().eq("student_id", id);
    await updateClassEnrollmentCounts();
    await createAuditLog(req.user.sub, "DELETE", "student", `Excluiu o aluno ${name}`, id);
    return res.json({ success: true });
});
export const studentsRouter = router;
