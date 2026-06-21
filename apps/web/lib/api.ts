import { API_URL, getStoredToken } from './auth'
import type { Aluno, Turma, Course, Evento, PlanoAula, Teacher, Announcement, Nota } from './types'

export type { Announcement, Nota }

export interface StudentStats {
  totalCount: number
  newRegistrations7d: number
  presentToday: number
  recentStudents: Array<{
    id: string
    name: string
    createdAt: string
  }>
  riskStudents?: Array<{
    id: string
    nome: string
    curso: string
    mediaNotas: number | null
    frequencia: number | null
    motivo: string
  }>
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getStoredToken()
  const headers = new Headers(options.headers)
  if (token) {
    headers.set('Authorization', `Bearer ${token}`)
  }
  if (options.body && !(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json')
  }
  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers,
  })
  const text = await res.text()
  let data
  try {
    data = text ? JSON.parse(text) : {}
  } catch {
    data = {}
  }
  if (!res.ok) {
    throw new Error(data.error || `Request failed with status ${res.status}`)
  }
  return data
}

// Students (Alunos)
export async function getStudents(): Promise<Aluno[]> {
  const data = await request<{ students: Aluno[] }>('/students')
  return data.students || []
}

export async function createStudent(student: any): Promise<Aluno> {
  const data = await request<{ student: Aluno }>('/students', {
    method: 'POST',
    body: JSON.stringify(student),
  })
  return data.student
}

export async function updateStudent(id: string, student: any): Promise<void> {
  await request<void>(`/students/${id}`, {
    method: 'PUT',
    body: JSON.stringify(student),
  })
}

export async function deleteStudent(id: string): Promise<void> {
  await request<void>(`/students/${id}`, {
    method: 'DELETE',
  })
}

// Classes (Turmas)
export async function getClasses(): Promise<Turma[]> {
  const data = await request<{ classes: Turma[] }>('/classes')
  return data.classes || []
}

export async function createClass(classData: any): Promise<Turma> {
  const data = await request<{ class: Turma }>('/classes', {
    method: 'POST',
    body: JSON.stringify(classData),
  })
  return data.class
}

