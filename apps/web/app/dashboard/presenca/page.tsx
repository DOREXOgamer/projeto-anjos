"use client"

import { useState, useEffect } from "react"
import { RequirePermission } from "@/components/auth/require-permission"
import { PERMISSIONS } from "@/lib/permissions"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { FieldGroup, Field, FieldLabel } from "@/components/ui/field"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
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
import { Switch } from "@/components/ui/switch"
import { CheckCircle, UserCheck, UserX, Save, Calendar, Filter, Users, Eye, History, FileSpreadsheet } from "lucide-react"
import { getStudents, getAttendanceByDate, saveAttendance, getClasses, getAttendanceHistory } from "@/lib/api"
import type { Aluno, Turma } from "@/lib/types"

export default function PresencaPage() {
  const getLocalDateString = () => {
    const d = new Date()
    const year = d.getFullYear()
    const month = String(d.getMonth() + 1).padStart(2, '0')
    const day = String(d.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  }

  const getThirtyDaysAgoString = () => {
    const d = new Date()
    d.setDate(d.getDate() - 30)
    const year = d.getFullYear()
    const month = String(d.getMonth() + 1).padStart(2, '0')
    const day = String(d.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  }

  const [alunos, setAlunos] = useState<Aluno[]>([])
  const [turmas, setTurmas] = useState<Turma[]>([])
  
  // Registrar Presença states
  const [selectedTurmaId, setSelectedTurmaId] = useState<string>("")
  const [presencas, setPresencas] = useState<Map<string, boolean>>(new Map())
  const [dataSelecionada, setDataSelecionada] = useState(getLocalDateString())
  const [sucesso, setSucesso] = useState("")
  const [salvando, setSalvando] = useState(false)

  // Histórico de Presença states
  const [histTurmaId, setHistTurmaId] = useState<string>("")
  const [startDate, setStartDate] = useState(getThirtyDaysAgoString())
  const [endDate, setEndDate] = useState(getLocalDateString())
  const [attendanceHistory, setAttendanceHistory] = useState<any[]>([])
  const [loadingHistory, setLoadingHistory] = useState(false)
  const [selectedHistoryDate, setSelectedHistoryDate] = useState<string | null>(null)
  const [viewDetailsOpen, setViewDetailsOpen] = useState(false)
  const [historyViewType, setHistoryViewType] = useState<"aula" | "aluno">("aula")

  // 1. Carregar turmas e alunos inicialmente
  useEffect(() => {
    const loadInitialData = async () => {
      try {
        const [alunosData, turmasData] = await Promise.all([getStudents(), getClasses()])
        setAlunos(alunosData)
        const activeTurmas = turmasData.filter(t => t.status === 'ativa')
        setTurmas(activeTurmas)
        if (activeTurmas.length > 0) {
          setSelectedTurmaId(activeTurmas[0].id)
          setHistTurmaId(activeTurmas[0].id)
        }
      } catch (error) {
        console.error("Erro ao carregar dados iniciais:", error)
      }
    }
    loadInitialData()
  }, [])

  // 2. Carregar presenças quando a data ou a turma selecionada mudar (aba registrar)
  useEffect(() => {
    if (!selectedTurmaId) return

    const loadAttendance = async () => {
      try {
        const attendanceMap = await getAttendanceByDate(dataSelecionada, selectedTurmaId)
        const presencaMap = new Map<string, boolean>()

        const alunosDaTurma = alunos.filter(a =>
          a.classId === selectedTurmaId ||
          (Array.isArray(a.classIds) && a.classIds.includes(selectedTurmaId))
        )
        alunosDaTurma.forEach(aluno => {
          presencaMap.set(aluno.id, attendanceMap[aluno.id] ?? false)
        })

        setPresencas(presencaMap)
      } catch (error) {
        console.error("Erro ao carregar presença:", error)
      }
    }

    loadAttendance()
  }, [dataSelecionada, selectedTurmaId, alunos])

  // 3. Carregar histórico de presença quando a turma ou período mudarem
  useEffect(() => {
    if (!histTurmaId) return

    const loadHistory = async () => {
      setLoadingHistory(true)
      try {
        const historyData = await getAttendanceHistory(histTurmaId, startDate, endDate)
        setAttendanceHistory(historyData)
      } catch (error) {
        console.error("Erro ao carregar histórico de presença:", error)
      } finally {
        setLoadingHistory(false)
      }
    }

    loadHistory()
  }, [histTurmaId, startDate, endDate])

  const togglePresenca = (alunoId: string) => {
    setPresencas(prev => {
      const newMap = new Map(prev)
      newMap.set(alunoId, !prev.get(alunoId))
      return newMap
    })
  }

  const handleSalvar = async () => {
    setSalvando(true)

    try {
      const attendanceItems = Array.from(presencas.entries()).map(([alunoId, presente]) => ({
        alunoId,
        data: dataSelecionada,
        status: presente ? "PRESENT" : "ABSENT" as const,
        classId: selectedTurmaId
      }))

      await saveAttendance(attendanceItems)
      setSucesso("Presença salva com sucesso!")
      
      // Forçar atualização do histórico também se for a mesma turma
      if (selectedTurmaId === histTurmaId) {
        const historyData = await getAttendanceHistory(histTurmaId, startDate, endDate)
        setAttendanceHistory(historyData)
      }
    } catch (error) {
      console.error("Erro ao salvar presença:", error)
      setSucesso("Erro ao salvar presença. Tente novamente.")
    } finally {
      setSalvando(false)
      setTimeout(() => setSucesso(""), 3000)
    }
  }

  const marcarTodos = (presente: boolean) => {
    setPresencas(prev => {
      const newMap = new Map(prev)
      alunosFiltrados.forEach(aluno => {
        newMap.set(aluno.id, presente)
      })
      return newMap
    })
  }

  const alunosFiltrados = alunos.filter(aluno =>
    aluno.classId === selectedTurmaId ||
    (Array.isArray(aluno.classIds) && aluno.classIds.includes(selectedTurmaId))
  )

  const totalPresentes = Array.from(presencas.entries())
    .filter(([id, presente]) => presente && alunosFiltrados.some(a => a.id === id))
    .length
  const totalAusentes = alunosFiltrados.length - totalPresentes

  const formatDateString = (dateStr: string) => {
    return new Date(dateStr + 'T12:00:00').toLocaleDateString('pt-BR', { 
      year: 'numeric', 
      month: '2-digit', 
      day: '2-digit' 
    })
  }

  // Agrupamento e cálculos do Histórico
  const getUniqueDates = () => {
    const dates = attendanceHistory.map(item => item.date)
    return Array.from(new Set(dates)).sort((a, b) => b.localeCompare(a))
  }

  const getHistorySummary = () => {
    const uniqueDates = getUniqueDates()
    const totalRecords = attendanceHistory.length
    if (totalRecords === 0) return { totalAulas: 0, mediaPresenca: 0 }

    const totalPresents = attendanceHistory.filter(item => item.status === "PRESENT").length
    const mediaPresenca = Math.round((totalPresents / totalRecords) * 100)
    return {
      totalAulas: uniqueDates.length,
      mediaPresenca
    }
  }

  const historySummary = getHistorySummary()

  const getAttendanceForDate = (date: string) => {
    return attendanceHistory.filter(item => item.date === date)
  }

  const getAttendanceForStudent = (studentId: string) => {
    return attendanceHistory.filter(item => item.studentId === studentId)
  }

  return (
    <RequirePermission permission={PERMISSIONS.PRESENCA}>
    <div className="space-y-6 pt-12 md:pt-0">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-foreground">Controle de Presença</h1>
          <p className="text-muted-foreground mt-1">
            Registre e consulte a frequência dos alunos nas aulas
          </p>
        </div>
      </div>

      {/* Success Alert */}
      {sucesso && (
        <Alert className="bg-success/10 border-success/30 text-success animate-in fade-in slide-in-from-top-2 duration-300">
          <CheckCircle className="h-4 w-4" />
          <AlertDescription>{sucesso}</AlertDescription>
        </Alert>
      )}

      <Tabs defaultValue="registrar" className="w-full">
        <TabsList className="grid w-full sm:w-auto grid-cols-2 mb-4 bg-muted/60">
          <TabsTrigger value="registrar" className="flex items-center gap-2">
            <CheckCircle className="h-4 w-4" />
            Registrar Presença
          </TabsTrigger>
          <TabsTrigger value="historico" className="flex items-center gap-2">
            <History className="h-4 w-4" />
            Histórico de Presença
          </TabsTrigger>
        </TabsList>

        {/* -------------------- ABA REGISTRAR -------------------- */}
        <TabsContent value="registrar" className="space-y-6 outline-none">
          {/* Filters */}
          <Card className="border-border/50">
            <CardContent className="p-4">
              <div className="flex flex-col sm:flex-row gap-4">
                <FieldGroup className="flex-1">
                  <Field>
                    <FieldLabel htmlFor="data" className="flex items-center gap-2 text-foreground font-medium">
                      <Calendar className="h-4 w-4 text-primary" />
                      Data
                    </FieldLabel>
                    <Input
                      id="data"
                      type="date"
                      value={dataSelecionada}
                      onChange={(e) => setDataSelecionada(e.target.value)}
                    />
                  </Field>
                </FieldGroup>

                <FieldGroup className="flex-1">
                  <Field>
                    <FieldLabel htmlFor="turma" className="flex items-center gap-2 text-foreground font-medium">
                      <Filter className="h-4 w-4 text-primary" />
                      Selecionar Turma
                    </FieldLabel>
                    <Select value={selectedTurmaId} onValueChange={setSelectedTurmaId}>
                      <SelectTrigger id="turma">
                        <SelectValue placeholder="Selecione a turma" />
                      </SelectTrigger>
                      <SelectContent>
                        {turmas.map((turma) => (
                          <SelectItem key={turma.id} value={turma.id}>
                            {turma.nome} ({turma.curso})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </Field>
                </FieldGroup>
              </div>
            </CardContent>
          </Card>

          {/* Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Card className="border-border/50">
              <CardContent className="p-4 flex items-center gap-3">
                <div className="p-2 rounded-full bg-primary/10">
                  <Users className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total de Alunos</p>
                  <p className="text-xl font-bold text-foreground">{alunosFiltrados.length}</p>
                </div>
              </CardContent>
            </Card>

            <Card className="border-border/50">
              <CardContent className="p-4 flex items-center gap-3">
                <div className="p-2 rounded-full bg-success/10">
                  <UserCheck className="h-5 w-5 text-success" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Presentes</p>
                  <p className="text-xl font-bold text-success">{totalPresentes}</p>
                </div>
              </CardContent>
            </Card>

            <Card className="border-border/50">
              <CardContent className="p-4 flex items-center gap-3">
                <div className="p-2 rounded-full bg-destructive/10">
                  <UserX className="h-5 w-5 text-destructive" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Ausentes</p>
                  <p className="text-xl font-bold text-destructive">{totalAusentes}</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Table */}
          <Card className="border-border/50">
            <CardHeader className="pb-3 border-b border-border/50">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <CardTitle className="text-lg">Lista de Chamada</CardTitle>
                  <CardDescription className="text-xs">
                    {new Date(dataSelecionada + 'T12:00:00').toLocaleDateString('pt-BR', { 
                      weekday: 'long', 
                      year: 'numeric', 
                      month: 'long', 
                      day: 'numeric' 
                    })}
                  </CardDescription>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => marcarTodos(true)}
                    className="text-success border-success/30 hover:bg-success/10 text-xs"
                  >
                    <UserCheck className="h-3.5 w-3.5 mr-1.5" />
                    Todos Presentes
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => marcarTodos(false)}
                    className="text-destructive border-destructive/30 hover:bg-destructive/10 text-xs"
                  >
                    <UserX className="h-3.5 w-3.5 mr-1.5" />
                    Todos Ausentes
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-4">
              <div className="rounded-md border border-border overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50">
                      <TableHead className="font-semibold text-foreground">Nome</TableHead>
                      <TableHead className="hidden sm:table-cell font-semibold text-foreground">Curso</TableHead>
                      <TableHead className="text-center font-semibold text-foreground">Status</TableHead>
                      <TableHead className="text-center font-semibold text-foreground">Presença</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                      {alunosFiltrados.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                            Nenhum aluno matriculado nesta turma
                          </TableCell>
                        </TableRow>
                    ) : (
                      alunosFiltrados.map((aluno) => {
                        const presente = presencas.get(aluno.id) || false
                        
                        return (
                          <TableRow 
                            key={aluno.id}
                            className={presente ? "bg-success/5 hover:bg-success/10 transition-colors" : "bg-destructive/5 hover:bg-destructive/10 transition-colors"}
                          >
                            <TableCell className="font-medium text-foreground">{aluno.nome}</TableCell>
                            <TableCell className="hidden sm:table-cell">
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-primary/10 text-primary border border-primary/20">
                                {aluno.curso}
                              </span>
                            </TableCell>
                            <TableCell className="text-center">
                              <span 
                                className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                                  presente 
                                    ? "bg-success/20 text-success border border-success/30" 
                                    : "bg-destructive/20 text-destructive border border-destructive/30"
                                }`}
                              >
                                {presente ? (
                                  <>
                                    <UserCheck className="h-3 w-3" />
                                    Presente
                                  </>
                                ) : (
                                  <>
                                    <UserX className="h-3 w-3" />
                                    Ausente
                                  </>
                                )}
                              </span>
                            </TableCell>
                            <TableCell className="text-center">
                              <Switch
                                checked={presente}
                                onCheckedChange={() => togglePresenca(aluno.id)}
                                className="data-[state=checked]:bg-success"
                              />
                            </TableCell>
                          </TableRow>
                        )
                      })
                    )}
                  </TableBody>
                </Table>
              </div>

              {alunosFiltrados.length > 0 && (
                <div className="flex justify-end mt-4">
                  <Button 
                    onClick={handleSalvar}
                    disabled={salvando}
                    className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold px-6 shadow-md transition-all active:scale-[0.98]"
                  >
                    <Save className="h-4 w-4 mr-2" />
                    {salvando ? "Salvando..." : "Salvar Presença"}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* -------------------- ABA HISTÓRICO -------------------- */}
        <TabsContent value="historico" className="space-y-6 outline-none">
          {/* Filters */}
          <Card className="border-border/50">
            <CardContent className="p-4">
              <div className="flex flex-col md:flex-row gap-4">
                <FieldGroup className="flex-1">
                  <Field>
                    <FieldLabel htmlFor="histTurma" className="flex items-center gap-2 text-foreground font-medium">
                      <Filter className="h-4 w-4 text-primary" />
                      Turma
                    </FieldLabel>
                    <Select value={histTurmaId} onValueChange={setHistTurmaId}>
                      <SelectTrigger id="histTurma">
                        <SelectValue placeholder="Selecione a turma" />
                      </SelectTrigger>
                      <SelectContent>
                        {turmas.map((turma) => (
                          <SelectItem key={turma.id} value={turma.id}>
                            {turma.nome} ({turma.curso})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </Field>
                </FieldGroup>

                <FieldGroup className="w-full md:w-48">
                  <Field>
                    <FieldLabel htmlFor="startDate" className="flex items-center gap-2 text-foreground font-medium">
                      <Calendar className="h-4 w-4 text-primary" />
                      Data Inicial
                    </FieldLabel>
                    <Input
                      id="startDate"
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                    />
                  </Field>
                </FieldGroup>

                <FieldGroup className="w-full md:w-48">
                  <Field>
                    <FieldLabel htmlFor="endDate" className="flex items-center gap-2 text-foreground font-medium">
                      <Calendar className="h-4 w-4 text-primary" />
                      Data Final
                    </FieldLabel>
                    <Input
                      id="endDate"
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                    />
                  </Field>
                </FieldGroup>
              </div>
            </CardContent>
          </Card>

          {/* KPI Dashboard */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Card className="border-border/50">
              <CardContent className="p-4 flex items-center gap-4">
                <div className="p-3 rounded-full bg-primary/10">
                  <Calendar className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground font-medium">Sessões Registradas no Período</p>
                  <p className="text-2xl font-bold text-foreground mt-0.5">{historySummary.totalAulas}</p>
                </div>
              </CardContent>
            </Card>

            <Card className="border-border/50">
              <CardContent className="p-4 flex items-center gap-4">
                <div className="p-3 rounded-full bg-success/10">
                  <UserCheck className="h-6 w-6 text-success" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground font-medium">Taxa de Presença Média</p>
                  <p className="text-2xl font-bold text-success mt-0.5">{historySummary.mediaPresenca}%</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* History Visualisation Options */}
          <Card className="border-border/50">
            <CardHeader className="pb-3 border-b border-border/50 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <CardTitle className="text-lg">Frequência da Turma</CardTitle>
                <CardDescription className="text-xs">
                  Consulta de dados históricos de presença
                </CardDescription>
              </div>
              <div className="flex bg-muted/60 p-0.5 rounded-lg border border-border/50">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setHistoryViewType("aula")}
                  className={`text-xs px-3 h-8 font-medium ${historyViewType === "aula" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
                >
                  <Calendar className="h-3.5 w-3.5 mr-1.5" />
                  Por Aula
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setHistoryViewType("aluno")}
                  className={`text-xs px-3 h-8 font-medium ${historyViewType === "aluno" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
                >
                  <FileSpreadsheet className="h-3.5 w-3.5 mr-1.5" />
                  Por Aluno
                </Button>
              </div>
            </CardHeader>
            <CardContent className="pt-4">
              {loadingHistory ? (
                <div className="py-12 text-center text-muted-foreground animate-pulse font-medium">
                  Carregando histórico...
                </div>
              ) : attendanceHistory.length === 0 ? (
                <div className="py-12 text-center text-muted-foreground">
                  <Users className="h-12 w-12 mx-auto mb-3 opacity-30 text-primary" />
                  <p className="font-semibold">Nenhum registro de presença encontrado</p>
                  <p className="text-sm mt-1">Experimente alterar as datas ou escolher outra turma.</p>
                </div>
              ) : historyViewType === "aula" ? (
                /* VIEW BY DATE */
                <div className="rounded-md border border-border overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/50">
                        <TableHead className="font-semibold text-foreground">Data</TableHead>
                        <TableHead className="text-center font-semibold text-foreground">Alunos Presentes</TableHead>
                        <TableHead className="text-center font-semibold text-foreground">Alunos Ausentes</TableHead>
                        <TableHead className="text-center font-semibold text-foreground">Frequência (%)</TableHead>
                        <TableHead className="text-center font-semibold text-foreground">Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {getUniqueDates().map(date => {
                        const records = getAttendanceForDate(date)
                        const presents = records.filter(r => r.status === "PRESENT").length
                        const absents = records.filter(r => r.status === "ABSENT").length
                        const rate = Math.round((presents / records.length) * 100)

                        return (
                          <TableRow key={date} className="hover:bg-accent/30 transition-colors">
                            <TableCell className="font-medium text-foreground">
                              {formatDateString(date)}
                            </TableCell>
                            <TableCell className="text-center text-success font-semibold">
                              {presents}
                            </TableCell>
                            <TableCell className="text-center text-destructive font-semibold">
                              {absents}
                            </TableCell>
                            <TableCell className="text-center">
                              <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${
                                rate >= 75 
                                  ? "bg-success/20 text-success border border-success/30" 
                                  : "bg-destructive/20 text-destructive border border-destructive/30"
                              }`}>
                                {rate}%
                              </span>
                            </TableCell>
                            <TableCell className="text-center">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  setSelectedHistoryDate(date)
                                  setViewDetailsOpen(true)
                                }}
                                className="h-8 text-xs border-border hover:bg-muted"
                              >
                                <Eye className="h-3.5 w-3.5 mr-1" />
                                Detalhes
                              </Button>
                            </TableCell>
                          </TableRow>
                        )
                      })}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                /* VIEW BY STUDENT */
                <div className="rounded-md border border-border overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/50">
                        <TableHead className="font-semibold text-foreground">Aluno</TableHead>
                        <TableHead className="text-center font-semibold text-foreground">Total Aulas</TableHead>
                        <TableHead className="text-center font-semibold text-foreground">Presenças</TableHead>
                        <TableHead className="text-center font-semibold text-foreground">Faltas</TableHead>
                        <TableHead className="text-center font-semibold text-foreground">Frequência (%)</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {alunos.filter(a => a.classId === histTurmaId).map(aluno => {
                        const records = getAttendanceForStudent(aluno.id)
                        const presents = records.filter(r => r.status === "PRESENT").length
                        const absents = records.filter(r => r.status === "ABSENT").length
                        const total = records.length
                        const rate = total > 0 ? Math.round((presents / total) * 100) : 0

                        return (
                          <TableRow key={aluno.id} className="hover:bg-accent/30 transition-colors">
                            <TableCell className="font-medium text-foreground">
                              {aluno.nome}
                            </TableCell>
                            <TableCell className="text-center font-medium text-muted-foreground">
                              {total}
                            </TableCell>
                            <TableCell className="text-center text-success font-semibold">
                              {presents}
                            </TableCell>
                            <TableCell className="text-center text-destructive font-semibold">
                              {absents}
                            </TableCell>
                            <TableCell className="text-center">
                              {total === 0 ? (
                                <span className="text-xs text-muted-foreground italic">Sem registros</span>
                              ) : (
                                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${
                                  rate >= 75 
                                    ? "bg-success/20 text-success border border-success/30" 
                                    : "bg-destructive/20 text-destructive border border-destructive/30"
                                }`}>
                                  {rate}%
                                </span>
                              )}
                            </TableCell>
                          </TableRow>
                        )
                      })}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Details Dialog */}
      <Dialog open={viewDetailsOpen} onOpenChange={setViewDetailsOpen}>
        <DialogContent className="max-w-md bg-background border border-border">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-primary" />
              Sessão de {selectedHistoryDate && formatDateString(selectedHistoryDate)}
            </DialogTitle>
            <DialogDescription className="text-xs">
              Relatório individual de presenças desta aula
            </DialogDescription>
          </DialogHeader>

          {selectedHistoryDate && (
            <div className="max-h-[60vh] overflow-y-auto mt-4 rounded-md border border-border">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead className="font-semibold text-foreground">Aluno</TableHead>
                    <TableHead className="text-center font-semibold text-foreground">Presença</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {getAttendanceForDate(selectedHistoryDate).map((record) => (
                    <TableRow key={record.id} className="hover:bg-accent/20">
                      <TableCell className="font-medium text-foreground text-sm">
                        {record.student?.name || "Aluno Desconhecido"}
                      </TableCell>
                      <TableCell className="text-center">
                        <span 
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${
                            record.status === "PRESENT" 
                              ? "bg-success/20 text-success border border-success/30" 
                              : "bg-destructive/20 text-destructive border border-destructive/30"
                          }`}
                        >
                          {record.status === "PRESENT" ? (
                            <>
                              <UserCheck className="h-2.5 w-2.5" />
                              Presente
                            </>
                          ) : (
                            <>
                              <UserX className="h-2.5 w-2.5" />
                              Ausente
                            </>
                          )}
                        </span>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
          
          <div className="flex justify-end pt-2">
            <Button
              variant="outline"
              onClick={() => setViewDetailsOpen(false)}
              className="text-xs border-border hover:bg-muted"
            >
              Fechar
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
    </RequirePermission>
  )
}
