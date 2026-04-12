"use client"

import { useState, useEffect } from "react"
import { RequirePermission } from "@/components/auth/require-permission"
import { PERMISSIONS } from "@/lib/permissions"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { FieldGroup, Field, FieldLabel } from "@/components/ui/field"
import { Alert, AlertDescription } from "@/components/ui/alert"
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
import { CheckCircle, UserCheck, UserX, Save, Calendar, Filter } from "lucide-react"
import { store } from "@/lib/store"
import type { Aluno, Presenca } from "@/lib/types"

const cursos = ["Todos", "Música", "Artes", "Dança", "Teatro", "Esportes", "Informática"]

export default function PresencaPage() {
  const [alunos, setAlunos] = useState<Aluno[]>([])
  const [presencas, setPresencas] = useState<Map<string, boolean>>(new Map())
  const [dataSelecionada, setDataSelecionada] = useState(
    new Date().toISOString().split('T')[0]
  )
  const [cursoFiltro, setCursoFiltro] = useState("Todos")
  const [sucesso, setSucesso] = useState("")
  const [salvando, setSalvando] = useState(false)

  useEffect(() => {
    const alunosData = store.getAlunos()
    setAlunos(alunosData)
    
    // Carregar presenças da data selecionada
    const presencasData = store.getPresencasByData(dataSelecionada)
    const presencaMap = new Map<string, boolean>()
    
    // Inicializar todos como ausentes
    alunosData.forEach(aluno => {
      presencaMap.set(aluno.id, false)
    })
    
    // Marcar os presentes
    presencasData.forEach(p => {
      presencaMap.set(p.alunoId, p.status === 'presente')
    })
    
    setPresencas(presencaMap)
  }, [dataSelecionada])

  const togglePresenca = (alunoId: string) => {
    setPresencas(prev => {
      const newMap = new Map(prev)
      newMap.set(alunoId, !prev.get(alunoId))
      return newMap
    })
  }

  const handleSalvar = async () => {
    setSalvando(true)
    
    // Simular delay de salvamento
    await new Promise(resolve => setTimeout(resolve, 500))
    
    // Salvar cada presença
    presencas.forEach((presente, alunoId) => {
      store.setPresenca(alunoId, dataSelecionada, presente ? 'presente' : 'ausente')
    })
    
    setSalvando(false)
    setSucesso("Presença salva com sucesso!")
    setTimeout(() => setSucesso(""), 3000)
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
    cursoFiltro === "Todos" || aluno.curso === cursoFiltro
  )

  const totalPresentes = Array.from(presencas.entries())
    .filter(([id, presente]) => presente && alunosFiltrados.some(a => a.id === id))
    .length
  const totalAusentes = alunosFiltrados.length - totalPresentes

  return (
    <RequirePermission permission={PERMISSIONS.PRESENCA}>
    <div className="space-y-6 pt-12 md:pt-0">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-foreground">Controle de Presença</h1>
          <p className="text-muted-foreground mt-1">
            Registre a presença dos alunos nas aulas
          </p>
        </div>
        
        <Button 
          onClick={handleSalvar}
          disabled={salvando}
          className="bg-primary hover:bg-primary/90 text-primary-foreground"
        >
          <Save className="h-4 w-4 mr-2" />
          {salvando ? "Salvando..." : "Salvar Presença"}
        </Button>
      </div>

      {/* Success Alert */}
      {sucesso && (
        <Alert className="bg-success/10 border-success/30 text-success">
          <CheckCircle className="h-4 w-4" />
          <AlertDescription>{sucesso}</AlertDescription>
        </Alert>
      )}

      {/* Filters */}
      <Card className="border-border/50">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <FieldGroup className="flex-1">
              <Field>
                <FieldLabel htmlFor="data" className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
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
                <FieldLabel htmlFor="turma" className="flex items-center gap-2">
                  <Filter className="h-4 w-4" />
                  Filtrar por Curso
                </FieldLabel>
                <Select value={cursoFiltro} onValueChange={setCursoFiltro}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o curso" />
                  </SelectTrigger>
                  <SelectContent>
                    {cursos.map((curso) => (
                      <SelectItem key={curso} value={curso}>
                        {curso}
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
              <UserCheck className="h-5 w-5 text-primary" />
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
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <CardTitle>Lista de Chamada</CardTitle>
              <CardDescription>
                {new Date(dataSelecionada + 'T12:00:00').toLocaleDateString('pt-BR', { 
                  weekday: 'long', 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => marcarTodos(true)}
                className="text-success border-success/30 hover:bg-success/10"
              >
                <UserCheck className="h-4 w-4 mr-2" />
                Todos Presentes
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => marcarTodos(false)}
                className="text-destructive border-destructive/30 hover:bg-destructive/10"
              >
                <UserX className="h-4 w-4 mr-2" />
                Todos Ausentes
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border border-border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead>Nome</TableHead>
                  <TableHead className="hidden sm:table-cell">Curso</TableHead>
                  <TableHead className="text-center">Status</TableHead>
                  <TableHead className="text-center">Presença</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {alunosFiltrados.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                      Nenhum aluno encontrado para este filtro
                    </TableCell>
                  </TableRow>
                ) : (
                  alunosFiltrados.map((aluno) => {
                    const presente = presencas.get(aluno.id) || false
                    
                    return (
                      <TableRow 
                        key={aluno.id}
                        className={presente ? "bg-success/5" : "bg-destructive/5"}
                      >
                        <TableCell className="font-medium">{aluno.nome}</TableCell>
                        <TableCell className="hidden sm:table-cell">
                          <span className="px-2 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary">
                            {aluno.curso}
                          </span>
                        </TableCell>
                        <TableCell className="text-center">
                          <span 
                            className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                              presente 
                                ? "bg-success/20 text-success" 
                                : "bg-destructive/20 text-destructive"
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
        </CardContent>
      </Card>
    </div>
    </RequirePermission>
  )
}


