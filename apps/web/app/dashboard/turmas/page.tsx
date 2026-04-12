"use client"

import { useState } from "react"
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
  Filter
} from "lucide-react"
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
import type { Turma } from "@/lib/types"

const turmasMock: Turma[] = [
  {
    id: '1',
    nome: 'Música - Manhã',
    curso: 'Música',
    horario: '08:00 - 10:00',
    diasSemana: ['Segunda', 'Quarta', 'Sexta'],
    professor: 'Prof. Carlos Silva',
    capacidade: 20,
    alunosMatriculados: 15,
    sala: 'Sala 01',
    status: 'ativa',
    createdAt: '2024-01-10'
  },
  {
    id: '2',
    nome: 'Artes - Tarde',
    curso: 'Artes',
    horario: '14:00 - 16:00',
    diasSemana: ['Terça', 'Quinta'],
    professor: 'Prof. Maria Santos',
    capacidade: 15,
    alunosMatriculados: 12,
    sala: 'Sala 02',
    status: 'ativa',
    createdAt: '2024-01-15'
  },
  {
    id: '3',
    nome: 'Dança - Manhã',
    curso: 'Dança',
    horario: '09:00 - 11:00',
    diasSemana: ['Segunda', 'Quarta'],
    professor: 'Prof. Ana Oliveira',
    capacidade: 18,
    alunosMatriculados: 18,
    sala: 'Sala 03',
    status: 'ativa',
    createdAt: '2024-02-01'
  },
  {
    id: '4',
    nome: 'Teatro - Tarde',
    curso: 'Teatro',
    horario: '15:00 - 17:00',
    diasSemana: ['Terça', 'Quinta', 'Sexta'],
    professor: 'Prof. João Costa',
    capacidade: 12,
    alunosMatriculados: 8,
    sala: 'Auditório',
    status: 'ativa',
    createdAt: '2024-02-10'
  },
  {
    id: '5',
    nome: 'Música - Noite',
    curso: 'Música',
    horario: '18:00 - 20:00',
    diasSemana: ['Segunda', 'Quarta'],
    professor: 'Prof. Carlos Silva',
    capacidade: 15,
    alunosMatriculados: 5,
    sala: 'Sala 01',
    status: 'inativa',
    createdAt: '2024-01-20'
  },
]

const cursos = ['Música', 'Artes', 'Dança', 'Teatro', 'Esportes']
const diasSemanaOptions = ['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado']

export default function TurmasPage() {
  const [turmas, setTurmas] = useState<Turma[]>(turmasMock)
  const [busca, setBusca] = useState('')
  const [filtroStatus, setFiltroStatus] = useState<string>('todos')
  const [filtroCurso, setFiltroCurso] = useState<string>('todos')
  const [modalOpen, setModalOpen] = useState(false)
  const [editingTurma, setEditingTurma] = useState<Turma | null>(null)
  const [formData, setFormData] = useState({
    nome: '',
    curso: '',
    horario: '',
    diasSemana: [] as string[],
    professor: '',
    capacidade: '',
    sala: '',
    status: 'ativa' as 'ativa' | 'inativa'
  })

  const turmasFiltradas = turmas.filter(turma => {
    const matchBusca = turma.nome.toLowerCase().includes(busca.toLowerCase()) ||
                       turma.professor.toLowerCase().includes(busca.toLowerCase())
    const matchStatus = filtroStatus === 'todos' || turma.status === filtroStatus
    const matchCurso = filtroCurso === 'todos' || turma.curso === filtroCurso
    return matchBusca && matchStatus && matchCurso
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (editingTurma) {
      setTurmas(turmas.map(t => 
        t.id === editingTurma.id 
          ? { ...t, ...formData, capacidade: Number(formData.capacidade) }
          : t
      ))
    } else {
      const newTurma: Turma = {
        id: String(Date.now()),
        ...formData,
        capacidade: Number(formData.capacidade),
        alunosMatriculados: 0,
        createdAt: new Date().toISOString().split('T')[0]
      }
      setTurmas([...turmas, newTurma])
    }
    resetForm()
    setModalOpen(false)
  }

  const resetForm = () => {
    setFormData({
      nome: '',
      curso: '',
      horario: '',
      diasSemana: [],
      professor: '',
      capacidade: '',
      sala: '',
      status: 'ativa'
    })
    setEditingTurma(null)
  }

  const handleEdit = (turma: Turma) => {
    setEditingTurma(turma)
    setFormData({
      nome: turma.nome,
      curso: turma.curso,
      horario: turma.horario,
      diasSemana: turma.diasSemana,
      professor: turma.professor,
      capacidade: String(turma.capacidade),
      sala: turma.sala,
      status: turma.status
    })
    setModalOpen(true)
  }

  const handleDelete = (id: string) => {
    setTurmas(turmas.filter(t => t.id !== id))
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
                      value={formData.curso}
                      onValueChange={(value) => setFormData({...formData, curso: value})}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione" />
                      </SelectTrigger>
                      <SelectContent>
                        {cursos.map(curso => (
                          <SelectItem key={curso} value={curso}>{curso}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="horario">Horário</Label>
                    <Input
                      id="horario"
                      value={formData.horario}
                      onChange={(e) => setFormData({...formData, horario: e.target.value})}
                      placeholder="08:00 - 10:00"
                      required
                    />
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
                  <Input
                    id="professor"
                    value={formData.professor}
                    onChange={(e) => setFormData({...formData, professor: e.target.value})}
                    placeholder="Nome do professor"
                    required
                  />
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
            {cursos.map(curso => (
              <SelectItem key={curso} value={curso}>{curso}</SelectItem>
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
                      style={{ width: `${Math.min((turma.alunosMatriculados / turma.capacidade) * 100, 100)}%` }}
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


