export interface Aluno {
  id: string
  nome: string
  cpf: string
  dataNascimento: string
  email: string
  telefone: string
  endereco: string
  curso: string
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
  turma: string
  disciplina: string
  conteudo: string
  observacoes: string
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
  horario: string
  diasSemana: string[]
  professor: string
  capacidade: number
  alunosMatriculados: number
  sala: string
  status: 'ativa' | 'inativa'
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
