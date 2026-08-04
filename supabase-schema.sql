-- SQL Schema para Supabase (Projeto Anjos Inocentes)

-- 1. Tabela USERS
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  name TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'TEACHER',
  permissions JSONB DEFAULT '[]'::jsonb,
  active BOOLEAN DEFAULT true,
  cpf TEXT,
  telefone TEXT,
  data_nascimento TEXT,
  endereco TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Tabela STUDENTS
CREATE TABLE IF NOT EXISTS students (
  id TEXT PRIMARY KEY,
  nome TEXT NOT NULL,
  cpf TEXT UNIQUE NOT NULL,
  data_nascimento TEXT NOT NULL,
  email TEXT,
  telefone TEXT,
  endereco TEXT,
  curso TEXT,
  class_ids JSONB DEFAULT '[]'::jsonb,
  class_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Tabela CLASSES
CREATE TABLE IF NOT EXISTS classes (
  id TEXT PRIMARY KEY,
  nome TEXT NOT NULL,
  curso TEXT NOT NULL,
  course_id TEXT,
  horario TEXT NOT NULL,
  dias_semana JSONB DEFAULT '[]'::jsonb,
  professor TEXT NOT NULL,
  professor_id TEXT,
  capacidade INT NOT NULL DEFAULT 30,
  sala TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'ativa',
  student_ids JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Tabela ATTENDANCES
CREATE TABLE IF NOT EXISTS attendances (
  id TEXT PRIMARY KEY,
  student_id TEXT NOT NULL,
  class_id TEXT NOT NULL,
  date TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'presente',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Tabela LESSONS
CREATE TABLE IF NOT EXISTS lessons (
  id TEXT PRIMARY KEY,
  data TEXT NOT NULL,
  end_date TEXT,
  turma TEXT NOT NULL,
  class_id TEXT,
  disciplina TEXT NOT NULL,
  conteudo TEXT NOT NULL,
  observacoes TEXT,
  files JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Tabela ANNOUNCEMENTS
CREATE TABLE IF NOT EXISTS announcements (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  author_id TEXT,
  author_name TEXT,
  target_roles JSONB DEFAULT '[]'::jsonb,
  attachments JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. Tabela COURSES
CREATE TABLE IF NOT EXISTS courses (
  id TEXT PRIMARY KEY,
  name TEXT UNIQUE NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'ativo',
  color TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. Tabela EVENTS
CREATE TABLE IF NOT EXISTS events (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  date TEXT NOT NULL,
  end_date TEXT,
  time TEXT,
  location TEXT,
  type TEXT DEFAULT 'evento',
  target_roles JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. Tabela AUDIT_LOGS
CREATE TABLE IF NOT EXISTS audit_logs (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  action TEXT NOT NULL,
  resource TEXT NOT NULL,
  details TEXT NOT NULL,
  resource_id TEXT,
  timestamp TIMESTAMPTZ DEFAULT NOW()
);

-- Inserir usuário Admin padrão se não existir
INSERT INTO users (id, email, password, name, role, permissions, active)
VALUES (
  'admin-default-id',
  'admin@anjosinocentes.org.br',
  '$2a$10$w8T.N0V3O4Z7e6L/K8T7/O/RzW9Ua.6L1W6d/E8t7T9/0', -- Exemplo de hash
  'Administrador Anjos',
  'ADMIN',
  '["alunos", "turmas", "presenca", "plano_aula", "calendario", "comunicacao", "notas"]'::jsonb,
  true
)
ON CONFLICT (email) DO NOTHING;
