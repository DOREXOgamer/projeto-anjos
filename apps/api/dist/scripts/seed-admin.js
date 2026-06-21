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
    // 1. Seed Admin Account
    const existingAdmin = await db.collection("users").findOne({ email });
    if (existingAdmin) {
        if (force) {
            await db.collection("users").deleteOne({ email });
            const passwordHash = await bcrypt.hash(password, 10);
            await db.collection("users").insertOne({
                name,
                email,
                passwordHash,
                role: "ADMIN",
                permissions: [],
                createdAt: new Date(),
                updatedAt: new Date(),
            });
            console.log(`Admin criado (force): ${email}`);
        }
        else {
            console.log(`Admin já existe: ${existingAdmin.email}`);
        }
    }
    else {
        const passwordHash = await bcrypt.hash(password, 10);
        await db.collection("users").insertOne({
            name,
            email,
            passwordHash,
            role: "ADMIN",
            permissions: [],
            createdAt: new Date(),
            updatedAt: new Date(),
        });
        console.log(`Admin criado: ${email}`);
    }
}
run()
    .catch((err) => {
    console.error("Erro ao rodar seed:", err);
    process.exitCode = 1;
})
    .finally(async () => {
    await client.close();
});
