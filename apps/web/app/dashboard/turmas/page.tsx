"use client"

import { useState, useEffect } from "react"
import { RequirePermission } from "@/components/auth/require-permission"
import { PERMISSIONS } from "@/lib/permissions"
import { 
  GraduationCap, 
  Plus, 
  Search, 
  Edit2, 
  Trash2,
  Users,
  Clock,
  MapPin,
  MoreVertical,
  Filter,
  CheckCircle,
  AlertCircle
} from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { getClasses, createClass, updateClass, deleteClass, getStudents, getCourses, getTeachers } from "@/lib/api"
import type { Turma, Aluno, Course, Teacher } from "@/lib/types"
import { Checkbox } from "@/components/ui/checkbox"

const diasSemanaOptions = ['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado']

export default function TurmasPage() {
  const [turmas, setTurmas] = useState<Turma[]>([])
  const [allStudents, setAllStudents] = useState<Aluno[]>([])
  const [courses, setCourses] = useState<Course[]>([])
  const [teachers, setTeachers] = useState<Teacher[]>([])
  const [busca, setBusca] = useState('')
  const [filtroStatus, setFiltroStatus] = useState<string>('todos')
  const [filtroCurso, setFiltroCurso] = useState<string>('todos')
  const [modalOpen, setModalOpen] = useState(false)
  const [editingTurma, setEditingTurma] = useState<Turma | null>(null)
  const [sucesso, setSucesso] = useState('')
  const [erro, setErro] = useState('')
  const [formData, setFormData] = useState({
    nome: '',
    curso: '',
    courseId: '',
    horarioInicio: '',
    horarioTermino: '',
    diasSemana: [] as string[],
    professor: '',
    professorId: '',
    capacidade: '',
    sala: '',
    status: 'ativa' as 'ativa' | 'inativa',
    studentIds: [] as string[]
  })

  useEffect(() => {
    const loadData = async () => {
      try {
        const [classes, students, fetchedCourses, fetchedTeachers] = await Promise.all([
          getClasses(),
          getStudents(),
          getCourses(),
          getTeachers()
        ])
        setTurmas(classes)
        setAllStudents(students)
        setCourses(fetchedCourses)
        setTeachers(fetchedTeachers)
      } catch (error) {
        console.error("Erro ao carregar dados:", error)
      }
    }

    loadData()
  }, [])

  const turmasFiltradas = turmas.filter(turma => {
    const matchBusca = turma.nome.toLowerCase().includes(busca.toLowerCase()) ||
                       turma.professor.toLowerCase().includes(busca.toLowerCase())
    const matchStatus = filtroStatus === 'todos' || turma.status === filtroStatus
    const matchCurso = filtroCurso === 'todos' || turma.curso === filtroCurso
    return matchBusca && matchStatus && matchCurso
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      const payload = {
        nome: formData.nome,
        curso: formData.curso,
        courseId: formData.courseId || null,
        horario: `${formData.horarioInicio} - ${formData.horarioTermino}`,
        diasSemana: formData.diasSemana,
        professor: formData.professor,
        professorId: formData.professorId || null,
        capacidade: Number(formData.capacidade),
        sala: formData.sala,
        status: formData.status,
        studentIds: formData.studentIds,
      }

      if (editingTurma) {
        await updateClass(editingTurma.id, payload)
      } else {
        await createClass(payload)
      }

      const classes = await getClasses()
      setTurmas(classes)
      resetForm()
      setModalOpen(false)
      setSucesso(editingTurma ? 'Turma atualizada com sucesso!' : 'Turma criada com sucesso!')
      setTimeout(() => { setSucesso(''); setErro('') }, 4000)
    } catch (error) {
      console.error("Erro ao salvar turma:", error)
      setErro(error instanceof Error ? error.message : 'Erro ao salvar turma. Tente novamente.')
      setTimeout(() => setErro(''), 4000)
    }
  }

  const resetForm = () => {
    setFormData({
      nome: '',
      curso: '',
      courseId: '',
      horarioInicio: '',
      horarioTermino: '',
      diasSemana: [],
      professor: '',
      professorId: '',
      capacidade: '',
      sala: '',
      status: 'ativa',
      studentIds: []
    })
    setEditingTurma(null)
  }

  const handleEdit = (turma: Turma) => {
    const parts = (turma.horario || '').split(' - ')
    const horarioInicio = parts[0] || ''
    const horarioTermino = parts[1] || ''

    setEditingTurma(turma)
    setFormData({
      nome: turma.nome,
      curso: turma.curso,
      courseId: turma.courseId ?? '',
      horarioInicio,
      horarioTermino,
      diasSemana: turma.diasSemana,
      professor: turma.professor,
      professorId: turma.professorId ?? '',
      capacidade: String(turma.capacidade),
      sala: turma.sala,
      status: turma.status,
      studentIds: turma.studentIds ?? []
    })
    setModalOpen(true)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir esta turma?')) return
    try {
      await deleteClass(id)
      const classes = await getClasses()
      setTurmas(classes)
      setSucesso('Turma excluída com sucesso!')
      setTimeout(() => setSucesso(''), 4000)
    } catch (error) {
      console.error("Erro ao excluir turma:", error)
      setErro(error instanceof Error ? error.message : 'Erro ao excluir turma.')
      setTimeout(() => setErro(''), 4000)
    }
  }

  const toggleDiaSemana = (dia: string) => {
    setFormData(prev => ({
      ...prev,
      diasSemana: prev.diasSemana.includes(dia)
        ? prev.diasSemana.filter(d => d !== dia)
        : [...prev.diasSemana, dia]
    }))
  }

  const getOcupacao = (turma: Turma) => {
    if (!turma.capacidade || turma.capacidade <= 0) {
      return { color: 'bg-green-500', text: 'Disponível' }
    }
    const percent = (turma.alunosMatriculados / turma.capacidade) * 100
    if (percent >= 100) return { color: 'bg-destructive', text: 'Lotada' }
    if (percent >= 80) return { color: 'bg-yellow-500', text: 'Quase lotada' }
    return { color: 'bg-green-500', text: 'Disponível' }
  }

  return (
    <RequirePermission permission={PERMISSIONS.TURMAS}>
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Turmas</h1>
          <p className="text-muted-foreground">Gerencie as turmas do projeto</p>
        </div>
        
        <Dialog open={modalOpen} onOpenChange={(open) => {
          setModalOpen(open)
          if (!open) resetForm()
        }}>
          <DialogTrigger asChild>
            <Button className="bg-primary hover:bg-primary/90">
              <Plus className="h-4 w-4 mr-2" />
              Nova Turma
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingTurma ? 'Editar Turma' : 'Nova Turma'}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid gap-4">
                <div className="space-y-2">
                  <Label htmlFor="nome">Nome da Turma</Label>
                  <Input
                    id="nome"
                    value={formData.nome}
                    onChange={(e) => setFormData({...formData, nome: e.target.value})}
                    placeholder="Ex: Música - Manhã"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="curso">Curso</Label>
                    <Select
                      value={formData.courseId}
                      onValueChange={(value) => {
                        const course = courses.find(c => c.id === value)
                        const courseName = course ? course.name : ''
                        setFormData(prev => ({
                          ...prev,
                          courseId: value,
                          curso: courseName,
                          studentIds: prev.studentIds.filter(id => {
                            const student = allStudents.find(s => s.id === id)
                            return student?.curso.split(',').map(c => c.trim()).includes(courseName)
                          })
                        }))
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione" />
                      </SelectTrigger>
                      <SelectContent>
                        {courses.map(course => (
                          <SelectItem key={course.id} value={course.id}>{course.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Horário (Início / Fim)</Label>
                    <div className="flex items-center gap-2">
                      <Input
                        type="time"
                        value={formData.horarioInicio}
                        onChange={(e) => setFormData({ ...formData, horarioInicio: e.target.value })}
                        required
                        className="w-full"
                      />
                      <span className="text-muted-foreground">-</span>
                      <Input
                        type="time"
                        value={formData.horarioTermino}
                        onChange={(e) => setFormData({ ...formData, horarioTermino: e.target.value })}
                        required
                        className="w-full"
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Dias da Semana</Label>
                  <div className="flex flex-wrap gap-2">
                    {diasSemanaOptions.map(dia => (
                      <Button
                        key={dia}
                        type="button"
                        variant={formData.diasSemana.includes(dia) ? "default" : "outline"}
                        size="sm"
                        onClick={() => toggleDiaSemana(dia)}
                        className={formData.diasSemana.includes(dia) ? "bg-primary" : ""}
                      >
                        {dia.slice(0, 3)}
                      </Button>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="professor">Professor</Label>
                  <Select
                    value={formData.professorId}
                    onValueChange={(value) => {
                      const teacher = teachers.find(t => t.id === value)
                      setFormData(prev => ({
                        ...prev,
                        professorId: value,
                        professor: teacher ? teacher.name : ''
                      }))
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o professor" />
                    </SelectTrigger>
                    <SelectContent>
                      {teachers.map(teacher => (
                        <SelectItem key={teacher.id} value={teacher.id}>
                          {teacher.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="capacidade">Capacidade</Label>
                    <Input
                      id="capacidade"
                      type="number"
                      value={formData.capacidade}
                      onChange={(e) => setFormData({...formData, capacidade: e.target.value})}
                      placeholder="20"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="sala">Sala</Label>
                    <Input
                      id="sala"
                      value={formData.sala}
                      onChange={(e) => setFormData({...formData, sala: e.target.value})}
                      placeholder="Sala 01"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="status">Status</Label>
                  <Select
                    value={formData.status}
                    onValueChange={(value: 'ativa' | 'inativa') => setFormData({...formData, status: value})}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ativa">Ativa</SelectItem>
                      <SelectItem value="inativa">Inativa</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Alunos da Turma</Label>
                  <div className="border border-border rounded-md p-3 max-h-48 overflow-y-auto space-y-2 bg-background">
                    {!formData.curso ? (
                      <p className="text-xs text-muted-foreground py-2 text-center">Selecione um curso para ver os alunos disponíveis</p>
                    ) : (() => {
                      const filteredStudents = allStudents.filter(aluno => aluno.curso.split(',').map(c => c.trim()).includes(formData.curso))
                      return filteredStudents.length === 0 ? (
                        <p className="text-xs text-muted-foreground py-2 text-center">Nenhum aluno cadastrado neste curso</p>
                      ) : (
                        filteredStudents.map(aluno => {
                          const isChecked = formData.studentIds.includes(aluno.id)
                          return (
                            <div key={aluno.id} className="flex items-center space-x-2">
                              <Checkbox
                                id={`student-${aluno.id}`}
                                checked={isChecked}
                                onCheckedChange={(checked) => {
                                  setFormData(prev => ({
                                    ...prev,
                                    studentIds: checked
                                      ? [...prev.studentIds, aluno.id]
                                      : prev.studentIds.filter(id => id !== aluno.id)
                                  }))
                                }}
                              />
                              <label
                                htmlFor={`student-${aluno.id}`}
                                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                              >
                                {aluno.nome}
                              </label>
                            </div>
                          )
                        })
                      )
                    })()}
                  </div>
                </div>
              </div>

              <DialogFooter>
                <DialogClose asChild>
                  <Button type="button" variant="outline">Cancelar</Button>
                </DialogClose>
                <Button type="submit" className="bg-primary hover:bg-primary/90">
                  {editingTurma ? 'Salvar' : 'Cadastrar'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Feedback Alerts */}
      {sucesso && (
        <Alert className="bg-success/10 border-success/30 text-success">
          <CheckCircle className="h-4 w-4" />
          <AlertDescription>{sucesso}</AlertDescription>
        </Alert>
      )}
      {erro && (
        <Alert variant="destructive" className="bg-destructive/10 border-destructive/30">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{erro}</AlertDescription>
        </Alert>
      )}

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nome ou professor..."
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={filtroCurso} onValueChange={setFiltroCurso}>
          <SelectTrigger className="w-full sm:w-40">
            <SelectValue placeholder="Curso" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos os cursos</SelectItem>
            {courses.map(course => (
              <SelectItem key={course.id} value={course.name}>{course.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={filtroStatus} onValueChange={setFiltroStatus}>
          <SelectTrigger className="w-full sm:w-36">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos</SelectItem>
            <SelectItem value="ativa">Ativas</SelectItem>
            <SelectItem value="inativa">Inativas</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <GraduationCap className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{turmas.filter(t => t.status === 'ativa').length}</p>
                <p className="text-xs text-muted-foreground">Turmas Ativas</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-green-500/10">
                <Users className="h-5 w-5 text-green-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{turmas.reduce((acc, t) => acc + t.alunosMatriculados, 0)}</p>
                <p className="text-xs text-muted-foreground">Total de Alunos</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-500/10">
                <MapPin className="h-5 w-5 text-blue-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{new Set(turmas.map(t => t.sala)).size}</p>
                <p className="text-xs text-muted-foreground">Salas Utilizadas</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-yellow-500/10">
                <Clock className="h-5 w-5 text-yellow-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{turmas.reduce((acc, t) => acc + t.capacidade, 0)}</p>
                <p className="text-xs text-muted-foreground">Capacidade Total</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Turmas Grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {turmasFiltradas.map((turma) => {
          const ocupacao = getOcupacao(turma)
          return (
            <Card key={turma.id} className={turma.status === 'inativa' ? 'opacity-60' : ''}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <CardTitle className="text-lg">{turma.nome}</CardTitle>
                    <Badge variant={turma.status === 'ativa' ? 'default' : 'secondary'}>
                      {turma.status === 'ativa' ? 'Ativa' : 'Inativa'}
                    </Badge>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => handleEdit(turma)}>
                        <Edit2 className="h-4 w-4 mr-2" />
                        Editar
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        onClick={() => handleDelete(turma.id)}
                        className="text-destructive"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Excluir
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Clock className="h-4 w-4" />
                  <span>{turma.horario}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <MapPin className="h-4 w-4" />
                  <span>{turma.sala}</span>
                </div>
                <div className="flex flex-wrap gap-1">
                  {turma.diasSemana.map(dia => (
                    <Badge key={dia} variant="outline" className="text-xs">
                      {dia.slice(0, 3)}
                    </Badge>
                  ))}
                </div>
                <div className="text-sm">
                  <span className="text-muted-foreground">Professor: </span>
                  <span className="font-medium">{turma.professor}</span>
                </div>
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Ocupação</span>
                    <span className="font-medium">{turma.alunosMatriculados}/{turma.capacidade}</span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div 
                      className={`h-full ${ocupacao.color} transition-all`}
                      style={{ width: `${turma.capacidade && turma.capacidade > 0 ? Math.min((turma.alunosMatriculados / turma.capacidade) * 100, 100) : 0}%` }}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">{ocupacao.text}</p>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {turmasFiltradas.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <GraduationCap className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="font-semibold text-lg mb-1">Nenhuma turma encontrada</h3>
            <p className="text-muted-foreground text-sm">
              Tente ajustar os filtros ou cadastre uma nova turma.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
    </RequirePermission>
  )
}


