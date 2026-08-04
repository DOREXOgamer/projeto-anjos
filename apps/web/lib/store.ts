"use client"

import type { Aluno, Presenca, PlanoAula, Turma, Evento } from './types'
import {
  getStudents,
  createStudent,
  updateStudent,
  deleteStudent,
  getClasses,
  createClass,
  updateClass,
  deleteClass,
  getLessonPlans,
  createLessonPlan,
  updateLessonPlan,
  deleteLessonPlan,
  getEvents,
  createEvent,
  updateEvent,
  deleteEvent,
  getDashboardStats,
  saveAttendance
} from './api'

export const store = {
  // Alunos (Students)
  getAlunos: async (): Promise<Aluno[]> => {
    return getStudents()
  },

  addAluno: async (aluno: Omit<Aluno, 'id' | 'createdAt'>): Promise<Aluno> => {
    return createStudent(aluno)
  },

  updateAluno: async (id: string, data: Partial<Aluno>): Promise<void> => {
    return updateStudent(id, data)
  },

  deleteAluno: async (id: string): Promise<void> => {
    return deleteStudent(id)
  },

  // Turmas (Classes)
  getClasses: async (): Promise<Turma[]> => {
    return getClasses()
  },

  addClass: async (classData: Omit<Turma, 'id' | 'alunosMatriculados' | 'createdAt'>): Promise<Turma> => {
    return createClass(classData)
  },

  updateClass: async (id: string, data: Partial<Turma>): Promise<void> => {
    return updateClass(id, data)
  },

  deleteClass: async (id: string): Promise<void> => {
    return deleteClass(id)
  },

  // Presença (Attendance)
  getPresencas: async (): Promise<Presenca[]> => {
    return []
  },

  getPresencasByData: async (date: string): Promise<Presenca[]> => {
    return []
  },

  saveBulkAttendance: async (date: string, records: { studentId: string, status: 'presente' | 'ausente' }[]): Promise<void> => {
    const items = records.map(r => ({
      alunoId: r.studentId,
      data: date,
      status: r.status === 'presente' ? 'PRESENT' : 'ABSENT',
      classId: ''
    }))
    return saveAttendance(items)
  },

  // Planos de Aula (Lesson Plans)
  getPlanos: async (): Promise<PlanoAula[]> => {
    return getLessonPlans()
  },

  addPlano: async (plano: Omit<PlanoAula, 'id' | 'createdAt'>): Promise<PlanoAula> => {
    return createLessonPlan(plano)
  },

  updatePlano: async (id: string, data: Partial<PlanoAula>): Promise<void> => {
    return updateLessonPlan(id, data)
  },

  deletePlano: async (id: string): Promise<void> => {
    return deleteLessonPlan(id)
  },

  // Calendário (Events)
  getEvents: async (): Promise<Evento[]> => {
    return getEvents()
  },

  addEvent: async (event: Omit<Evento, 'id'>): Promise<Evento> => {
    return createEvent(event)
  },

  updateEvent: async (id: string, data: Partial<Evento>): Promise<void> => {
    return updateEvent(id, data)
  },

  deleteEvent: async (id: string): Promise<void> => {
    return deleteEvent(id)
  },

  // Dashboard Stats
  getStatsAndChart: async (): Promise<{ stats: { totalAlunos: number; presentesHoje: number; aulasDoDia: number }; weeklyPresenca: { dia: string; presentes: number; ausentes: number }[] }> => {
    return getDashboardStats()
  }
}

