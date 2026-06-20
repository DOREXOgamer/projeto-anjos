"use client"

import { useState, useEffect } from "react"
import { getReportsStats } from "@/lib/api"
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
import { API_URL, getStoredToken } from "@/lib/auth"



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
  const [reportsData, setReportsData] = useState<any | null>(null)
  const [loadingStats, setLoadingStats] = useState(true)

  const exportAlunosCSV = async () => {
    try {
      const res = await fetch(`${API_URL}/students`, {
        headers: { Authorization: `Bearer ${getStoredToken()}` }
      })
      const data = await res.json()
      const studentsList = data.students || []
      
      const headers = ["Nome", "CPF", "Data de Nascimento", "E-mail", "Telefone", "Endereço", "Curso", "Data de Cadastro"]
      const rows = studentsList.map((s: any) => [
        s.nome,
        s.cpf,
        s.dataNascimento,
        s.email,
        s.telefone,
        s.endereco,
        s.curso,
        s.createdAt
      ])
      
      const csvContent = "\uFEFF" + [headers.join(";"), ...rows.map((r: any) => r.map((val: string) => `"${(val || '').replace(/"/g, '""')}"`).join(";"))].join("\n")
      
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
      const url = URL.createObjectURL(blob)
      const link = document.createElement("a")
      link.setAttribute("href", url)
      link.setAttribute("download", `alunos_ativos_${new Date().toISOString().split("T")[0]}.csv`)
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    } catch (err) {
      console.error("Erro ao exportar alunos:", err)
      alert("Erro ao exportar alunos")
    }
  }

  const exportPresencaPDF = () => {
    const printWindow = window.open("", "_blank")
    if (!printWindow) return
    
    const presencaLines = (reportsData?.presencaMensal || []).map((m: any) => `
      <tr>
        <td style="padding: 10px; border-bottom: 1px solid #ddd;">${m.mes}</td>
        <td style="padding: 10px; border-bottom: 1px solid #ddd; text-align: right; color: green; font-weight: bold;">${m.presentes}%</td>
        <td style="padding: 10px; border-bottom: 1px solid #ddd; text-align: right; color: red;">${m.ausentes}%</td>
      </tr>
    `).join("")

    printWindow.document.write(`
      <html>
        <head>
          <title>Relatório de Presença Mensal - Projeto Anjos Inocentes</title>
          <style>
            body { font-family: sans-serif; padding: 40px; color: #333; }
            h1 { color: #f97316; margin-bottom: 5px; }
            h2 { color: #555; font-size: 16px; margin-top: 0; margin-bottom: 30px; font-weight: normal; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th { background: #f3f4f6; padding: 12px 10px; text-align: left; border-bottom: 2px solid #ddd; }
            .footer { margin-top: 50px; font-size: 12px; text-align: center; color: #888; border-top: 1px solid #eee; padding-top: 20px; }
          </style>
        </head>
        <body>
          <h1>Projeto Anjos Inocentes</h1>
          <h2>Relatório de Presença Mensal - Gerado em ${new Date().toLocaleDateString('pt-BR')}</h2>
          <table>
            <thead>
              <tr>
                <th>Mês</th>
                <th style="text-align: right;">Presença Média (%)</th>
                <th style="text-align: right;">Ausência Média (%)</th>
              </tr>
            </thead>
            <tbody>
              ${presencaLines}
            </tbody>
          </table>
          <div class="footer">
            Sistema de Gestão Acadêmica - Anjos Inocentes
          </div>
          <script>
            window.onload = function() {
              window.print();
              setTimeout(function() { window.close(); }, 500);
            }
          </script>
        </body>
      </html>
    `)
    printWindow.document.close()
  }

  const exportTurmasOcupacaoPDF = async () => {
    try {
      const res = await fetch(`${API_URL}/classes`, {
        headers: { Authorization: `Bearer ${getStoredToken()}` }
      })
      const data = await res.json()
      const classesList = data.classes || []

      const printWindow = window.open("", "_blank")
      if (!printWindow) return

      const rows = classesList.map((c: any) => {
        const taxa = c.capacidade > 0 ? Math.round((c.alunosMatriculados / c.capacidade) * 100) : 0
        return `
          <tr>
            <td style="padding: 10px; border-bottom: 1px solid #ddd;">${c.nome}</td>
            <td style="padding: 10px; border-bottom: 1px solid #ddd;">${c.curso}</td>
            <td style="padding: 10px; border-bottom: 1px solid #ddd; text-align: center;">${c.alunosMatriculados}</td>
            <td style="padding: 10px; border-bottom: 1px solid #ddd; text-align: center;">${c.capacidade}</td>
            <td style="padding: 10px; border-bottom: 1px solid #ddd; text-align: right; font-weight: bold; color: ${taxa > 85 ? 'red' : 'green'};">${taxa}%</td>
          </tr>
        `
      }).join("")

      printWindow.document.write(`
        <html>
          <head>
            <title>Ocupação das Turmas - Projeto Anjos Inocentes</title>
            <style>
              body { font-family: sans-serif; padding: 40px; color: #333; }
              h1 { color: #f97316; margin-bottom: 5px; }
              h2 { color: #555; font-size: 16px; margin-top: 0; margin-bottom: 30px; font-weight: normal; }
              table { width: 100%; border-collapse: collapse; margin-top: 20px; }
              th { background: #f3f4f6; padding: 12px 10px; text-align: left; border-bottom: 2px solid #ddd; }
              .footer { margin-top: 50px; font-size: 12px; text-align: center; color: #888; border-top: 1px solid #eee; padding-top: 20px; }
            </style>
          </head>
          <body>
            <h1>Projeto Anjos Inocentes</h1>
            <h2>Ocupação das Turmas - Gerado em ${new Date().toLocaleDateString('pt-BR')}</h2>
            <table>
              <thead>
                <tr>
                  <th>Turma</th>
                  <th>Curso</th>
                  <th style="text-align: center;">Alunos Matriculados</th>
                  <th style="text-align: center;">Capacidade</th>
                  <th style="text-align: right;">Taxa de Ocupação</th>
                </tr>
              </thead>
              <tbody>
                ${rows}
              </tbody>
            </table>
            <div class="footer">
              Sistema de Gestão Acadêmica - Anjos Inocentes
            </div>
            <script>
              window.onload = function() {
                window.print();
                setTimeout(function() { window.close(); }, 500);
              }
            </script>
          </body>
        </html>
      `)
      printWindow.document.close()
    } catch (err) {
      console.error("Erro ao exportar ocupação:", err)
      alert("Erro ao exportar ocupação")
    }
  }

  const exportEventosPDF = async () => {
    try {
      const res = await fetch(`${API_URL}/events`, {
        headers: { Authorization: `Bearer ${getStoredToken()}` }
      })
      const data = await res.json()
      const eventsList = data.events || []

      const printWindow = window.open("", "_blank")
      if (!printWindow) return

      const rows = eventsList.map((e: any) => `
        <tr>
          <td style="padding: 10px; border-bottom: 1px solid #ddd;">${new Date(e.data + 'T12:00:00').toLocaleDateString('pt-BR')}</td>
          <td style="padding: 10px; border-bottom: 1px solid #ddd;">${e.horario || 'Dia todo'}</td>
          <td style="padding: 10px; border-bottom: 1px solid #ddd; font-weight: bold;">${e.titulo}</td>
          <td style="padding: 10px; border-bottom: 1px solid #ddd; text-transform: uppercase; font-size: 11px;">${e.tipo}</td>
          <td style="padding: 10px; border-bottom: 1px solid #ddd; font-size: 13px; color: #666;">${e.descricao || ''}</td>
        </tr>
      `).join("")

      printWindow.document.write(`
        <html>
          <head>
            <title>Agenda de Eventos - Projeto Anjos Inocentes</title>
            <style>
              body { font-family: sans-serif; padding: 40px; color: #333; }
              h1 { color: #f97316; margin-bottom: 5px; }
              h2 { color: #555; font-size: 16px; margin-top: 0; margin-bottom: 30px; font-weight: normal; }
              table { width: 100%; border-collapse: collapse; margin-top: 20px; }
              th { background: #f3f4f6; padding: 12px 10px; text-align: left; border-bottom: 2px solid #ddd; }
              .footer { margin-top: 50px; font-size: 12px; text-align: center; color: #888; border-top: 1px solid #eee; padding-top: 20px; }
            </style>
          </head>
          <body>
            <h1>Projeto Anjos Inocentes</h1>
            <h2>Agenda de Eventos - Gerado em ${new Date().toLocaleDateString('pt-BR')}</h2>
            <table>
              <thead>
                <tr>
                  <th>Data</th>
                  <th>Horário</th>
                  <th>Título</th>
                  <th>Tipo</th>
                  <th>Descrição</th>
                </tr>
              </thead>
              <tbody>
                ${rows}
              </tbody>
            </table>
            <div class="footer">
              Sistema de Gestão Acadêmica - Anjos Inocentes
            </div>
            <script>
              window.onload = function() {
                window.print();
                setTimeout(function() { window.close(); }, 500);
              }
            </script>
          </body>
        </html>
      `)
      printWindow.document.close()
    } catch (err) {
      console.error("Erro ao exportar eventos:", err)
      alert("Erro ao exportar eventos")
    }
  }

  const handleExportRelatorio = (id: string) => {
    if (id === 'presenca-mensal') exportPresencaPDF()
    if (id === 'alunos-ativos') exportAlunosCSV()
    if (id === 'turmas-ocupacao') exportTurmasOcupacaoPDF()
    if (id === 'eventos-mes') exportEventosPDF()
  }

  useEffect(() => {
    const loadStats = async () => {
      try {
        const stats = await getReportsStats()
        setReportsData(stats)
      } catch (error) {
        console.error("Erro ao carregar relatórios:", error)
      } finally {
        setLoadingStats(false)
      }
    }
    loadStats()
  }, [])

  if (loading || loadingStats) {
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

  const distribuicaoCursos = reportsData?.courseDistribution ?? []
  const presencaMensal = reportsData?.presencaMensal ?? []
  const matriculasMensais = reportsData?.matriculasMensais ?? []

  const totalAlunos = reportsData?.totalStudents ?? 0
  const mediaPresenca = presencaMensal.length > 0
    ? Math.round(presencaMensal.reduce((acc: number, m: any) => acc + m.presentes, 0) / presencaMensal.length)
    : 0
  const totalMatriculas = matriculasMensais.reduce((acc: number, m: any) => acc + m.matriculas, 0)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Relatórios</h1>
          <p className="text-muted-foreground">Análises e métricas do projeto</p>
        </div>

        <div className="flex gap-2">
          <Button variant="outline" onClick={() => window.print()}>
            <Printer className="h-4 w-4 mr-2" />
            Imprimir
          </Button>
          <Button className="bg-primary hover:bg-primary/90" onClick={exportAlunosCSV}>
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
                <p className="text-2xl font-bold">{reportsData?.activeClasses ?? 0}</p>
                <div className="flex items-center gap-1 mt-1">
                  <span className="text-xs text-muted-foreground">Cadastradas no sistema</span>
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
                    {distribuicaoCursos.map((entry: any, index: number) => (
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
              {distribuicaoCursos.map((curso: any) => (
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
                  onClick={() => handleExportRelatorio(relatorio.id)}
                  className="flex items-start gap-3 p-4 rounded-lg border border-border hover:border-primary hover:bg-accent/50 transition-colors text-left group w-full"
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
