"use client"

import { useState } from "react"
import {
  BarChart3,
  Download,
  FileText,
  Users,
  ClipboardCheck,
  Calendar,
  TrendingUp,
  TrendingDown,
  Printer,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
} from 'recharts'
import { useAuth } from "@/components/auth/auth-provider"
import { AccessDenied } from "@/components/auth/access-denied"
import { Spinner } from "@/components/ui/spinner"

const presencaMensal = [
  { mes: 'Jan', presentes: 85, ausentes: 15 },
  { mes: 'Fev', presentes: 88, ausentes: 12 },
  { mes: 'Mar', presentes: 82, ausentes: 18 },
  { mes: 'Abr', presentes: 90, ausentes: 10 },
  { mes: 'Mai', presentes: 87, ausentes: 13 },
  { mes: 'Jun', presentes: 91, ausentes: 9 },
]

const matriculasMensais = [
  { mes: 'Jan', matriculas: 12 },
  { mes: 'Fev', matriculas: 8 },
  { mes: 'Mar', matriculas: 15 },
  { mes: 'Abr', matriculas: 6 },
  { mes: 'Mai', matriculas: 10 },
  { mes: 'Jun', matriculas: 4 },
]

const distribuicaoCursos = [
  { nome: 'Música', alunos: 45, color: '#F97316' },
  { nome: 'Artes', alunos: 32, color: '#3B82F6' },
  { nome: 'Dança', alunos: 28, color: '#10B981' },
  { nome: 'Teatro', alunos: 18, color: '#8B5CF6' },
  { nome: 'Esportes', alunos: 22, color: '#F59E0B' },
]

const relatoriosDisponiveis = [
  {
    id: 'presenca-mensal',
    titulo: 'Relatório de Presença Mensal',
    descricao: 'Frequência de alunos por mês',
    icon: ClipboardCheck,
    tipo: 'PDF',
  },
  {
    id: 'alunos-ativos',
    titulo: 'Lista de Alunos Ativos',
    descricao: 'Todos os alunos matriculados',
    icon: Users,
    tipo: 'Excel',
  },
  {
    id: 'turmas-ocupacao',
    titulo: 'Ocupação das Turmas',
    descricao: 'Capacidade e vagas disponíveis',
    icon: BarChart3,
    tipo: 'PDF',
  },
  {
    id: 'eventos-mes',
    titulo: 'Eventos do Mês',
    descricao: 'Agenda completa de atividades',
    icon: Calendar,
    tipo: 'PDF',
  },
]

