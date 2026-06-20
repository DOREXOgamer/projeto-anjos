import bcrypt from "bcryptjs";
import { client, db } from "../lib/db.js";
const defaultEmail = "admin@anjosinocentes.org.br";
const defaultPassword = "admin123";
const defaultName = "Administrador";
const email = process.env.ADMIN_EMAIL ?? defaultEmail;
const password = process.env.ADMIN_PASSWORD ?? defaultPassword;
const name = process.env.ADMIN_NAME ?? defaultName;
const force = process.env.ADMIN_FORCE === "true";
const mockStudents = [
    {
        nome: 'Maria Silva',
        cpf: '123.456.789-00',
        dataNascimento: '2015-05-10',
        email: 'maria.silva@email.com',
        telefone: '(11) 99999-0001',
        endereco: 'Rua das Flores, 123',
        curso: 'Música',
        createdAt: '2024-01-15'
    },
    {
        nome: 'João Santos',
        cpf: '234.567.890-11',
        dataNascimento: '2014-08-22',
        email: 'joao.santos@email.com',
        telefone: '(11) 99999-0002',
        endereco: 'Av. Principal, 456',
        curso: 'Artes',
        createdAt: '2024-01-20'
    },
    {
        nome: 'Ana Oliveira',
        cpf: '345.678.901-22',
        dataNascimento: '2016-03-15',
        email: 'ana.oliveira@email.com',
        telefone: '(11) 99999-0003',
        endereco: 'Rua da Esperança, 789',
        curso: 'Dança',
        createdAt: '2024-02-01'
    },
    {
        nome: 'Pedro Costa',
        cpf: '456.789.012-33',
        dataNascimento: '2015-11-30',
        email: 'pedro.costa@email.com',
        telefone: '(11) 99999-0004',
        endereco: 'Travessa do Sol, 321',
        curso: 'Música',
        createdAt: '2024-02-10'
    },
    {
        nome: 'Juliana Lima',
        cpf: '567.890.123-44',
        dataNascimento: '2014-07-08',
        email: 'juliana.lima@email.com',
        telefone: '(11) 99999-0005',
        endereco: 'Rua Nova, 654',
        curso: 'Teatro',
        createdAt: '2024-02-15'
    },
    {
        nome: 'Lucas Ferreira',
        cpf: '678.901.234-55',
        dataNascimento: '2016-01-25',
        email: 'lucas.ferreira@email.com',
        telefone: '(11) 99999-0006',
        endereco: 'Av. Central, 987',
        curso: 'Artes',
        createdAt: '2024-03-01'
    },
];
const mockClasses = [
    {
        nome: 'Música - Manhã',
        curso: 'Música',
        horario: '08:00 - 10:00',
        diasSemana: ['Segunda', 'Quarta', 'Sexta'],
        professor: 'Prof. Carlos Silva',
        capacidade: 20,
        alunosMatriculados: 15,
        sala: 'Sala 01',
        status: 'ativa',
        createdAt: '2024-01-10'
    },
    {
        nome: 'Artes - Tarde',
        curso: 'Artes',
        horario: '14:00 - 16:00',
        diasSemana: ['Terça', 'Quinta'],
        professor: 'Prof. Maria Santos',
        capacidade: 15,
        alunosMatriculados: 12,
        sala: 'Sala 02',
        status: 'ativa',
        createdAt: '2024-01-15'
    },
    {
        nome: 'Dança - Manhã',
        curso: 'Dança',
        horario: '09:00 - 11:00',
        diasSemana: ['Segunda', 'Quarta'],
        professor: 'Prof. Ana Oliveira',
        capacidade: 18,
        alunosMatriculados: 18,
        sala: 'Sala 03',
        status: 'ativa',
        createdAt: '2024-02-01'
    },
    {
        nome: 'Teatro - Tarde',
        curso: 'Teatro',
        horario: '15:00 - 17:00',
        diasSemana: ['Terça', 'Quinta', 'Sexta'],
        professor: 'Prof. João Costa',
        capacidade: 12,
        alunosMatriculados: 8,
        sala: 'Auditório',
        status: 'ativa',
        createdAt: '2024-02-10'
    },
    {
        nome: 'Música - Noite',
        curso: 'Música',
        horario: '18:00 - 20:00',
        diasSemana: ['Segunda', 'Quarta'],
        professor: 'Prof. Carlos Silva',
        capacidade: 15,
        alunosMatriculados: 5,
        sala: 'Sala 01',
        status: 'inativa',
        createdAt: '2024-01-20'
    },
];
const mockEvents = [
    { titulo: 'Aula de Música', descricao: 'Teoria musical básica', data: '2026-03-23', horario: '08:00', tipo: 'aula' },
    { titulo: 'Aula de Artes', descricao: 'Pintura em aquarela', data: '2026-03-23', horario: '14:00', tipo: 'aula' },
    { titulo: 'Reunião de Pais', descricao: 'Reunião semestral com pais e responsáveis', data: '2026-03-25', horario: '19:00', tipo: 'reuniao' },
    { titulo: 'Apresentação de Dança', descricao: 'Apresentação final do semestre', data: '2026-03-28', horario: '15:00', tipo: 'evento' },
    { titulo: 'Feriado - Páscoa', descricao: 'Sexta-feira Santa', data: '2026-03-29', horario: '', tipo: 'feriado' },
    { titulo: 'Aula de Teatro', descricao: 'Improvisação teatral', data: '2026-03-24', horario: '15:00', tipo: 'aula' },
];
const mockLessons = [
    {
        data: '2026-03-20',
        turma: 'Música - Manhã',
        disciplina: 'Teoria Musical',
        conteudo: 'Introdução às notas musicais e escalas básicas. Prática com instrumentos de percussão.',
        observacoes: 'Trazer caderno de música',
        createdAt: '2026-03-18'
    },
    {
        data: '2026-03-20',
        turma: 'Artes - Tarde',
        disciplina: 'Pintura',
        conteudo: 'Técnicas de aquarela e mistura de cores primárias.',
        observacoes: 'Material fornecido pelo projeto',
        createdAt: '2026-03-19'
    },
    {
        data: '2026-03-21',
        turma: 'Dança - Manhã',
        disciplina: 'Dança Contemporânea',
        conteudo: 'Alongamento e movimentos básicos de expressão corporal.',
        observacoes: 'Usar roupas confortáveis',
        createdAt: '2026-03-19'
    },
];
async function run() {
    // 1. Seed Director Admin Account
    if (!force) {
        const existingDirector = await db.collection("users").findOne({ role: "DIRECTOR" });
        if (existingDirector) {
            console.log(`Admin já existe: ${existingDirector.email}`);
        }
        else {
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
    }
    else {
        // If forced, delete current director and recreate
        await db.collection("users").deleteMany({ role: "DIRECTOR" });
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
        console.log(`Admin criado (force): ${email}`);
    }
    // 2. Seed Mock Students
    const studentCount = await db.collection("students").countDocuments();
    if (studentCount === 0) {
        await db.collection("students").insertMany(mockStudents);
        console.log("Mock de alunos inseridos com sucesso!");
    }
    else {
        console.log("Alunos já existem no banco de dados.");
    }
    // 3. Seed Mock Classes
    const classCount = await db.collection("classes").countDocuments();
    if (classCount === 0) {
        await db.collection("classes").insertMany(mockClasses);
        console.log("Mock de turmas inseridas com sucesso!");
    }
    else {
        console.log("Turmas já existem no banco de dados.");
    }
    // 4. Seed Mock Events
    const eventCount = await db.collection("events").countDocuments();
    if (eventCount === 0) {
        await db.collection("events").insertMany(mockEvents);
        console.log("Mock de eventos do calendário inseridos com sucesso!");
    }
    else {
        console.log("Eventos do calendário já existem no banco de dados.");
    }
    // 5. Seed Mock Lesson Plans
    const lessonCount = await db.collection("lessons").countDocuments();
    if (lessonCount === 0) {
        await db.collection("lessons").insertMany(mockLessons);
        console.log("Mock de planos de aula inseridos com sucesso!");
    }
    else {
        console.log("Planos de aula já existem no banco de dados.");
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
