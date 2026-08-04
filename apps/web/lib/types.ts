export interface Aluno {
  id: string
  nome: string
  cpf: string
  dataNascimento: string
  email: string
  telefone: string
  endereco: string
  curso: string
  classId?: string | null
  classIds?: string[]
  createdAt: string
}

export interface Presenca {
  id: string
  alunoId: string
  data: string
  status: 'presente' | 'ausente'
}

export interface PlanoAula {
  id: string
  data: string
  endDate?: string
  turma: string
  classId?: string
  disciplina: string
  conteudo: string
  observacoes: string
  files?: string[]
  createdAt: string
}

export interface DashboardStats {
  totalAlunos: number
  presentesHoje: number
  aulasDoDia: number
}

export interface Turma {
  id: string
  nome: string
  curso: string
  courseId?: string
  horario: string
  diasSemana: string[]
  professor: string
  professorId?: string
  capacidade: number
  alunosMatriculados: number
  sala: string
  status: 'ativa' | 'inativa'
  studentIds?: string[]
  createdAt: string
}

export interface Evento {
  id: string
  titulo: string
  descricao: string
  data: string
  horario: string
  tipo: 'aula' | 'evento' | 'feriado' | 'reuniao'
  turmaId?: string
}

export interface Course {
  id: string
  name: string
  description?: string
}

export interface Teacher {
  id: string
  name: string
  email: string
  role?: string
  permissions: string[]
  active: boolean
  cpf?: string
  telefone?: string
  dataNascimento?: string
  endereco?: string
  createdAt: string
}

export interface AnnouncementAttachment {
  name: string
  type: string
  data: string
  size: number
}

export interface Announcement {
  id: string
  title: string
  body: string
  attachments?: AnnouncementAttachment[]
  author?: {
    id: string
    name: string
    role: string
  } | null
  createdAt: string
}

export interface Nota {
  id: string
  studentId: string
  studentName?: string
  classId: string
  disciplina: string
  tipo: 'prova' | 'trabalho' | 'participacao' | 'outro'
  nota: number
  notaMaxima: number
  data: string
  observacoes: string
  professorId?: string
  professor?: string
  createdAt: string
}
