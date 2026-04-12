import bcrypt from "bcryptjs"
import { prisma } from "../lib/db"

const defaultEmail = "admin@anjosinocentes.org.br"
const defaultPassword = "admin123"
const defaultName = "Administrador"

const email = process.env.ADMIN_EMAIL ?? defaultEmail
const password = process.env.ADMIN_PASSWORD ?? defaultPassword
const name = process.env.ADMIN_NAME ?? defaultName
const force = process.env.ADMIN_FORCE === "true"

async function run() {
  if (!force) {
    const existingDirector = await prisma.user.findFirst({
      where: { role: "DIRECTOR" },
      select: { id: true, email: true },
    })

    if (existingDirector) {
      console.log(`Admin já existe: ${existingDirector.email}`)
      return
    }
  }

  const existingEmail = await prisma.user.findUnique({
    where: { email },
    select: { id: true },
  })

  if (existingEmail) {
    console.log(`Usuário já existe: ${email}`)
    return
  }

  const passwordHash = await bcrypt.hash(password, 10)

  await prisma.user.create({
    data: {
      name,
      email,
      passwordHash,
      role: "DIRECTOR",
    },
  })

  console.log(`Admin criado: ${email}`)
}

run()
  .catch((err) => {
    console.error("Erro ao criar admin:", err)
    process.exitCode = 1
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
