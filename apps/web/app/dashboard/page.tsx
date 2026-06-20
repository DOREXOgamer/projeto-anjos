"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Users, UserCheck, BookOpen, TrendingUp } from "lucide-react"
import { getStudentsStats, getReportsStats, type StudentStats } from "@/lib/api"
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip, Legend } from "recharts"
import { ChartContainer, ChartTooltipContent } from "@/components/ui/chart"

const chartConfig = {
  presentes: {
    label: "Presentes",
    color: "var(--color-success)",
  },
  ausentes: {
    label: "Ausentes",
    color: "var(--color-destructive)",
  },
}

interface DashboardData {
  presentesHoje: number
  totalAlunos: number
  novosCadastros: number
  atividadesRecentes: Array<{
    tipo: string
    descricao: string
    tempo: string
  }>
}

export default function DashboardPage() {
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null)
  const [reportsData, setReportsData] = useState<any | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    Promise.all([getStudentsStats(), getReportsStats()])
      .then(([stats, reports]) => {
        const hoje = new Date()
        const atividadesRecentes = stats.recentStudents.slice(0, 4).map((student) => {
          const createdDate = new Date(student.createdAt)
          const diffTime = Math.abs(hoje.getTime() - createdDate.getTime())
          const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24))
          let tempo = diffDays === 1 ? "1 dia atrás" : `${diffDays} dias atrás`
          if (diffDays === 0) tempo = "hoje"
          return {
            tipo: "cadastro",
            descricao: `Novo aluno cadastrado: ${student.name}`,
            tempo
          }
        })

        setDashboardData({
          totalAlunos: stats.totalCount,
          novosCadastros: stats.newRegistrations7d,
          presentesHoje: stats.presentToday || 0,
          atividadesRecentes
        })
        setReportsData(reports)
      })
      .catch((err) => {
        console.error(err)
        setError("Erro ao carregar dados. Verifique a conexão com o servidor.")
      })
  }, [])

  const totalAlunos = dashboardData?.totalAlunos || 0
  const novosCadastros = dashboardData?.novosCadastros || 0
  const atividadesRecentes = dashboardData?.atividadesRecentes || []
  const totalPresentes = dashboardData?.presentesHoje || 0
  

  const statCards = [
    {
      title: "Total de Alunos",
      value: totalAlunos.toString(),
      icon: Users,
      color: "text-primary",
      bgColor: "bg-primary/10",
    },
    {
      title: "Novos Cadastros (7d)",
      value: novosCadastros.toString(),
      icon: Users,
      color: "text-success",
      bgColor: "bg-success/10",
    },
    {
      title: "Presentes Hoje",
      value: totalPresentes.toString(),
      icon: UserCheck,
      color: "text-chart-3",
      bgColor: "bg-chart-3/10",
    },
    {
      title: "Turmas Ativas",
      value: (reportsData?.activeClasses ?? 0).toString(),
      icon: BookOpen,
      color: "text-warning",
      bgColor: "bg-warning/10",
    },
  ]



  return (
    <div className="space-y-6 pt-12 md:pt-0">
      {/* Header */}
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-foreground">Dashboard</h1>
        {error && (
          <p className="text-destructive font-medium mt-2 p-2 bg-destructive/10 rounded-md">
            {error}
          </p>
        )}
        <p className="text-muted-foreground mt-1">
          Visão geral do Projeto Anjos Inocentes
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat) => {
          const Icon = stat.icon
          return (
            <Card key={stat.title} className="border-border/50">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">
                      {stat.title}
                    </p>
                    <p className="text-2xl md:text-3xl font-bold text-foreground mt-1">
                      {stat.value}
                    </p>
                  </div>
                  <div className={`p-3 rounded-full ${stat.bgColor}`}>
                    <Icon className={`h-6 w-6 ${stat.color}`} />
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Charts and Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Attendance Chart */}
        <Card className="lg:col-span-2 border-border/50">
          <CardHeader>
            <CardTitle>Frequência Mensal (%)</CardTitle>
            <CardDescription>
              Acompanhamento da taxa de presença dos alunos nos últimos 6 meses
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={reportsData?.presencaMensal || [
                  { mes: "Hoje", presentes: totalPresentes ? Math.round((totalPresentes / totalAlunos) * 100) : 0, ausentes: totalPresentes ? 100 - Math.round((totalPresentes / totalAlunos) * 100) : 100 }
                ]}> 
                  <XAxis 
                    dataKey="mes" 
                    tickLine={false}
                    axisLine={false}
                    className="text-xs"
                  />
                  <YAxis 
                    tickLine={false}
                    axisLine={false}
                    className="text-xs"
                    unit="%"
                  />
                  <Tooltip content={<ChartTooltipContent />} />
                  <Legend />
                  <Bar 
                    dataKey="presentes" 
                    fill="var(--color-success)" 
                    radius={[4, 4, 0, 0]}
                    name="Presentes (%)"
                  />
                  <Bar 
                    dataKey="ausentes" 
                    fill="var(--color-destructive)" 
                    radius={[4, 4, 0, 0]}
                    name="Ausentes (%)"
                  />
                </BarChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card className="border-border/50">
          <CardHeader>
            <CardTitle>Atividades Recentes</CardTitle>
            <CardDescription>
              Últimas ações no sistema
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {atividadesRecentes.map((atividade, index) => (
                <div key={index} className="flex items-start gap-3 pb-4 border-b border-border/50 last:border-0 last:pb-0">
                  <div className={`w-2 h-2 rounded-full mt-2 flex-shrink-0 ${
                    atividade.tipo === 'cadastro' ? 'bg-primary' :
                    atividade.tipo === 'presenca' ? 'bg-success' : 'bg-chart-3'
                  }`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-foreground line-clamp-2">
                      {atividade.descricao}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {atividade.tempo}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Access */}
      <Card className="border-border/50">
        <CardHeader>
          <CardTitle>Acesso Rápido</CardTitle>
          <CardDescription>
            Atalhos para as principais funcionalidades
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <a
              href="/dashboard/alunos"
              className="flex items-center gap-3 p-4 rounded-lg bg-primary/5 hover:bg-primary/10 border border-primary/20 transition-colors"
            >
              <Users className="h-8 w-8 text-primary" />
              <div>
                <p className="font-medium text-foreground">Cadastrar Aluno</p>
                <p className="text-sm text-muted-foreground">Adicionar novo aluno</p>
              </div>
            </a>
            <a
              href="/dashboard/presenca"
              className="flex items-center gap-3 p-4 rounded-lg bg-success/5 hover:bg-success/10 border border-success/20 transition-colors"
            >
              <UserCheck className="h-8 w-8 text-success" />
              <div>
                <p className="font-medium text-foreground">Registrar Presença</p>
                <p className="text-sm text-muted-foreground">Controle de presença</p>
              </div>
            </a>
            <a
              href="/dashboard/plano-aula"
              className="flex items-center gap-3 p-4 rounded-lg bg-chart-3/5 hover:bg-chart-3/10 border border-chart-3/20 transition-colors"
            >
              <BookOpen className="h-8 w-8 text-chart-3" />
              <div>
                <p className="font-medium text-foreground">Plano de Aula</p>
                <p className="text-sm text-muted-foreground">Criar novo plano</p>
              </div>
            </a>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
