"use client"

import { useState, useEffect } from "react"
import { updateProfile, changePassword, getReportsStats } from "@/lib/api"
import * as api from "@/lib/api"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  Settings,
  User,
  Bell,
  Palette,
  Shield,
  Database,
  Save,
  Moon,
  Sun,
  Monitor,
  Upload,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Separator } from "@/components/ui/separator"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useAuth } from "@/components/auth/auth-provider"
import { AccessDenied } from "@/components/auth/access-denied"
import { Spinner } from "@/components/ui/spinner"
import { toast } from "sonner"

export default function ConfiguracoesPage() {
  const { user, loading, updateUserState } = useAuth()
  
  const [perfil, setPerfil] = useState({
    nome: '',
    email: '',
    cargo: '',
  })

  const [avatar, setAvatar] = useState<string | null>(null)

  const [notificacoes, setNotificacoes] = useState({
    emailNovaMatricula: true,
    emailPresenca: false,
    emailRelatorios: true,
    pushAulas: true,
    pushEventos: true,
  })

  const [aparencia, setAparencia] = useState({
    tema: 'light',
    idioma: 'pt-BR',
    compacto: false,
  })

  const [salvando, setSalvando] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")

  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [passwordError, setPasswordError] = useState("")
  const [passwordSuccess, setPasswordSuccess] = useState("")
  const [stats, setStats] = useState<any | null>(null)

  // Carregar preferências e avatar do localStorage ao montar
  useEffect(() => {
    if (typeof window !== "undefined") {
      const storedAvatar = localStorage.getItem("user_avatar")
      if (storedAvatar) {
        setAvatar(storedAvatar)
      }

      const savedTema = localStorage.getItem("pref_tema") || "light"
      const savedIdioma = localStorage.getItem("pref_idioma") || "pt-BR"
      const savedCompacto = localStorage.getItem("pref_compacto") === "true"

      setAparencia({
        tema: savedTema,
        idioma: savedIdioma,
        compacto: savedCompacto,
      })

      const savedNotifs = localStorage.getItem("pref_notificacoes")
      if (savedNotifs) {
        try {
          setNotificacoes(JSON.parse(savedNotifs))
        } catch (e) {
          console.error("Erro ao carregar notificações", e)
        }
      }
    }
  }, [])

  // Efeitos para aplicar Tema e Modo Compacto em tempo real
  useEffect(() => {
    if (typeof window !== "undefined") {
      const root = document.documentElement
      if (aparencia.tema === "dark") {
        root.classList.add("dark")
      } else if (aparencia.tema === "light") {
        root.classList.remove("dark")
      } else if (aparencia.tema === "system") {
        const systemDark = window.matchMedia("(prefers-color-scheme: dark)").matches
        root.classList.toggle("dark", systemDark)
      }
      localStorage.setItem("pref_tema", aparencia.tema)
    }
  }, [aparencia.tema])

  useEffect(() => {
    if (typeof window !== "undefined") {
      const root = document.documentElement
      if (aparencia.compacto) {
        root.classList.add("compact-mode")
      } else {
        root.classList.remove("compact-mode")
      }
      localStorage.setItem("pref_compacto", String(aparencia.compacto))
    }
  }, [aparencia.compacto])

  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("pref_idioma", aparencia.idioma)
    }
  }, [aparencia.idioma])

  useEffect(() => {
    if (user) {
      setPerfil({
        nome: user.name || "",
        email: user.email || "",
        cargo: user.role === "ADMIN" ? "Administrador" : user.role === "DIRECTOR" ? "Diretor" : "Professor",
      })
    }
  }, [user])

  useEffect(() => {
    const loadStats = async () => {
      try {
        const data = await getReportsStats()
        setStats(data)
      } catch (error) {
        console.error("Erro ao carregar estatísticas do sistema:", error)
      }
    }
    loadStats()
  }, [])

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

  if (user.role !== "ADMIN" && user.role !== "DIRECTOR") {
    return <AccessDenied />
  }

  // Upload do Avatar
  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (file.size > 2 * 1024 * 1024) {
      toast.error("O arquivo deve ter no máximo 2MB.")
      return
    }

    const reader = new FileReader()
    reader.onload = () => {
      const base64 = reader.result as string
      setAvatar(base64)
      localStorage.setItem("user_avatar", base64)
      toast.success("Foto de perfil atualizada com sucesso!")
    }
    reader.readAsDataURL(file)
  }

  // Salvar perfil, notificações e aparência
  const handleSalvar = async () => {
    setSalvando(true)
    setError("")
    setSuccess("")
    try {
      // 1. Salvar perfil no backend
      const data = await updateProfile({ name: perfil.nome, email: perfil.email })
      updateUserState(data.user)

      // 2. Persistir notificações no localStorage
      localStorage.setItem("pref_notificacoes", JSON.stringify(notificacoes))

      setSuccess("Configurações atualizadas com sucesso!")
      toast.success("Configurações salvas!")
      setTimeout(() => setSuccess(""), 4000)
    } catch (err) {
      console.error(err)
      setError(err instanceof Error ? err.message : "Erro ao atualizar perfil")
      toast.error("Erro ao salvar alterações.")
    } finally {
      setSalvando(false)
    }
  }

  const handleAlterarSenha = async (e: React.FormEvent) => {
    e.preventDefault()
    setPasswordError("")
    setPasswordSuccess("")

    if (newPassword.length < 6) {
      setPasswordError("A nova senha deve ter no mínimo 6 caracteres")
      return
    }

    try {
      await changePassword({ currentPassword, newPassword })
      setPasswordSuccess("Senha alterada com sucesso!")
      toast.success("Senha alterada com sucesso!")
      setCurrentPassword("")
      setNewPassword("")
      setTimeout(() => setPasswordSuccess(""), 4000)
    } catch (err) {
      console.error(err)
      setPasswordError(err instanceof Error ? err.message : "Erro ao alterar senha")
      toast.error("Erro ao alterar senha.")
    }
  }

  // Backup e exportação real dos dados
  const handleBackup = async () => {
    try {
      toast.loading("Buscando dados para o backup...", { id: "backup" })
      const [students, classes, courses, events, plans, logs] = await Promise.all([
        api.getStudents(),
        api.getClasses(),
        api.getCourses(),
        api.getEvents(),
        api.getLessonPlans(),
        api.getAuditLogs().catch(() => [])
      ])

      const backupData = {
        sistema: "Projeto Anjos Inocentes",
        dataExportacao: new Date().toISOString(),
        estatisticas: stats,
        alunos: students,
        turmas: classes,
        cursos: courses,
        eventos: events,
        planosAula: plans,
        logsAuditoria: logs
      }

      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(backupData, null, 2))
      const downloadAnchor = document.createElement('a')
      downloadAnchor.setAttribute("href", dataStr)
      downloadAnchor.setAttribute("download", `backup_sistema_anjos_${new Date().toISOString().split('T')[0]}.json`)
      document.body.appendChild(downloadAnchor)
      downloadAnchor.click()
      downloadAnchor.remove()
      
      toast.success("Backup do sistema gerado e baixado com sucesso!", { id: "backup" })
    } catch (err) {
      console.error(err)
      toast.error("Erro ao gerar backup dos dados.", { id: "backup" })
    }
  }

  // Limpar cache e reiniciar preferências
  const handleLimparCache = () => {
    if (confirm("Deseja realmente redefinir todas as configurações locais do site? Isso removerá o tema customizado, preferências de notificação e foto de perfil.")) {
      localStorage.clear()
      sessionStorage.clear()
      toast.success("Preferências redefinidas com sucesso!")
      setTimeout(() => {
        window.location.reload()
      }, 1000)
    }
  }

  return (
    <div className="space-y-6 pt-12 md:pt-0 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-foreground">Configurações</h1>
          <p className="text-muted-foreground">Gerencie as preferências e opções do sistema</p>
        </div>

        <Button className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold shadow-md" onClick={handleSalvar} disabled={salvando}>
          <Save className="h-4 w-4 mr-2" />
          {salvando ? 'Salvando...' : 'Salvar Alterações'}
        </Button>
      </div>

      {error && (
        <Alert variant="destructive" className="bg-destructive/10 border-destructive/30">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      {success && (
        <Alert className="bg-success/10 border-success/30 text-success">
          <AlertDescription>{success}</AlertDescription>
        </Alert>
      )}

      <Tabs defaultValue="perfil" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2 lg:grid-cols-4 h-auto gap-2 bg-transparent p-0">
          <TabsTrigger
            value="perfil"
            className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground border border-border"
          >
            <User className="h-4 w-4 mr-2" />
            Perfil
          </TabsTrigger>
          <TabsTrigger
            value="notificacoes"
            className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground border border-border"
          >
            <Bell className="h-4 w-4 mr-2" />
            Notificações
          </TabsTrigger>
          <TabsTrigger
            value="aparencia"
            className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground border border-border"
          >
            <Palette className="h-4 w-4 mr-2" />
            Aparência
          </TabsTrigger>
          <TabsTrigger
            value="sistema"
            className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground border border-border"
          >
            <Settings className="h-4 w-4 mr-2" />
            Sistema
          </TabsTrigger>
        </TabsList>

        {/* Perfil */}
        <TabsContent value="perfil" className="space-y-6">
          <Card className="border-border/50">
            <CardHeader>
              <CardTitle className="text-base text-foreground">Informações do Perfil</CardTitle>
              <CardDescription className="text-xs">Atualize suas informações pessoais de contato</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center gap-4">
                <Avatar className="h-20 w-20 border border-border">
                  {avatar && <AvatarImage src={avatar} alt={perfil.nome} className="object-cover" />}
                  <AvatarFallback className="bg-primary text-primary-foreground text-2xl font-bold">
                    {perfil.nome.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <div className="relative">
                    <Input
                      type="file"
                      accept="image/*"
                      id="avatar-upload"
                      className="hidden"
                      onChange={handleAvatarChange}
                    />
                    <Button variant="outline" size="sm" asChild className="cursor-pointer border-border hover:bg-muted text-xs">
                      <label htmlFor="avatar-upload">
                        <Upload className="h-3.5 w-3.5 mr-1.5" />
                        Alterar Foto
                      </label>
                    </Button>
                  </div>
                  <p className="text-[10px] text-muted-foreground mt-1.5">JPG, PNG ou WEBP. Máximo 2MB.</p>
                </div>
              </div>

              <Separator className="bg-border/40" />

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="nome" className="text-xs font-semibold text-foreground">Nome Completo</Label>
                  <Input
                    id="nome"
                    value={perfil.nome}
                    onChange={(e) => setPerfil({ ...perfil, nome: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-xs font-semibold text-foreground">E-mail</Label>
                  <Input
                    id="email"
                    type="email"
                    value={perfil.email}
                    onChange={(e) => setPerfil({ ...perfil, email: e.target.value })}
                  />
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="cargo" className="text-xs font-semibold text-foreground">Cargo (Não Editável)</Label>
                  <Input
                    id="cargo"
                    value={perfil.cargo}
                    disabled
                    className="bg-muted/50 cursor-not-allowed opacity-90 text-muted-foreground border-border/50"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/50">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2 text-foreground">
                <Shield className="h-4 w-4 text-primary" />
                Segurança
              </CardTitle>
              <CardDescription className="text-xs">Gerencie sua senha de acesso</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleAlterarSenha} className="space-y-4">
                {passwordError && (
                  <Alert variant="destructive" className="bg-destructive/10 border-destructive/30">
                    <AlertDescription>{passwordError}</AlertDescription>
                  </Alert>
                )}
                {passwordSuccess && (
                  <Alert className="bg-success/10 border-success/30 text-success">
                    <AlertDescription>{passwordSuccess}</AlertDescription>
                  </Alert>
                )}
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="senha-atual" className="text-xs font-semibold text-foreground">Senha Atual</Label>
                    <Input
                      id="senha-atual"
                      type="password"
                      placeholder="••••••••"
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="nova-senha" className="text-xs font-semibold text-foreground">Nova Senha</Label>
                    <Input
                      id="nova-senha"
                      type="password"
                      placeholder="••••••••"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      required
                    />
                  </div>
                </div>
                <Button type="submit" variant="outline" className="border-primary text-primary hover:bg-primary/10 text-xs font-semibold">
                  Alterar Senha
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Notificações */}
        <TabsContent value="notificacoes" className="space-y-6">
          <Card className="border-border/50">
            <CardHeader>
              <CardTitle className="text-base text-foreground">Notificações por E-mail</CardTitle>
              <CardDescription className="text-xs">Escolha quais e-mails você deseja receber do sistema</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold text-sm text-foreground">Nova Matrícula</p>
                  <p className="text-xs text-muted-foreground">
                    Receber notificação quando um novo aluno for matriculado
                  </p>
                </div>
                <Switch
                  checked={notificacoes.emailNovaMatricula}
                  onCheckedChange={(checked) =>
                    setNotificacoes({ ...notificacoes, emailNovaMatricula: checked })
                  }
                />
              </div>
              <Separator className="bg-border/40" />
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold text-sm text-foreground">Relatório de Presença</p>
                  <p className="text-xs text-muted-foreground">
                    Receber resumo diário de faltas e presenças
                  </p>
                </div>
                <Switch
                  checked={notificacoes.emailPresenca}
                  onCheckedChange={(checked) => setNotificacoes({ ...notificacoes, emailPresenca: checked })}
                />
              </div>
              <Separator className="bg-border/40" />
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold text-sm text-foreground">Relatórios Mensais</p>
                  <p className="text-xs text-muted-foreground">
                    Receber relatórios consolidados mensalmente de desempenho
                  </p>
                </div>
                <Switch
                  checked={notificacoes.emailRelatorios}
                  onCheckedChange={(checked) => setNotificacoes({ ...notificacoes, emailRelatorios: checked })}
                />
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/50">
            <CardHeader>
              <CardTitle className="text-base text-foreground">Notificações Push</CardTitle>
              <CardDescription className="text-xs">Notificações em tempo real no navegador</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold text-sm text-foreground">Lembretes de Aula</p>
                  <p className="text-xs text-muted-foreground">Receber lembrete 30 minutos antes das aulas começarem</p>
                </div>
                <Switch
                  checked={notificacoes.pushAulas}
                  onCheckedChange={(checked) => setNotificacoes({ ...notificacoes, pushAulas: checked })}
                />
              </div>
              <Separator className="bg-border/40" />
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold text-sm text-foreground">Eventos e Reuniões</p>
                  <p className="text-xs text-muted-foreground">Notificar sobre eventos escolares próximos</p>
                </div>
                <Switch
                  checked={notificacoes.pushEventos}
                  onCheckedChange={(checked) => setNotificacoes({ ...notificacoes, pushEventos: checked })}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Aparência */}
        <TabsContent value="aparencia" className="space-y-6">
          <Card className="border-border/50">
            <CardHeader>
              <CardTitle className="text-base text-foreground">Tema do Sistema</CardTitle>
              <CardDescription className="text-xs">Escolha o tema visual da interface</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <button
                  type="button"
                  onClick={() => setAparencia({ ...aparencia, tema: 'light' })}
                  className={`p-4 rounded-lg border-2 transition-all duration-200 cursor-pointer ${
                    aparencia.tema === 'light'
                      ? 'border-primary bg-primary/5'
                      : 'border-border hover:border-primary/50 bg-card'
                  }`}
                >
                  <Sun className="h-6 w-6 mx-auto mb-2 text-foreground" />
                  <p className="text-sm font-semibold text-foreground">Claro</p>
                </button>
                <button
                  type="button"
                  onClick={() => setAparencia({ ...aparencia, tema: 'dark' })}
                  className={`p-4 rounded-lg border-2 transition-all duration-200 cursor-pointer ${
                    aparencia.tema === 'dark'
                      ? 'border-primary bg-primary/5'
                      : 'border-border hover:border-primary/50 bg-card'
                  }`}
                >
                  <Moon className="h-6 w-6 mx-auto mb-2 text-foreground" />
                  <p className="text-sm font-semibold text-foreground">Escuro</p>
                </button>
                <button
                  type="button"
                  onClick={() => setAparencia({ ...aparencia, tema: 'system' })}
                  className={`p-4 rounded-lg border-2 transition-all duration-200 cursor-pointer ${
                    aparencia.tema === 'system'
                      ? 'border-primary bg-primary/5'
                      : 'border-border hover:border-primary/50 bg-card'
                  }`}
                >
                  <Monitor className="h-6 w-6 mx-auto mb-2 text-foreground" />
                  <p className="text-sm font-semibold text-foreground">Sistema</p>
                </button>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/50">
            <CardHeader>
              <CardTitle className="text-base text-foreground">Preferências de Exibição</CardTitle>
              <CardDescription className="text-xs">Ajuste como o conteúdo e textos são exibidos</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label className="text-xs font-semibold text-foreground">Idioma</Label>
                <Select
                  value={aparencia.idioma}
                  onValueChange={(value) => setAparencia({ ...aparencia, idioma: value })}
                >
                  <SelectTrigger className="w-full sm:w-64">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pt-BR">Português (Brasil)</SelectItem>
                    <SelectItem value="en-US">English (US)</SelectItem>
                    <SelectItem value="es">Español</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Separator className="bg-border/40" />

              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold text-sm text-foreground">Modo Compacto</p>
                  <p className="text-xs text-muted-foreground">
                    Reduz espaçamentos e tamanhos de fontes para exibir mais conteúdo simultaneamente
                  </p>
                </div>
                <Switch
                  checked={aparencia.compacto}
                  onCheckedChange={(checked) => setAparencia({ ...aparencia, compacto: checked })}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Sistema */}
        <TabsContent value="sistema" className="space-y-6">
          <Card className="border-border/50">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2 text-foreground">
                <Database className="h-4 w-4 text-primary" />
                Dados do Sistema
              </CardTitle>
              <CardDescription className="text-xs">Informações sobre o volume de dados e ações administrativas</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 grid-cols-2 md:grid-cols-4">
                <div className="p-4 rounded-lg bg-accent/30 border border-border/40">
                  <p className="text-xs text-muted-foreground font-semibold">Alunos Cadastrados</p>
                  <p className="text-2xl font-bold text-foreground mt-1">{stats?.totalStudents ?? 0}</p>
                </div>
                <div className="p-4 rounded-lg bg-accent/30 border border-border/40">
                  <p className="text-xs text-muted-foreground font-semibold">Turmas Ativas</p>
                  <p className="text-2xl font-bold text-foreground mt-1">{stats?.activeClasses ?? 0}</p>
                </div>
                <div className="p-4 rounded-lg bg-accent/30 border border-border/40">
                  <p className="text-xs text-muted-foreground font-semibold">Planos de Aula</p>
                  <p className="text-2xl font-bold text-foreground mt-1">{stats?.totalLessonPlans ?? 0}</p>
                </div>
                <div className="p-4 rounded-lg bg-accent/30 border border-border/40">
                  <p className="text-xs text-muted-foreground font-semibold">Presenças Hoje</p>
                  <p className="text-2xl font-bold text-foreground mt-1">{stats?.totalAttendances ?? 0}</p>
                </div>
              </div>

              <Separator className="bg-border/40" />

              <div className="flex flex-wrap gap-3">
                <Button variant="outline" className="border-border text-foreground hover:bg-muted text-xs font-semibold" onClick={handleBackup}>
                  Exportar Dados (JSON)
                </Button>
                <Button variant="outline" className="border-primary text-primary hover:bg-primary/10 text-xs font-semibold" onClick={handleBackup}>
                  Fazer Backup do Sistema
                </Button>
                <Button variant="outline" className="border-destructive text-destructive hover:bg-destructive/10 text-xs font-semibold" onClick={handleLimparCache}>
                  Redefinir Configurações Locais
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/50">
            <CardHeader>
              <CardTitle className="text-base text-foreground">Sobre o Sistema</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-xs">
              <div className="flex justify-between py-1.5 border-b border-border/20">
                <span className="text-muted-foreground font-semibold">Versão</span>
                <span className="text-foreground">1.0.0</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-border/20">
                <span className="text-muted-foreground font-semibold">Última Atualização</span>
                <span className="text-foreground">22/06/2026</span>
              </div>
              <div className="flex justify-between py-1.5">
                <span className="text-muted-foreground font-semibold">Desenvolvido por</span>
                <span className="text-foreground">Projeto Anjos Inocentes</span>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
