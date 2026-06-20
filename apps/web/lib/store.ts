"use client"

import type { Aluno, Presenca, PlanoAula, Turma, Evento } from './types'
import { getStoredToken, API_URL } from './auth'

export const store = {
  // Alunos (Students)
  getAlunos: async (): Promise<Aluno[]> => {
    const token = getStoredToken()
    const res = await fetch(`${API_URL}/students`, {
      headers: { Authorization: `Bearer ${token}` }
    })
    if (!res.ok) throw new Error("Erro ao obter alunos")
    const data = await res.json()
    return data.students || []
  },

  addAluno: async (aluno: Omit<Aluno, 'id' | 'createdAt'>): Promise<Aluno> => {
    const token = getStoredToken()
    const res = await fetch(`${API_URL}/students`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify(aluno)
    })
    if (!res.ok) throw new Error("Erro ao adicionar aluno")
    const data = await res.json()
    return data.student
  },

  updateAluno: async (id: string, data: Partial<Aluno>): Promise<void> => {
    const token = getStoredToken()
    const res = await fetch(`${API_URL}/students/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify(data)
    })
    if (!res.ok) throw new Error("Erro ao atualizar aluno")
  },

  deleteAluno: async (id: string): Promise<void> => {
    const token = getStoredToken()
    const res = await fetch(`${API_URL}/students/${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` }
    })
    if (!res.ok) throw new Error("Erro ao excluir aluno")
  },

  // Turmas (Classes)
  getClasses: async (): Promise<Turma[]> => {
    const token = getStoredToken()
    const res = await fetch(`${API_URL}/classes`, {
      headers: { Authorization: `Bearer ${token}` }
    })
    if (!res.ok) throw new Error("Erro ao obter turmas")
    const data = await res.json()
    return data.classes || []
  },

  addClass: async (classData: Omit<Turma, 'id' | 'alunosMatriculados' | 'createdAt'>): Promise<Turma> => {
    const token = getStoredToken()
    const res = await fetch(`${API_URL}/classes`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify(classData)
    })
    if (!res.ok) throw new Error("Erro ao criar turma")
    const data = await res.json()
    return data.class
  },

  updateClass: async (id: string, data: Partial<Turma>): Promise<void> => {
    const token = getStoredToken()
    const res = await fetch(`${API_URL}/classes/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify(data)
    })
    if (!res.ok) throw new Error("Erro ao atualizar turma")
  },

  deleteClass: async (id: string): Promise<void> => {
    const token = getStoredToken()
    const res = await fetch(`${API_URL}/classes/${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` }
    })
    if (!res.ok) throw new Error("Erro ao excluir turma")
  },

  // Presença (Attendance)
  getPresencas: async (): Promise<Presenca[]> => {
    const token = getStoredToken()
    const res = await fetch(`${API_URL}/attendance`, {
      headers: { Authorization: `Bearer ${token}` }
    })
    if (!res.ok) throw new Error("Erro ao obter presenças")
    const data = await res.json()
    return data.records || []
  },

  getPresencasByData: async (date: string): Promise<Presenca[]> => {
    const token = getStoredToken()
    const res = await fetch(`${API_URL}/attendance?date=${date}`, {
      headers: { Authorization: `Bearer ${token}` }
    })
    if (!res.ok) throw new Error("Erro ao obter presenças da data")
    const data = await res.json()
    return data.records || []
  },

  saveBulkAttendance: async (date: string, records: { studentId: string, status: 'presente' | 'ausente' }[]): Promise<void> => {
    const token = getStoredToken()
    const res = await fetch(`${API_URL}/attendance`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({ date, records })
    })
    if (!res.ok) throw new Error("Erro ao salvar chamada")
  },

  // Planos de Aula (Lesson Plans)
  getPlanos: async (): Promise<PlanoAula[]> => {
    const token = getStoredToken()
    const res = await fetch(`${API_URL}/lessons`, {
      headers: { Authorization: `Bearer ${token}` }
    })
    if (!res.ok) throw new Error("Erro ao obter planos de aula")
    const data = await res.json()
    return data.lessons || []
  },

  addPlano: async (plano: Omit<PlanoAula, 'id' | 'createdAt'>): Promise<PlanoAula> => {
    const token = getStoredToken()
    const res = await fetch(`${API_URL}/lessons`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify(plano)
    })
    if (!res.ok) throw new Error("Erro ao adicionar plano de aula")
    const data = await res.json()
    return data.lesson
  },

  updatePlano: async (id: string, data: Partial<PlanoAula>): Promise<void> => {
    const token = getStoredToken()
    const res = await fetch(`${API_URL}/lessons/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify(data)
    })
    if (!res.ok) throw new Error("Erro ao atualizar plano de aula")
  },

  deletePlano: async (id: string): Promise<void> => {
    const token = getStoredToken()
    const res = await fetch(`${API_URL}/lessons/${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` }
    })
    if (!res.ok) throw new Error("Erro ao excluir plano de aula")
  },

  // Calendário (Events)
  getEvents: async (): Promise<Evento[]> => {
    const token = getStoredToken()
    const res = await fetch(`${API_URL}/events`, {
      headers: { Authorization: `Bearer ${token}` }
    })
    if (!res.ok) throw new Error("Erro ao obter eventos")
    const data = await res.json()
    return data.events || []
  },

  addEvent: async (event: Omit<Evento, 'id'>): Promise<Evento> => {
    const token = getStoredToken()
    const res = await fetch(`${API_URL}/events`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify(event)
    })
    if (!res.ok) throw new Error("Erro ao adicionar evento")
    const data = await res.json()
    return data.event
  },

  updateEvent: async (id: string, data: Partial<Evento>): Promise<void> => {
    const token = getStoredToken()
    const res = await fetch(`${API_URL}/events/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify(data)
    })
    if (!res.ok) throw new Error("Erro ao atualizar evento")
  },

  deleteEvent: async (id: string): Promise<void> => {
    const token = getStoredToken()
    const res = await fetch(`${API_URL}/events/${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` }
    })
    if (!res.ok) throw new Error("Erro ao excluir evento")
  },

  // Dashboard Stats
  getStatsAndChart: async (): Promise<{ stats: { totalAlunos: number; presentesHoje: number; aulasDoDia: number }; weeklyPresenca: { dia: string; presentes: number; ausentes: number }[] }> => {
    const token = getStoredToken()
    const res = await fetch(`${API_URL}/stats`, {
      headers: { Authorization: `Bearer ${token}` }
    })
    if (!res.ok) throw new Error("Erro ao obter estatísticas")
    return await res.json()
  }
}
