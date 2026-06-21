"use client"

import { useState, useEffect } from "react"
import { RequirePermission } from "@/components/auth/require-permission"
import { useAuth } from "@/components/auth/auth-provider"
import { toast } from "sonner"
import { PERMISSIONS } from "@/lib/permissions"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { FieldGroup, Field, FieldLabel } from "@/components/ui/field"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { 
  CheckCircle, 
  Trash2, 
  Edit3, 
  PlusCircle, 
  ClipboardList, 
  Search, 
  GraduationCap, 
  BookOpen, 
  TrendingUp, 
  AlertTriangle, 
  Loader2,
  Calendar,
  Filter,
  User,
  FileText,
  Percent
} from "lucide-react"
import { 
  getStudents, 
  getClasses, 
  getGrades, 
  createGrade, 
  updateGrade, 
  deleteGrade,
  getCourses
} from "@/lib/api"
import type { Aluno, Turma, Nota, Course } from "@/lib/types"

const CURSOS_PADRAO = [
  "Música",
  "Teatro",
  "Artesanato",
  "Informática",
  "Ballet",
  "Futebol",
  "Outro"
]

export default function NotasPage() {
  const { user } = useAuth()

  const getLocalDateString = () => {
    const d = new Date()
    const year = d.getFullYear()
    const month = String(d.getMonth() + 1).padStart(2, '0')
    const day = String(d.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  }

  // Data states
  const [alunos, setAlunos] = useState<Aluno[]>([])
  const [turmas, setTurmas] = useState<Turma[]>([])
  const [grades, setGrades] = useState<Nota[]>([])
  const [cursosList, setCursosList] = useState<Course[]>([])
  const [loading, setLoading] = useState(true)

  // Tab 1: Lançamento states
  const [lancClassId, setLancClassId] = useState("")
  const [lancDisciplinaSel, setLancDisciplinaSel] = useState("Música")
  const [lancDisciplinaCustom, setLancDisciplinaCustom] = useState("")
  const [lancTipo, setLancTipo] = useState<'prova' | 'trabalho' | 'participacao' | 'outro'>("prova")
  const [lancNotaMaxima, setLancNotaMaxima] = useState(10)
  const [lancData, setLancData] = useState(getLocalDateString())
  const [lancValores, setLancValores] = useState<Record<string, { nota: string; obs: string }>>({})
  const [savingLanc, setSavingLanc] = useState(false)

  // Tab 2: Consulta states / Filtros
  const [filtroClassId, setFiltroClassId] = useState("todas")
  const [filtroDisciplina, setFiltroDisciplina] = useState("todas")
  const [filtroTipo, setFiltroTipo] = useState("todos")
  const [filtroAlunoName, setFiltroAlunoName] = useState("")

  // Tab 3: Boletim states
  const [boletimStudentId, setBoletimStudentId] = useState("")

  // Edit Dialog states
  const [editGrade, setEditGrade] = useState<Nota | null>(null)
  const [editNota, setEditNota] = useState("")
  const [editNotaMaxima, setEditNotaMaxima] = useState("")
  const [editObservacoes, setEditObservacoes] = useState("")
  const [editTipo, setEditTipo] = useState<'prova' | 'trabalho' | 'participacao' | 'outro'>("prova")
  const [editDisciplina, setEditDisciplina] = useState("")
  const [editData, setEditData] = useState("")
  const [savingEdit, setSavingEdit] = useState(false)

  // Delete Confirm states
  const [deleteGradeId, setDeleteGradeId] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)

  // Load initial data
  const loadData = async () => {
    setLoading(true)
    try {
      const [alunosData, turmasData, gradesData, coursesData] = await Promise.all([
        getStudents(),
        getClasses(),
        getGrades(),
        getCourses()
      ])
      setAlunos(alunosData)
      setTurmas(turmasData)
      setGrades(gradesData)
      setCursosList(coursesData)
      
      const activeClasses = turmasData.filter(t => t.status === "ativa")
      if (activeClasses.length > 0) {
        const initialClass = activeClasses[0]
        setLancClassId(initialClass.id)
        
        const courseExists = coursesData.some(c => c.name === initialClass.curso) || CURSOS_PADRAO.includes(initialClass.curso)
        if (courseExists) {
          setLancDisciplinaSel(initialClass.curso)
        } else {
          setLancDisciplinaSel("Outro")
          setLancDisciplinaCustom(initialClass.curso)
        }
      } else if (coursesData.length > 0) {
        setLancDisciplinaSel(coursesData[0].name)
      }
    } catch (err) {
      console.error("Erro ao carregar dados de notas:", err)
      toast.error("Não foi possível carregar as informações do sistema.")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  // Action: Launch Grades in Bulk
  const handleLaunchGrades = async () => {
    const finalDisciplina = lancDisciplinaSel === "Outro" ? lancDisciplinaCustom : lancDisciplinaSel
    if (!lancClassId) {
      toast.error("Selecione uma turma.")
      return
    }
    if (!finalDisciplina.trim()) {
      toast.error("Informe o nome do curso.")
      return
    }

    const studentsInClass = alunos.filter(a => 
      a.classId === lancClassId || (Array.isArray(a.classIds) && a.classIds.includes(lancClassId))
    )

    // Build payload only for students who have a grade set
    const gradesToCreate = studentsInClass
      .map(student => {
        const studentData = lancValores[student.id]
        if (!studentData || studentData.nota === "") return null
        
        const notaNum = parseFloat(studentData.nota)
        if (isNaN(notaNum) || notaNum < 0 || notaNum > lancNotaMaxima) {
          throw new Error(`A nota do aluno ${student.nome} deve ser entre 0 e ${lancNotaMaxima}.`)
        }

        return {
          studentId: student.id,
          classId: lancClassId,
          disciplina: finalDisciplina,
          tipo: lancTipo,
          nota: notaNum,
          notaMaxima: lancNotaMaxima,
          data: lancData,
          observacoes: studentData.obs || ""
        }
      })
      .filter(Boolean)

    if (gradesToCreate.length === 0) {
      toast.error("Nenhuma nota preenchida para lançar.")
      return
    }

    setSavingLanc(true)
    try {
      // Create grades sequentially or in parallel
      await Promise.all(gradesToCreate.map(g => createGrade(g!)))
      toast.success("Notas lançadas com sucesso!")
      
      // Clear grades input fields
      setLancValores({})
      
      // Refresh grades list
      const updatedGrades = await getGrades()
      setGrades(updatedGrades)
    } catch (err: any) {
      console.error(err)
      toast.error(err.message || "Falha ao lançar notas. Verifique os dados inseridos.")
    } finally {
      setSavingLanc(false)
    }
  }

  // Action: Update single Grade
  const handleUpdateGrade = async () => {
    if (!editGrade) return
    const notaNum = parseFloat(editNota)
    const maxNum = parseFloat(editNotaMaxima)

    if (isNaN(notaNum) || notaNum < 0 || isNaN(maxNum) || maxNum <= 0) {
      toast.error("Valores de nota e nota máxima inválidos.")
      return
    }
    if (notaNum > maxNum) {
      toast.error(`A nota não pode ser maior que a nota máxima (${maxNum}).`)
      return
    }

    setSavingEdit(true)
    try {
      await updateGrade(editGrade.id, {
        nota: notaNum,
        notaMaxima: maxNum,
        disciplina: editDisciplina,
        tipo: editTipo,
        data: editData,
        observacoes: editObservacoes
      })
      toast.success("Nota editada com sucesso!")
      setEditGrade(null)
      
      // Refresh grades list
      const updatedGrades = await getGrades()
      setGrades(updatedGrades)
    } catch (err) {
      console.error(err)
      toast.error("Erro ao atualizar nota.")
    } finally {
      setSavingEdit(false)
    }
  }

  // Action: Delete single Grade
  const handleDeleteGrade = async () => {
    if (!deleteGradeId) return
    setDeleting(true)
    try {
      await deleteGrade(deleteGradeId)
      toast.success("Nota removida com sucesso!")
      setDeleteGradeId(null)
      
      // Refresh grades
      const updatedGrades = await getGrades()
      setGrades(updatedGrades)
    } catch (err) {
      console.error(err)
      toast.error("Erro ao excluir nota.")
    } finally {
      setDeleting(false)
    }
  }

  // Initialize edit fields
  const startEdit = (grade: Nota) => {
    setEditGrade(grade)
    setEditNota(grade.nota.toString())
    setEditNotaMaxima(grade.notaMaxima.toString())
    setEditObservacoes(grade.observacoes || "")
    setEditTipo(grade.tipo)
    setEditDisciplina(grade.disciplina)
    setEditData(grade.data)
  }

  // List of students in selected launch class
  const studentsInLancClass = alunos.filter(a => 
    a.classId === lancClassId || (Array.isArray(a.classIds) && a.classIds.includes(lancClassId))
  )

  // Filtered grades for consultation table
  const filteredGrades = grades.filter(g => {
    if (filtroClassId !== "todas" && g.classId !== filtroClassId) return false
    if (filtroDisciplina !== "todas" && g.disciplina !== filtroDisciplina) return false
    if (filtroTipo !== "todos" && g.tipo !== filtroTipo) return false
    
    if (filtroAlunoName.trim() !== "") {
      const student = alunos.find(a => a.id === g.studentId)
      const nameMatch = student?.nome.toLowerCase().includes(filtroAlunoName.toLowerCase())
      const gradeNameMatch = g.studentName?.toLowerCase().includes(filtroAlunoName.toLowerCase())
      if (!nameMatch && !gradeNameMatch) return false
    }
    return true
  })

  // List of unique disciplines for filter dropdown
  const uniqueDisciplines = Array.from(new Set(grades.map(g => g.disciplina)))

  // Stats calculation for consultation
  const calculateStats = () => {
    if (filteredGrades.length === 0) return { avg: 0, highest: 0, lowest: 0, count: 0 }
    
    let sumPercentage = 0
    let highest = 0
    let lowest = Infinity
    
    filteredGrades.forEach(g => {
      const pct = (g.nota / g.notaMaxima) * 10
      sumPercentage += pct
      if (pct > highest) highest = pct
      if (pct < lowest) lowest = pct
    })

    return {
      avg: Math.round((sumPercentage / filteredGrades.length) * 10) / 10,
      highest: Math.round(highest * 10) / 10,
      lowest: Math.round(lowest * 10) / 10,
      count: filteredGrades.length
    }
  }

  const stats = calculateStats()

  // Group grades for boletim
  const getBoletimData = () => {
    if (!boletimStudentId) return null
    const student = alunos.find(a => a.id === boletimStudentId)
    if (!student) return null

    const studentGrades = grades.filter(g => g.studentId === boletimStudentId)
    
    // Group by discipline
    const byDiscipline: Record<string, { grades: Nota[]; sum: number; sumMax: number }> = {}
    
    studentGrades.forEach(g => {
      if (!byDiscipline[g.disciplina]) {
        byDiscipline[g.disciplina] = { grades: [], sum: 0, sumMax: 0 }
      }
      byDiscipline[g.disciplina].grades.push(g)
      byDiscipline[g.disciplina].sum += g.nota
      byDiscipline[g.disciplina].sumMax += g.notaMaxima
    })

    const disciplinesList = Object.entries(byDiscipline).map(([name, data]) => {
      // Calculate normalized average on a 0-10 scale
      let totalWeight = 0
      let weightedSum = 0
      data.grades.forEach(g => {
        const normalized = (g.nota / g.notaMaxima) * 10
        weightedSum += normalized
        totalWeight += 1
      })
      const average = totalWeight > 0 ? Math.round((weightedSum / totalWeight) * 10) / 10 : 0

      return {
        name,
        grades: data.grades.sort((a, b) => a.data.localeCompare(b.data)),
        average
      }
    })

    const overallAvgSum = disciplinesList.reduce((acc, d) => acc + d.average, 0)
    const overallAvg = disciplinesList.length > 0 ? Math.round((overallAvgSum / disciplinesList.length) * 10) / 10 : 0

    return {
      student,
      courses: disciplinesList,
      overallAvg
    }
  }

  const boletim = getBoletimData()

  const formatDate = (dateStr: string) => {
    if (!dateStr) return ""
    const parts = dateStr.split("-")
    if (parts.length !== 3) return dateStr
    return `${parts[2]}/${parts[1]}/${parts[0]}`
  }

  return (
    <RequirePermission permission={PERMISSIONS.NOTAS}>
      <div className="space-y-6 pt-12 md:pt-0 pb-12">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-foreground">Notas e Avaliações</h1>
            <p className="text-muted-foreground mt-1">
              Gerencie notas, consulte históricos de avaliações e gere boletins escolares.
            </p>
          </div>
        </div>



        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 space-y-4">
            <Loader2 className="h-10 w-10 text-primary animate-spin" />
            <p className="text-muted-foreground font-medium">Carregando informações...</p>
          </div>
        ) : (
          <Tabs defaultValue="consultar" className="w-full">
            <TabsList className="grid w-full sm:w-auto grid-cols-3 mb-6 bg-muted/60">
              <TabsTrigger value="consultar" className="flex items-center gap-2">
                <Search className="h-4 w-4" />
                Consultar Notas
              </TabsTrigger>
              <TabsTrigger value="lancar" className="flex items-center gap-2">
                <PlusCircle className="h-4 w-4" />
                Lançar Notas
              </TabsTrigger>
              <TabsTrigger value="boletim" className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Boletim Escolar
              </TabsTrigger>
            </TabsList>

            {/* -------------------- ABA CONSULTAR -------------------- */}
            <TabsContent value="consultar" className="space-y-6 outline-none">
              {/* Filtros */}
              <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-2 text-primary font-semibold">
                    <Filter className="h-4 w-4" />
                    <span>Filtros de Pesquisa</span>
                  </div>
                </CardHeader>
                <CardContent className="p-4 pt-0">
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                    <Field>
                      <FieldLabel htmlFor="filtroTurma">Turma</FieldLabel>
                      <Select value={filtroClassId} onValueChange={setFiltroClassId}>
                        <SelectTrigger id="filtroTurma">
                          <SelectValue placeholder="Todas as Turmas" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="todas">Todas as Turmas</SelectItem>
                          {turmas.map(t => (
                            <SelectItem key={t.id} value={t.id}>{t.nome}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </Field>

                    <Field>
                      <FieldLabel htmlFor="filtroDisc">Curso</FieldLabel>
                      <Select value={filtroDisciplina} onValueChange={setFiltroDisciplina}>
                        <SelectTrigger id="filtroDisc">
                          <SelectValue placeholder="Todos os Cursos" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="todas">Todos os Cursos</SelectItem>
                          {uniqueDisciplines.map(d => (
                            <SelectItem key={d} value={d}>{d}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </Field>

                    <Field>
                      <FieldLabel htmlFor="filtroTipo">Tipo</FieldLabel>
                      <Select value={filtroTipo} onValueChange={setFiltroTipo}>
                        <SelectTrigger id="filtroTipo">
                          <SelectValue placeholder="Todos os Tipos" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="todos">Todos os Tipos</SelectItem>
                          <SelectItem value="prova">Prova</SelectItem>
                          <SelectItem value="trabalho">Trabalho</SelectItem>
                          <SelectItem value="participacao">Participação</SelectItem>
                          <SelectItem value="outro">Outro</SelectItem>
                        </SelectContent>
                      </Select>
                    </Field>

                    <Field>
                      <FieldLabel htmlFor="filtroAluno">Buscar Aluno</FieldLabel>
                      <div className="relative">
                        <Search className="absolute left-2.5 top-3 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="filtroAluno"
                          type="text"
                          placeholder="Nome do Aluno..."
                          value={filtroAlunoName}
                          onChange={(e) => setFiltroAlunoName(e.target.value)}
                          className="pl-9"
                        />
                      </div>
                    </Field>
                  </div>
                </CardContent>
              </Card>

              {/* Estatísticas Rápidas */}
              {filteredGrades.length > 0 && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <Card className="border-border/50 bg-card/40">
                    <CardContent className="p-4 flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-primary/10 text-primary">
                        <ClipboardList className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground font-medium">Avaliações Filtradas</p>
                        <p className="text-lg font-bold text-foreground">{stats.count}</p>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="border-border/50 bg-card/40">
                    <CardContent className="p-4 flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-success/10 text-success">
                        <TrendingUp className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground font-medium">Média Geral (Escala 0-10)</p>
                        <p className="text-lg font-bold text-success">{stats.avg} / 10</p>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="border-border/50 bg-card/40">
                    <CardContent className="p-4 flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-blue-500/10 text-blue-500">
                        <CheckCircle className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground font-medium">Maior Nota Calculada</p>
                        <p className="text-lg font-bold text-blue-500">{stats.highest} / 10</p>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="border-border/50 bg-card/40">
                    <CardContent className="p-4 flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-destructive/10 text-destructive">
                        <AlertTriangle className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground font-medium">Menor Nota Calculada</p>
                        <p className="text-lg font-bold text-destructive">{stats.lowest} / 10</p>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}

              {/* Tabela de Notas */}
              <Card className="border-border/50 bg-card/50">
                <CardContent className="p-0">
                  <div className="rounded-md border border-border/40 overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-muted/40">
                          <TableHead className="font-semibold text-foreground">Aluno</TableHead>
                          <TableHead className="font-semibold text-foreground">Turma</TableHead>
                          <TableHead className="font-semibold text-foreground">Curso</TableHead>
                          <TableHead className="font-semibold text-foreground">Tipo</TableHead>
                          <TableHead className="font-semibold text-foreground">Nota</TableHead>
                          <TableHead className="font-semibold text-foreground">Data</TableHead>
                          <TableHead className="font-semibold text-foreground">Professor</TableHead>
                          <TableHead className="text-center font-semibold text-foreground w-28">Ações</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredGrades.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={8} className="text-center py-12 text-muted-foreground">
                              Nenhuma nota registrada com os filtros atuais.
                            </TableCell>
                          </TableRow>
                        ) : (
                          filteredGrades.map((grade) => {
                            const className = turmas.find(t => t.id === grade.classId)?.nome || "Turma Inativa"
                            const scorePct = grade.nota / grade.notaMaxima
                            const badgeColor = scorePct >= 0.7 
                              ? "bg-success/15 text-success-foreground border-success/35"
                              : scorePct >= 0.5 
                              ? "bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/35"
                              : "bg-destructive/15 text-destructive-foreground border-destructive/35"

                            return (
                              <TableRow key={grade.id} className="hover:bg-accent/20 transition-colors">
                                <TableCell className="font-medium text-foreground">
                                  {grade.studentName || alunos.find(a => a.id === grade.studentId)?.nome || "Carregando..."}
                                </TableCell>
                                <TableCell className="text-muted-foreground text-sm">{className}</TableCell>
                                <TableCell className="font-medium text-foreground">{grade.disciplina}</TableCell>
                                <TableCell className="capitalize text-muted-foreground text-sm">{grade.tipo}</TableCell>
                                <TableCell>
                                  <span className={`inline-flex items-center px-2 py-0.5 rounded border text-xs font-bold ${badgeColor}`}>
                                    {grade.nota} / {grade.notaMaxima}
                                  </span>
                                </TableCell>
                                <TableCell className="text-muted-foreground text-sm">{formatDate(grade.data)}</TableCell>
                                <TableCell className="text-muted-foreground text-xs">{grade.professor || "Administrador"}</TableCell>
                                <TableCell className="text-center">
                                  <div className="flex items-center justify-center gap-1.5">
                                    {(user?.role === "ADMIN" || user?.role === "DIRECTOR" || user?.role === "COORDINATOR" || grade.professorId === user?.id) && (
                                      <>
                                        <Button
                                          variant="ghost"
                                          size="icon"
                                          onClick={() => startEdit(grade)}
                                          className="h-8 w-8 text-muted-foreground hover:text-primary hover:bg-primary/10"
                                          title="Editar"
                                        >
                                          <Edit3 className="h-4 w-4" />
                                        </Button>
                                        <Button
                                          variant="ghost"
                                          size="icon"
                                          onClick={() => setDeleteGradeId(grade.id)}
                                          className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                                          title="Excluir"
                                        >
                                          <Trash2 className="h-4 w-4" />
                                        </Button>
                                      </>
                                    )}
                                  </div>
                                </TableCell>
                              </TableRow>
                            )
                          })
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* -------------------- ABA LANÇAR NOTAS -------------------- */}
            <TabsContent value="lancar" className="space-y-6 outline-none">
              <Card className="border-border/50 bg-card/65">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <GraduationCap className="h-5 w-5 text-primary" />
                    Parâmetros da Avaliação
                  </CardTitle>
                  <CardDescription>
                    Configure as informações básicas da avaliação para habilitar o lançamento por aluno.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Field>
                      <FieldLabel htmlFor="lancTurma">Turma *</FieldLabel>
                      <Select value={lancClassId} onValueChange={(val) => {
                        setLancClassId(val)
                        setLancValores({})
                        const selectedClass = turmas.find(t => t.id === val)
                        if (selectedClass) {
                          const courseExists = cursosList.some(c => c.name === selectedClass.curso) || CURSOS_PADRAO.includes(selectedClass.curso)
                          if (courseExists) {
                            setLancDisciplinaSel(selectedClass.curso)
                          } else {
                            setLancDisciplinaSel("Outro")
                            setLancDisciplinaCustom(selectedClass.curso)
                          }
                        }
                      }}>
                        <SelectTrigger id="lancTurma">
                          <SelectValue placeholder="Selecione uma turma" />
                        </SelectTrigger>
                        <SelectContent>
                          {turmas.filter(t => t.status === "ativa").map(t => (
                            <SelectItem key={t.id} value={t.id}>{t.nome} ({t.curso})</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </Field>

                    <Field>
                      <FieldLabel htmlFor="lancDisc">Curso *</FieldLabel>
                      <Select value={lancDisciplinaSel} onValueChange={setLancDisciplinaSel}>
                        <SelectTrigger id="lancDisc">
                          <SelectValue placeholder="Selecione o curso" />
                        </SelectTrigger>
                        <SelectContent>
                          {cursosList.length > 0 ? (
                            cursosList.map(c => (
                              <SelectItem key={c.id} value={c.name}>{c.name}</SelectItem>
                            ))
                          ) : (
                            CURSOS_PADRAO.map(d => (
                              <SelectItem key={d} value={d}>{d}</SelectItem>
                            ))
                          )}
                          <SelectItem value="Outro">Outro</SelectItem>
                        </SelectContent>
                      </Select>
                    </Field>

                    {lancDisciplinaSel === "Outro" && (
                      <Field>
                        <FieldLabel htmlFor="lancDiscCustom">Nome do Curso *</FieldLabel>
                        <Input
                          id="lancDiscCustom"
                          type="text"
                          placeholder="Digite o curso..."
                          value={lancDisciplinaCustom}
                          onChange={(e) => setLancDisciplinaCustom(e.target.value)}
                        />
                      </Field>
                    )}

                    <Field>
                      <FieldLabel htmlFor="lancTipo">Tipo de Avaliação *</FieldLabel>
                      <Select value={lancTipo} onValueChange={(val: any) => setLancTipo(val)}>
                        <SelectTrigger id="lancTipo">
                          <SelectValue placeholder="Selecione o tipo" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="prova">Prova</SelectItem>
                          <SelectItem value="trabalho">Trabalho</SelectItem>
                          <SelectItem value="participacao">Participação</SelectItem>
                          <SelectItem value="outro">Outro</SelectItem>
                        </SelectContent>
                      </Select>
                    </Field>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Field>
                      <FieldLabel htmlFor="lancNotaMax">Nota Máxima *</FieldLabel>
                      <Input
                        id="lancNotaMax"
                        type="number"
                        min={0.1}
                        step={0.1}
                        value={lancNotaMaxima}
                        onChange={(e) => setLancNotaMaxima(parseFloat(e.target.value) || 10)}
                      />
                    </Field>

                    <Field>
                      <FieldLabel htmlFor="lancData">Data da Avaliação *</FieldLabel>
                      <Input
                        id="lancData"
                        type="date"
                        value={lancData}
                        onChange={(e) => setLancData(e.target.value)}
                      />
                    </Field>
                  </div>
                </CardContent>
              </Card>

              {/* Lista de Alunos para Lançamento */}
              {lancClassId && (
                <Card className="border-border/50 bg-card/50">
                  <CardHeader className="pb-3 border-b border-border/50">
                    <CardTitle className="text-lg">Alunos Matriculados</CardTitle>
                    <CardDescription className="text-xs">
                      Insira as notas individuais correspondentes. Deixe em branco se o aluno não realizou a avaliação.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="pt-4">
                    {studentsInLancClass.length === 0 ? (
                      <div className="text-center py-12 text-muted-foreground">
                        Nenhum aluno matriculado na turma selecionada.
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <div className="rounded-md border border-border/40 overflow-hidden">
                          <Table>
                            <TableHeader>
                              <TableRow className="bg-muted/40">
                                <TableHead className="font-semibold text-foreground">Aluno</TableHead>
                                <TableHead className="font-semibold text-foreground w-44">Nota (Máx. {lancNotaMaxima})</TableHead>
                                <TableHead className="font-semibold text-foreground">Observações / Comentários</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {studentsInLancClass.map((student) => {
                                const currentVal = lancValores[student.id] || { nota: "", obs: "" }

                                const updateVal = (field: 'nota' | 'obs', val: string) => {
                                  setLancValores(prev => ({
                                    ...prev,
                                    [student.id]: {
                                      ...currentVal,
                                      [field]: val
                                    }
                                  }))
                                }

                                return (
                                  <TableRow key={student.id} className="hover:bg-accent/10">
                                    <TableCell className="font-medium text-foreground py-3">
                                      {student.nome}
                                    </TableCell>
                                    <TableCell className="py-2">
                                      <Input
                                        type="number"
                                        min={0}
                                        max={lancNotaMaxima}
                                        step={0.1}
                                        placeholder="0.0"
                                        value={currentVal.nota}
                                        onChange={(e) => updateVal('nota', e.target.value)}
                                        className="h-9 font-bold"
                                      />
                                    </TableCell>
                                    <TableCell className="py-2">
                                      <Input
                                        type="text"
                                        placeholder="Excelente desempenho, faltou, etc..."
                                        value={currentVal.obs}
                                        onChange={(e) => updateVal('obs', e.target.value)}
                                        className="h-9"
                                      />
                                    </TableCell>
                                  </TableRow>
                                )
                              })}
                            </TableBody>
                          </Table>
                        </div>

                        <div className="flex justify-end pt-2">
                          <Button
                            onClick={handleLaunchGrades}
                            disabled={savingLanc}
                            className="bg-primary hover:bg-primary/95 text-primary-foreground font-bold px-8 shadow"
                          >
                            {savingLanc ? (
                              <>
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                Lançando Notas...
                              </>
                            ) : (
                              <>
                                <CheckCircle className="h-4 w-4 mr-2" />
                                Salvar Avaliação
                              </>
                            )}
                          </Button>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            {/* -------------------- ABA BOLETIM ESCOLAR -------------------- */}
            <TabsContent value="boletim" className="space-y-6 outline-none">
              <Card className="border-border/50 bg-card/65">
                <CardHeader className="pb-4">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <User className="h-5 w-5 text-primary" />
                    Selecionar Aluno
                  </CardTitle>
                  <CardDescription>
                    Selecione um aluno da lista para exibir seu boletim consolidado por curso.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="max-w-md">
                    <Select value={boletimStudentId} onValueChange={setBoletimStudentId}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione um aluno" />
                      </SelectTrigger>
                      <SelectContent>
                        {alunos.map(a => (
                          <SelectItem key={a.id} value={a.id}>{a.nome}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>

              {/* Exibição do Boletim */}
              {boletim ? (
                <Card className="border-border/60 shadow-lg bg-card/50 overflow-hidden animate-in fade-in zoom-in-95 duration-200 print:border-0 print:shadow-none">
                  {/* Boletim Header */}
                  <div className="p-6 border-b border-border/50 bg-muted/30 print:bg-transparent">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                      <div>
                        <Badge className="mb-2 bg-primary/10 text-primary hover:bg-primary/20 border border-primary/30 uppercase tracking-wider text-[10px]">
                          Boletim de Aproveitamento Escolar
                        </Badge>
                        <h2 className="text-2xl font-bold text-foreground">{boletim.student.nome}</h2>
                        <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground mt-1">
                          <span>CPF: {boletim.student.cpf}</span>
                          <span>•</span>
                          <span>Curso: {boletim.student.curso}</span>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-3">
                        <div className="text-right">
                          <p className="text-xs text-muted-foreground font-semibold">Média Geral Consolidada</p>
                          <p className="text-3xl font-extrabold text-foreground">{boletim.overallAvg}</p>
                        </div>
                        <div>
                          {boletim.overallAvg >= 7.0 ? (
                            <Badge className="bg-success text-success-foreground text-sm px-3 py-1 font-bold">Aprovado</Badge>
                          ) : boletim.overallAvg >= 5.0 ? (
                            <Badge className="bg-amber-500 text-white text-sm px-3 py-1 font-bold">Recuperação</Badge>
                          ) : boletim.overallAvg > 0 ? (
                            <Badge className="bg-destructive text-destructive-foreground text-sm px-3 py-1 font-bold">Reprovado</Badge>
                          ) : (
                            <Badge variant="outline" className="text-muted-foreground text-sm px-3 py-1 font-bold">Nenhuma Nota</Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Boletim Body */}
                  <CardContent className="p-6 space-y-6">
                    {boletim.courses.length === 0 ? (
                      <div className="text-center py-12 text-muted-foreground">
                        Nenhum registro de nota lançado para este aluno.
                      </div>
                    ) : (
                      <div className="space-y-6">
                        {boletim.courses.map((d) => (
                          <div key={d.name} className="border border-border/40 rounded-lg overflow-hidden bg-background/50">
                            {/* Course Header */}
                            <div className="bg-muted/40 p-3 px-4 flex justify-between items-center border-b border-border/40">
                              <h3 className="font-bold text-foreground flex items-center gap-2">
                                <BookOpen className="h-4 w-4 text-primary" />
                                {d.name}
                              </h3>
                              <span className="text-sm font-bold text-foreground flex items-center gap-1">
                                Média: 
                                <Badge className={d.average >= 7.0 ? "bg-success/20 text-success border border-success/35 font-bold" : "bg-destructive/20 text-destructive border border-destructive/35 font-bold"}>
                                  {d.average}
                                </Badge>
                              </span>
                            </div>

                            {/* Assessments List */}
                            <div className="p-0 overflow-x-auto">
                              <Table>
                                <TableHeader>
                                  <TableRow className="bg-background/80">
                                    <TableHead className="font-semibold text-foreground text-xs h-9">Tipo</TableHead>
                                    <TableHead className="font-semibold text-foreground text-xs h-9">Nota Obtida</TableHead>
                                    <TableHead className="font-semibold text-foreground text-xs h-9">Aproveitamento (%)</TableHead>
                                    <TableHead className="font-semibold text-foreground text-xs h-9">Data</TableHead>
                                    <TableHead className="font-semibold text-foreground text-xs h-9">Lançado por</TableHead>
                                    <TableHead className="font-semibold text-foreground text-xs h-9">Comentários</TableHead>
                                  </TableRow>
                                </TableHeader>
                                <TableBody>
                                  {d.grades.map((grade) => {
                                    const percent = Math.round((grade.nota / grade.notaMaxima) * 100)
                                    return (
                                      <TableRow key={grade.id} className="hover:bg-accent/15 border-border/20">
                                        <TableCell className="capitalize text-sm font-medium text-foreground py-2.5">{grade.tipo}</TableCell>
                                        <TableCell className="py-2.5">
                                          <span className="font-bold text-sm text-foreground">{grade.nota}</span>
                                          <span className="text-muted-foreground text-xs"> / {grade.notaMaxima}</span>
                                        </TableCell>
                                        <TableCell className="py-2.5">
                                          <span className={`text-xs font-semibold px-2 py-0.5 rounded ${
                                            percent >= 70 ? "text-success bg-success/10" : percent >= 50 ? "text-amber-600 bg-amber-500/10" : "text-destructive bg-destructive/10"
                                          }`}>
                                            {percent}%
                                          </span>
                                        </TableCell>
                                        <TableCell className="text-muted-foreground text-xs py-2.5">{formatDate(grade.data)}</TableCell>
                                        <TableCell className="text-muted-foreground text-xs py-2.5">{grade.professor || "Professor"}</TableCell>
                                        <TableCell className="text-muted-foreground text-xs max-w-xs truncate py-2.5" title={grade.observacoes}>
                                          {grade.observacoes || "-"}
                                        </TableCell>
                                      </TableRow>
                                    )
                                  })}
                                </TableBody>
                              </Table>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              ) : boletimStudentId ? (
                <div className="text-center py-12 text-muted-foreground">
                  Carregando dados do boletim...
                </div>
              ) : null}
            </TabsContent>
          </Tabs>
        )}

        {/* DIALOG DE EDIÇÃO DE NOTA */}
        <Dialog open={!!editGrade} onOpenChange={(open) => { if (!open) setEditGrade(null) }}>
          <DialogContent className="max-w-md bg-background border border-border">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Edit3 className="h-5 w-5 text-primary" />
                Editar Nota
              </DialogTitle>
              <DialogDescription className="text-xs">
                Modifique os dados da nota selecionada.
              </DialogDescription>
            </DialogHeader>

            {editGrade && (
              <div className="space-y-4 py-2">
                <div className="bg-primary/5 p-3 rounded-lg border border-primary/20 text-xs space-y-1">
                  <p className="font-semibold text-foreground">Aluno: {editGrade.studentName || "Carregando..."}</p>
                  <p className="text-muted-foreground">Turma: {turmas.find(t => t.id === editGrade.classId)?.nome || ""}</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <Field>
                    <FieldLabel htmlFor="editDisc">Curso</FieldLabel>
                    <Input
                      id="editDisc"
                      type="text"
                      value={editDisciplina}
                      onChange={(e) => setEditDisciplina(e.target.value)}
                    />
                  </Field>

                  <Field>
                    <FieldLabel htmlFor="editTipo">Tipo</FieldLabel>
                    <Select value={editTipo} onValueChange={(val: any) => setEditTipo(val)}>
                      <SelectTrigger id="editTipo">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="prova">Prova</SelectItem>
                        <SelectItem value="trabalho">Trabalho</SelectItem>
                        <SelectItem value="participacao">Participação</SelectItem>
                        <SelectItem value="outro">Outro</SelectItem>
                      </SelectContent>
                    </Select>
                  </Field>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <Field>
                    <FieldLabel htmlFor="editNota">Nota</FieldLabel>
                    <Input
                      id="editNota"
                      type="number"
                      step={0.1}
                      value={editNota}
                      onChange={(e) => setEditNota(e.target.value)}
                    />
                  </Field>

                  <Field>
                    <FieldLabel htmlFor="editNotaMax">Nota Máxima</FieldLabel>
                    <Input
                      id="editNotaMax"
                      type="number"
                      step={0.1}
                      value={editNotaMaxima}
                      onChange={(e) => setEditNotaMaxima(e.target.value)}
                    />
                  </Field>
                </div>

                <div className="grid grid-cols-1 gap-4">
                  <Field>
                    <FieldLabel htmlFor="editData">Data</FieldLabel>
                    <Input
                      id="editData"
                      type="date"
                      value={editData}
                      onChange={(e) => setEditData(e.target.value)}
                    />
                  </Field>

                  <Field>
                    <FieldLabel htmlFor="editObs">Observações</FieldLabel>
                    <Textarea
                      id="editObs"
                      placeholder="Observações adicionais..."
                      value={editObservacoes}
                      onChange={(e) => setEditObservacoes(e.target.value)}
                      rows={2}
                    />
                  </Field>
                </div>
              </div>
            )}

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setEditGrade(null)}
                className="text-xs"
                disabled={savingEdit}
              >
                Cancelar
              </Button>
              <Button
                onClick={handleUpdateGrade}
                className="bg-primary text-primary-foreground text-xs"
                disabled={savingEdit}
              >
                {savingEdit ? "Salvando..." : "Salvar Alterações"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* DIALOG DE CONFIRMAÇÃO DE EXCLUSÃO */}
        <Dialog open={!!deleteGradeId} onOpenChange={(open) => { if (!open) setDeleteGradeId(null) }}>
          <DialogContent className="max-w-sm bg-background border border-border">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-destructive">
                <Trash2 className="h-5 w-5" />
                Confirmar Exclusão
              </DialogTitle>
              <DialogDescription className="text-xs">
                Esta ação é irreversível e excluirá definitivamente o registro de nota selecionado do banco de dados.
              </DialogDescription>
            </DialogHeader>

            <DialogFooter className="mt-4 gap-2">
              <Button
                variant="outline"
                onClick={() => setDeleteGradeId(null)}
                className="text-xs"
                disabled={deleting}
              >
                Cancelar
              </Button>
              <Button
                variant="destructive"
                onClick={handleDeleteGrade}
                className="text-xs font-semibold"
                disabled={deleting}
              >
                {deleting ? "Excluindo..." : "Excluir Registro"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </RequirePermission>
  )
}
