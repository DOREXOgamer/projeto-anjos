import bcrypt from "bcryptjs";
import { supabase } from "../lib/db.js";
const defaultEmail = "admin@anjosinocentes.org.br";
const defaultPassword = "admin123";
const defaultName = "Administrador";
const email = process.env.ADMIN_EMAIL ?? defaultEmail;
const password = process.env.ADMIN_PASSWORD ?? defaultPassword;
const name = process.env.ADMIN_NAME ?? defaultName;
async function run() {
    const { data: existingAdmin } = await supabase.from("users").select("*").eq("email", email).single();
    if (!existingAdmin) {
        const passwordHash = await bcrypt.hash(password, 10);
        await supabase.from("users").insert({
            id: crypto.randomUUID(),
            name,
            email,
            password: passwordHash,
            role: "ADMIN",
            permissions: ["alunos", "turmas", "presenca", "plano_aula", "calendario", "comunicacao", "notas"],
            active: true,
            created_at: new Date().toISOString()
        });
        console.log(`Admin criado no Supabase: ${email}`);
    }
    else {
        console.log(`Admin já existe no Supabase: ${existingAdmin.email}`);
    }
}
run().catch((err) => {
    console.error("Erro ao rodar seed:", err);
    process.exitCode = 1;
});
