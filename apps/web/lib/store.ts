"use client"

import type { Aluno, Presenca, PlanoAula } from './types'

// Dados mockados para demonstração
const alunosMock: Aluno[] = [
  {
    id: '1',
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
    id: '2',
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
    id: '3',
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
    id: '4',
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
    id: '5',
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
    id: '6',
    nome: 'Lucas Ferreira',
    cpf: '678.901.234-55',
    dataNascimento: '2016-01-25',
    email: 'lucas.ferreira@email.com',
    telefone: '(11) 99999-0006',
    endereco: 'Av. Central, 987',
    curso: 'Artes',
    createdAt: '2024-03-01'
  },
]

const presencasMock: Presenca[] = [
  { id: '1', alunoId: '1', data: '2024-03-20', status: 'presente' },
  { id: '2', alunoId: '2', data: '2024-03-20', status: 'presente' },
  { id: '3', alunoId: '3', data: '2024-03-20', status: 'ausente' },
  { id: '4', alunoId: '4', data: '2024-03-20', status: 'presente' },
  { id: '5', alunoId: '5', data: '2024-03-20', status: 'presente' },
  { id: '6', alunoId: '6', data: '2024-03-20', status: 'ausente' },
]

const planosMock: PlanoAula[] = [
  {
    id: '1',
    data: '2024-03-20',
    turma: 'Música - Manhã',
    disciplina: 'Teoria Musical',
    conteudo: 'Introdução às notas musicais e escalas básicas. Prática com instrumentos de percussão.',
    observacoes: 'Trazer caderno de música',
    createdAt: '2024-03-18'
  },
  {
    id: '2',
    data: '2024-03-20',
    turma: 'Artes - Tarde',
    disciplina: 'Pintura',
    conteudo: 'Técnicas de aquarela e mistura de cores primárias.',
    observacoes: 'Material fornecido pelo projeto',
    createdAt: '2024-03-19'
  },
  {
    id: '3',
    data: '2024-03-21',
    turma: 'Dança - Manhã',
    disciplina: 'Dança Contemporânea',
    conteudo: 'Alongamento e movimentos básicos de expressão corporal.',
    observacoes: 'Usar roupas confortáveis',
    createdAt: '2024-03-19'
  },
]

// Store simples em memória
let alunos = [...alunosMock]
let presencas = [...presencasMock]
let planos = [...planosMock]

export const store = {
  // Alunos
  getAlunos: () => alunos,
  addAluno: (aluno: Omit<Aluno, 'id' | 'createdAt'>) => {
    const newAluno: Aluno = {
      ...aluno,
      id: String(Date.now()),
      createdAt: new Date().toISOString().split('T')[0]
    }
    alunos = [...alunos, newAluno]
    return newAluno
  },
  updateAluno: (id: string, data: Partial<Aluno>) => {
    alunos = alunos.map(a => a.id === id ? { ...a, ...data } : a)
  },
  deleteAluno: (id: string) => {
    alunos = alunos.filter(a => a.id !== id)
  },

  // Presença
  getPresencas: () => presencas,
  getPresencasByData: (data: string) => presencas.filter(p => p.data === data),
  setPresenca: (alunoId: string, data: string, status: 'presente' | 'ausente') => {
    const existing = presencas.find(p => p.alunoId === alunoId && p.data === data)
    if (existing) {
      presencas = presencas.map(p => 
        p.alunoId === alunoId && p.data === data ? { ...p, status } : p
      )
    } else {
      presencas = [...presencas, {
        id: String(Date.now()),
        alunoId,
        data,
        status
      }]
    }
  },

  // Planos de Aula
  getPlanos: () => planos,
  addPlano: (plano: Omit<PlanoAula, 'id' | 'createdAt'>) => {
    const newPlano: PlanoAula = {
      ...plano,
      id: String(Date.now()),
      createdAt: new Date().toISOString().split('T')[0]
    }
    planos = [...planos, newPlano]
    return newPlano
  },
  updatePlano: (id: string, data: Partial<PlanoAula>) => {
    planos = planos.map(p => p.id === id ? { ...p, ...data } : p)
  },
  deletePlano: (id: string) => {
    planos = planos.filter(p => p.id !== id)
  },

  // Dashboard Stats
  getStats: () => {
    const hoje = new Date().toISOString().split('T')[0]
    const presencasHoje = presencas.filter(p => p.data === hoje && p.status === 'presente')
    const aulasHoje = planos.filter(p => p.data === hoje)
    
    return {
      totalAlunos: alunos.length,
      presentesHoje: presencasHoje.length,
      aulasDoDia: aulasHoje.length
    }
  },

  // Presença semanal para gráfico
  getPresencaSemanal: () => {
    const dias = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex']
    return dias.map((dia, index) => ({
      dia,
      presentes: Math.floor(Math.random() * alunos.length * 0.8) + Math.floor(alunos.length * 0.4),
      ausentes: Math.floor(Math.random() * alunos.length * 0.3)
    }))
  }
}