export default function RelatoriosPage() {
  const [periodoPresenca, setPeriodoPresenca] = useState('semestre')
  const [periodoMatriculas, setPeriodoMatriculas] = useState('semestre')
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Spinner className="h-6 w-6" />
      </div>
    )
  }

  if (!user) {
    return null
  }

  if (user.role !== "DIRECTOR") {
    return <AccessDenied />
  }

  const totalAlunos = distribuicaoCursos.reduce((acc, c) => acc + c.alunos, 0)
  const mediaPresenca = Math.round(
    presencaMensal.reduce((acc, m) => acc + m.presentes, 0) / presencaMensal.length,
  )
  const totalMatriculas = matriculasMensais.reduce((acc, m) => acc + m.matriculas, 0)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Relatórios</h1>
          <p className="text-muted-foreground">Análises e métricas do projeto</p>
        </div>

        <div className="flex gap-2">
          <Button variant="outline">
            <Printer className="h-4 w-4 mr-2" />
            Imprimir
          </Button>
          <Button className="bg-primary hover:bg-primary/90">
            <Download className="h-4 w-4 mr-2" />
            Exportar Todos
          </Button>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total de Alunos</p>
                <p className="text-2xl font-bold">{totalAlunos}</p>
                <div className="flex items-center gap-1 mt-1">
                  <TrendingUp className="h-3 w-3 text-green-500" />
                  <span className="text-xs text-green-500">+12% vs mês anterior</span>
                </div>
              </div>
              <div className="p-3 rounded-full bg-primary/10">
                <Users className="h-5 w-5 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Média de Presença</p>
                <p className="text-2xl font-bold">{mediaPresenca}%</p>
                <div className="flex items-center gap-1 mt-1">
                  <TrendingUp className="h-3 w-3 text-green-500" />
                  <span className="text-xs text-green-500">+3% vs mês anterior</span>
                </div>
              </div>
              <div className="p-3 rounded-full bg-green-500/10">
                <ClipboardCheck className="h-5 w-5 text-green-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Novas Matrículas</p>
                <p className="text-2xl font-bold">{totalMatriculas}</p>
                <div className="flex items-center gap-1 mt-1">
                  <TrendingDown className="h-3 w-3 text-red-500" />
                  <span className="text-xs text-red-500">-5% vs semestre anterior</span>
                </div>
              </div>
              <div className="p-3 rounded-full bg-blue-500/10">
                <FileText className="h-5 w-5 text-blue-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Turmas Ativas</p>
                <p className="text-2xl font-bold">5</p>
                <div className="flex items-center gap-1 mt-1">
                  <span className="text-xs text-muted-foreground">Capacidade: 85%</span>
                </div>
              </div>
              <div className="p-3 rounded-full bg-purple-500/10">
                <BarChart3 className="h-5 w-5 text-purple-500" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Gráficos */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Gráfico de Presença */}
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base">Frequência de Presença</CardTitle>
                <CardDescription>Taxa de presença mensal (%)</CardDescription>
              </div>
              <Select value={periodoPresenca} onValueChange={setPeriodoPresenca}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="trimestre">Trimestre</SelectItem>
                  <SelectItem value="semestre">Semestre</SelectItem>
                  <SelectItem value="ano">Ano</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={presencaMensal}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="mes" className="text-xs" />
                  <YAxis className="text-xs" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                    }}
                  />
                  <Bar dataKey="presentes" name="Presentes" fill="#F97316" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="ausentes" name="Ausentes" fill="#E5E7EB" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Gráfico de Distribuição por Curso */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Distribuição por Curso</CardTitle>
            <CardDescription>Quantidade de alunos por área</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={distribuicaoCursos}
                    dataKey="alunos"
                    nameKey="nome"
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    label={({ nome, percent }) => `${nome} ${(percent * 100).toFixed(0)}%`}
                    labelLine={false}
                  >
                    {distribuicaoCursos.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex flex-wrap justify-center gap-3 mt-2">
              {distribuicaoCursos.map((curso) => (
                <div key={curso.nome} className="flex items-center gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: curso.color }} />
                  <span className="text-xs text-muted-foreground">{curso.nome}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Gráfico de Matrículas */}
        <Card className="lg:col-span-2">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base">Evolução de Matrículas</CardTitle>
                <CardDescription>Novas matrículas por mês</CardDescription>
              </div>
              <Select value={periodoMatriculas} onValueChange={setPeriodoMatriculas}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="trimestre">Trimestre</SelectItem>
                  <SelectItem value="semestre">Semestre</SelectItem>
                  <SelectItem value="ano">Ano</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={matriculasMensais}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="mes" className="text-xs" />
                  <YAxis className="text-xs" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="matriculas"
                    name="Matrículas"
                    stroke="#F97316"
                    strokeWidth={2}
                    dot={{ fill: '#F97316', strokeWidth: 2 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Relatórios Disponíveis */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Relatórios Disponíveis</CardTitle>
          <CardDescription>Clique para baixar ou visualizar</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {relatoriosDisponiveis.map((relatorio) => {
              const Icon = relatorio.icon
              return (
                <button
                  key={relatorio.id}
                  className="flex items-start gap-3 p-4 rounded-lg border border-border hover:border-primary hover:bg-accent/50 transition-colors text-left group"
                >
                  <div className="p-2 rounded-lg bg-primary/10 group-hover:bg-primary/20 transition-colors">
                    <Icon className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h4 className="font-medium text-sm truncate">{relatorio.titulo}</h4>
                      <Badge variant="secondary" className="text-xs shrink-0">
                        {relatorio.tipo}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">{relatorio.descricao}</p>
                  </div>
                </button>
              )
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
