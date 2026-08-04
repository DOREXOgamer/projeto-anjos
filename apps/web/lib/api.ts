import { supabase } from './supabase'
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

async function supabaseFallback<T>(path: string, options: RequestInit = {}): Promise<T> {
  const method = (options.method || 'GET').toUpperCase()
  const body = options.body ? JSON.parse(options.body as string) : {}

  if (path.startsWith('/students')) {
    if (method === 'GET') {
      const { data } = await supabase.from('students').select('*').order('created_at', { ascending: false })
      const students = (data || []).map((s: any) => ({
        id: s.id,
        nome: s.nome,
        cpf: s.cpf,
        dataNascimento: s.data_nascimento || s.dataNascimento,
        email: s.email || '',
        telefone: s.telefone || '',
        endereco: s.endereco || '',
        curso: s.curso || '',
        classId: s.class_id || s.classId || null,
        classIds: s.class_ids || s.classIds || [],
        createdAt: s.created_at,
      }))
      return { students } as unknown as T
    }
    if (method === 'POST') {
      const id = crypto.randomUUID()
      const row = {
        id,
        nome: body.nome,
        cpf: body.cpf,
        data_nascimento: body.dataNascimento,
        email: body.email || '',
        telefone: body.telefone || '',
        endereco: body.endereco || '',
        curso: body.curso || '',
        class_id: body.classId || null,
        class_ids: body.classIds || [],
        created_at: new Date().toISOString()
      }
      await supabase.from('students').insert(row)
      return { student: { id, ...body, createdAt: row.created_at } } as unknown as T
    }
    if (method === 'PUT') {
      const id = path.replace('/students/', '')
      const updateRow: any = {}
      if (body.nome !== undefined) updateRow.nome = body.nome
      if (body.cpf !== undefined) updateRow.cpf = body.cpf
      if (body.dataNascimento !== undefined) updateRow.data_nascimento = body.dataNascimento
      if (body.email !== undefined) updateRow.email = body.email
      if (body.telefone !== undefined) updateRow.telefone = body.telefone
      if (body.endereco !== undefined) updateRow.endereco = body.endereco
      if (body.curso !== undefined) updateRow.curso = body.curso
      if (body.classId !== undefined) updateRow.class_id = body.classId
      if (body.classIds !== undefined) updateRow.class_ids = body.classIds
      await supabase.from('students').update(updateRow).eq('id', id)
      return { success: true } as unknown as T
    }
    if (method === 'DELETE') {
      const id = path.replace('/students/', '')
      await supabase.from('students').delete().eq('id', id)
      return { success: true } as unknown as T
    }
  }

  if (path.startsWith('/classes')) {
    if (method === 'GET') {
      const { data } = await supabase.from('classes').select('*').order('created_at', { ascending: false })
      const classes = (data || []).map((c: any) => ({
        id: c.id,
        nome: c.nome,
        curso: c.curso,
        courseId: c.course_id || c.courseId || '',
        horario: c.horario,
        diasSemana: c.dias_semana || c.diasSemana || [],
        professor: c.professor,
        professorId: c.professor_id || c.professorId || '',
        capacidade: c.capacidade,
        alunosMatriculados: c.alunos_matriculados || c.alunosMatriculados || 0,
        sala: c.sala,
        status: c.status,
        createdAt: c.created_at,
      }))
      return { classes } as unknown as T
    }
    if (method === 'POST') {
      const id = crypto.randomUUID()
      const row = {
        id,
        nome: body.nome,
        curso: body.curso,
        course_id: body.courseId || null,
        horario: body.horario,
        dias_semana: body.diasSemana || [],
        professor: body.professor,
        professor_id: body.professorId || null,
        capacidade: body.capacidade,
        alunos_matriculados: 0,
        sala: body.sala,
        status: body.status,
        created_at: new Date().toISOString()
      }
      await supabase.from('classes').insert(row)
      return { class: { id, ...body, alunosMatriculados: 0, createdAt: row.created_at } } as unknown as T
    }
    if (method === 'PUT') {
      const id = path.replace('/classes/', '')
      await supabase.from('classes').update(body).eq('id', id)
      return { success: true } as unknown as T
    }
    if (method === 'DELETE') {
      const id = path.replace('/classes/', '')
      await supabase.from('classes').delete().eq('id', id)
      return { success: true } as unknown as T
    }
  }

  if (path.startsWith('/attendance')) {
    if (method === 'GET') {
      const { data } = await supabase.from('attendances').select('*')
      const records = (data || []).map((a: any) => ({
        id: a.id,
        alunoId: a.student_id || a.studentId,
        studentId: a.student_id || a.studentId,
        data: a.date,
        date: a.date,
        status: (a.status === 'presente' || a.status === 'PRESENT') ? 'PRESENT' : 'ABSENT',
        classId: a.class_id || a.classId,
      }))
      return { records } as unknown as T
    }
    if (method === 'POST') {
      const { date, classId, records } = body
      if (records && records.length > 0) {
        const studentIds = records.map((r: any) => r.studentId)
        await supabase.from('attendances').delete().eq('date', date).in('student_id', studentIds)
        const docs = records.map((r: any) => ({
          id: crypto.randomUUID(),
          student_id: r.studentId,
          class_id: classId || '',
          date,
          status: (r.status === 'PRESENT' || r.status === 'presente') ? 'presente' : 'ausente',
          created_at: new Date().toISOString()
        }))
        await supabase.from('attendances').insert(docs)
      }
      return { success: true } as unknown as T
    }
  }

  if (path.startsWith('/lessons')) {
    if (method === 'GET') {
      const { data } = await supabase.from('lessons').select('*').order('created_at', { ascending: false })
      const lessons = (data || []).map((l: any) => ({
        id: l.id,
        data: l.data,
        endDate: l.end_date || l.endDate || '',
        turma: l.turma,
        classId: l.class_id || l.classId || '',
        disciplina: l.disciplina,
        conteudo: l.conteudo,
        observacoes: l.observacoes || '',
        files: l.files || [],
        createdAt: l.created_at,
      }))
      return { lessons } as unknown as T
    }
    if (method === 'POST') {
      const id = crypto.randomUUID()
      const row = {
        id,
        data: body.data,
        end_date: body.endDate || '',
        turma: body.turma,
        class_id: body.classId || '',
        disciplina: body.disciplina,
        conteudo: body.conteudo,
        observacoes: body.observacoes || '',
        files: body.files || [],
        created_at: new Date().toISOString()
      }
      await supabase.from('lessons').insert(row)
      return { lesson: { id, ...body, createdAt: row.created_at } } as unknown as T
    }
    if (method === 'DELETE') {
      const id = path.replace('/lessons/', '')
      await supabase.from('lessons').delete().eq('id', id)
      return { success: true } as unknown as T
    }
  }

  if (path.startsWith('/announcements')) {
    if (method === 'GET') {
      const { data } = await supabase.from('announcements').select('*').order('created_at', { ascending: false }).limit(20)
      const announcements = (data || []).map((a: any) => ({
        id: a.id,
        title: a.title,
        body: a.content || a.body,
        attachments: a.attachments || [],
        createdAt: a.created_at,
        author: { name: a.author_name || 'Administração' }
      }))
      return { announcements } as unknown as T
    }
    if (method === 'POST') {
      const id = crypto.randomUUID()
      const row = {
        id,
        title: body.title,
        content: body.body,
        attachments: body.attachments || [],
        author_name: 'Administração',
        created_at: new Date().toISOString()
      }
      await supabase.from('announcements').insert(row)
      return { announcement: { id, title: body.title, body: body.body, attachments: body.attachments || [], createdAt: row.created_at } } as unknown as T
    }
    if (method === 'DELETE') {
      const id = path.replace('/announcements/', '')
      await supabase.from('announcements').delete().eq('id', id)
      return { success: true } as unknown as T
    }
  }

  if (path.startsWith('/courses')) {
    if (method === 'GET') {
      const { data } = await supabase.from('courses').select('*').order('created_at', { ascending: false })
      const courses = (data || []).map((c: any) => ({ id: c.id, name: c.name, description: c.description || '' }))
      return { courses } as unknown as T
    }
    if (method === 'POST') {
      const id = crypto.randomUUID()
      const row = { id, name: body.name, description: body.description || '', created_at: new Date().toISOString() }
      await supabase.from('courses').insert(row)
      return { course: { id, ...body } } as unknown as T
    }
  }

  if (path.startsWith('/events')) {
    if (method === 'GET') {
      const { data } = await supabase.from('events').select('*').order('date', { ascending: true })
      const events = (data || []).map((e: any) => ({
        id: e.id,
        titulo: e.title || e.titulo,
        descricao: e.description || e.descricao || '',
        data: e.date || e.data,
        horario: e.time || e.horario || '',
        tipo: e.type || e.tipo,
        turmaId: e.turma_id || e.turmaId || ''
      }))
      return { events } as unknown as T
    }
    if (method === 'POST') {
      const id = crypto.randomUUID()
      const row = { id, title: body.titulo, description: body.descricao || '', date: body.data, time: body.horario || '', type: body.tipo, created_at: new Date().toISOString() }
      await supabase.from('events').insert(row)
      return { event: { id, ...body } } as unknown as T
    }
  }

  if (path.startsWith('/teachers')) {
    if (method === 'GET') {
      const { data } = await supabase.from('users').select('*').neq('role', 'STUDENT').order('created_at', { ascending: false })
      const teachers = (data || []).map((t: any) => ({
        id: t.id,
        name: t.name,
        email: t.email,
        role: t.role || 'TEACHER',
        permissions: t.permissions || [],
        active: t.active !== false,
        cpf: t.cpf || '',
        telefone: t.telefone || '',
        dataNascimento: t.data_nascimento || t.dataNascimento || '',
        endereco: t.endereco || '',
        createdAt: t.created_at,
      }))
      return { teachers } as unknown as T
    }
    if (method === 'POST') {
      const id = crypto.randomUUID()
      const row = { id, name: body.name, email: body.email, role: body.role || 'TEACHER', permissions: body.permissions || [], active: true, created_at: new Date().toISOString() }
      await supabase.from('users').insert(row)
      return { user: { id, ...body, active: true, createdAt: row.created_at } } as unknown as T
    }
    if (method === 'DELETE') {
      const id = path.replace('/teachers/', '')
      await supabase.from('users').delete().eq('id', id)
      return { success: true } as unknown as T
    }
  }

  if (path.startsWith('/stats')) {
    const { count: totalAlunos } = await supabase.from('students').select('*', { count: 'exact', head: true })
    const { count: activeClasses } = await supabase.from('classes').select('*', { count: 'exact', head: true }).eq('status', 'ativa')
    const { count: totalLessonPlans } = await supabase.from('lessons').select('*', { count: 'exact', head: true })
    const { count: totalAttendances } = await supabase.from('attendances').select('*', { count: 'exact', head: true })
    return {
      stats: { totalAlunos: totalAlunos || 0, presentesHoje: 0, aulasDoDia: 0 },
      weeklyPresenca: [],
      riskStudents: [],
      totalCount: totalAlunos || 0,
      newRegistrations7d: 0,
      presentToday: 0,
      recentStudents: [],
      totalStudents: totalAlunos || 0,
      activeClasses: activeClasses || 0,
      totalLessonPlans: totalLessonPlans || 0,
      totalAttendances: totalAttendances || 0,
      courseDistribution: [],
      presencaMensal: [],
      matriculasMensais: []
    } as unknown as T
  }

  return {} as T
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

  try {
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
  } catch (err: any) {
    if (err instanceof TypeError || err.message?.includes('Failed to fetch') || err.message?.includes('NetworkError')) {
      return supabaseFallback<T>(path, options)
    }
    throw err
  }
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
export async function getDashboardStats(): Promise<{ stats: { totalAlunos: number; presentesHoje: number; aulasDoDia: number }; weeklyPresenca: { dia: string; presentes: number; ausentes: number }[] }> {
  return await request<{ stats: { totalAlunos: number; presentesHoje: number; aulasDoDia: number }; weeklyPresenca: { dia: string; presentes: number; ausentes: number }[] }>('/stats')
}

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

export async function updateAnnouncement(id: string, announcement: any): Promise<void> {
  await request<void>(`/announcements/${id}`, {
    method: 'PUT',
    body: JSON.stringify(announcement),
  })
}

export async function deleteAnnouncement(id: string): Promise<void> {
  await request<void>(`/announcements/${id}`, {
    method: 'DELETE',
    body: undefined,
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