export async function updateClass(id: string, data: any): Promise<void> {
  await request<void>(`/classes/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  })
}

export async function deleteClass(id: string): Promise<void> {
  await request<void>(`/classes/${id}`, {
    method: 'DELETE',
  })
}

// Courses (Cursos)
export async function getCourses(): Promise<Course[]> {
  const data = await request<{ courses: Course[] }>('/courses')
  return data.courses || []
}

export async function createCourse(course: any): Promise<Course> {
  const data = await request<{ course: Course }>('/courses', {
    method: 'POST',
    body: JSON.stringify(course),
  })
  return data.course
}

export async function updateCourse(id: string, course: any): Promise<void> {
  await request<void>(`/courses/${id}`, {
    method: 'PUT',
    body: JSON.stringify(course),
  })
}

export async function deleteCourse(id: string): Promise<void> {
  await request<void>(`/courses/${id}`, {
    method: 'DELETE',
  })
}

// Teachers (Professores)
export async function getTeachers(): Promise<Teacher[]> {
  const data = await request<{ teachers: Teacher[] }>('/users/teachers')
  return data.teachers || []
}

export async function updateTeacher(id: string, teacher: any): Promise<any> {
  return await request<any>(`/users/teachers/${id}`, {
    method: 'PUT',
    body: JSON.stringify(teacher),
  })
}

export async function deleteTeacher(id: string): Promise<void> {
  await request<void>(`/users/teachers/${id}`, {
    method: 'DELETE',
  })
}

export async function resetPassword(id: string, payload: { password: string }): Promise<void> {
  await request<void>(`/users/teachers/${id}/reset-password`, {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

// Profile & Password settings (Configurações)
export async function updateProfile(profile: any): Promise<any> {
  return await request<any>('/users/profile', {
    method: 'PUT',
    body: JSON.stringify(profile),
  })
}

export async function changePassword(payload: any): Promise<any> {
  return await request<any>('/users/change-password', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

// Stats & Reports
export async function getStudentsStats(): Promise<StudentStats> {
  return await request<StudentStats>('/stats/students')
}

export async function getReportsStats(): Promise<any> {
  return await request<any>('/stats/reports')
}

// Attendance (Presença)
export async function getAttendanceByDate(date: string, classId: string): Promise<Record<string, boolean>> {
  const data = await request<{ records: any[] }>(`/attendance?date=${date}&classId=${classId}`)
  const map: Record<string, boolean> = {}
  data.records.forEach(r => {
    map[r.alunoId] = r.status === 'presente' || r.status === 'PRESENT'
  })
  return map
}

export async function saveAttendance(items: Array<{ alunoId: string; data: string; status: string; classId: string }>): Promise<void> {
  if (items.length === 0) return
  const date = items[0].data
  const classId = items[0].classId
  const records = items.map(item => ({
    studentId: item.alunoId,
    status: item.status === 'PRESENT' ? 'presente' : 'ausente',
  }))
  await request<void>('/attendance', {
    method: 'POST',
    body: JSON.stringify({ date, classId, records }),
  })
}

export async function getAttendanceHistory(classId: string, startDate: string, endDate: string): Promise<any[]> {
  const data = await request<{ records: any[] }>(`/attendance?classId=${classId}&startDate=${startDate}&endDate=${endDate}`)
  return data.records || []
}

// Lesson Plans (Planos de Aula)
export async function getLessonPlans(): Promise<PlanoAula[]> {
  const data = await request<{ lessons: PlanoAula[] }>('/lessons')
  return data.lessons || []
}

export async function createLessonPlan(plan: any): Promise<PlanoAula> {
  const data = await request<{ lesson: PlanoAula }>('/lessons', {
    method: 'POST',
    body: JSON.stringify(plan),
  })
  return data.lesson
}

export async function updateLessonPlan(id: string, plan: any): Promise<void> {
  await request<void>(`/lessons/${id}`, {
    method: 'PUT',
    body: JSON.stringify(plan),
  })
}

export async function deleteLessonPlan(id: string): Promise<void> {
  await request<void>(`/lessons/${id}`, {
    method: 'DELETE',
  })
}

// Events (Calendário)
export async function getEvents(): Promise<Evento[]> {
  const data = await request<{ events: Evento[] }>('/events')
  return data.events || []
}

export async function createEvent(event: any): Promise<Evento> {
  const data = await request<{ event: Evento }>('/events', {
    method: 'POST',
    body: JSON.stringify(event),
  })
  return data.event
}

export async function updateEvent(id: string, event: any): Promise<void> {
  await request<void>(`/events/${id}`, {
    method: 'PUT',
    body: JSON.stringify(event),
  })
}

export async function deleteEvent(id: string): Promise<void> {
  await request<void>(`/events/${id}`, {
    method: 'DELETE',
  })
}

// Announcements (Avisos)
export async function getAnnouncements(): Promise<Announcement[]> {
  const data = await request<{ announcements: Announcement[] }>('/announcements')
  return data.announcements || []
}

export async function createAnnouncement(announcement: any): Promise<Announcement> {
  const data = await request<{ announcement: Announcement }>('/announcements', {
    method: 'POST',
    body: JSON.stringify(announcement),
  })
  return data.announcement
}

export async function deleteAnnouncement(id: string): Promise<void> {
  await request<void>(`/announcements/${id}`, {
    method: 'DELETE',
  })
}

// Grades (Notas)
export async function getGrades(classId?: string, studentId?: string): Promise<Nota[]> {
  let query = ''
  const params: string[] = []
  if (classId) params.push(`classId=${classId}`)
  if (studentId) params.push(`studentId=${studentId}`)
  if (params.length > 0) {
    query = `?${params.join('&')}`
  }
  const data = await request<{ grades: Nota[] }>(`/grades${query}`)
  return data.grades || []
}

export async function createGrade(grade: any): Promise<Nota> {
  const data = await request<{ grade: Nota }>('/grades', {
    method: 'POST',
    body: JSON.stringify(grade),
  })
  return data.grade
}

export async function updateGrade(id: string, grade: any): Promise<void> {
  await request<void>(`/grades/${id}`, {
    method: 'PUT',
    body: JSON.stringify(grade),
  })
}

export async function deleteGrade(id: string): Promise<void> {
  await request<void>(`/grades/${id}`, {
    method: 'DELETE',
  })
}

// Audit Logs (Logs de Auditoria)
export interface AuditLog {
  id: string
  userId: string
  userName: string
  userRole: string
  action: string
  resource: string
  description: string
  targetId?: string | null
  createdAt: string
}

export async function getAuditLogs(): Promise<AuditLog[]> {
  const data = await request<{ logs: AuditLog[] }>('/audit-logs')
  return data.logs || []
}
