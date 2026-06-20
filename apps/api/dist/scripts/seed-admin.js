import bcrypt from "bcryptjs";
import { client, db } from "../lib/db.js";
const defaultEmail = "admin@anjosinocentes.org.br";
const defaultPassword = "admin123";
const defaultName = "Administrador";
const email = process.env.ADMIN_EMAIL ?? defaultEmail;
const password = process.env.ADMIN_PASSWORD ?? defaultPassword;
const name = process.env.ADMIN_NAME ?? defaultName;
const force = process.env.ADMIN_FORCE === "true";
async function run() {
    if (!force) {
        const existingDirector = await db.collection("users").findOne({ role: "DIRECTOR" });
        if (existingDirector) {
            console.log(`Admin já existe: ${existingDirector.email}`);
            return;
        }
    }
    const existingEmail = await db.collection("users").findOne({ email });
    if (existingEmail) {
        console.log(`Usuário já existe: ${email}`);
        return;
    }
    const passwordHash = await bcrypt.hash(password, 10);
    await db.collection("users").insertOne({
        name,
        email,
        passwordHash,
        role: "DIRECTOR",
        permissions: [],
        createdAt: new Date(),
        updatedAt: new Date(),
    });
    console.log(`Admin criado: ${email}`);
}
run()
    .catch((err) => {
    console.error("Erro ao criar admin:", err);
    process.exitCode = 1;
})
    .finally(async () => {
    await client.close();
});
