"use client"

import { useState, useEffect } from "react"
import { updateProfile, changePassword, getReportsStats } from "@/lib/api"
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
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { useAuth } from "@/components/auth/auth-provider"
import { AccessDenied } from "@/components/auth/access-denied"
import { Spinner } from "@/components/ui/spinner"

export default function ConfiguracoesPage() {
  const { user, loading, updateUserState } = useAuth()
  const [perfil, setPerfil] = useState({
    nome: '',
    email: '',
    cargo: '',
  })

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
  const [avatarUrl, setAvatarUrl] = useState<string>("")

  const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (file.size > 2 * 1024 * 1024) {
      setError("A foto deve ter no máximo 2MB")
      return
    }

    const reader = new FileReader()
    reader.onload = (evt) => {
      const dataUrl = evt.target?.result as string
      if (dataUrl) {
        setAvatarUrl(dataUrl)
        setSuccess("Foto de perfil selecionada! Clique em 'Salvar Alterações'.")
      }
    }
    reader.readAsDataURL(file)
  }

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

  const handleSalvar = async () => {
    setSalvando(true)
    setError("")
    setSuccess("")
    try {
      const data = await updateProfile({ name: perfil.nome, email: perfil.email })
      updateUserState(data.user)
      setSuccess("Perfil updated successfully!")
      setTimeout(() => setSuccess(""), 4000)
    } catch (err) {
      console.error(err)
      setError(err instanceof Error ? err.message : "Erro ao atualizar perfil")
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
      setCurrentPassword("")
      setNewPassword("")
      setTimeout(() => setPasswordSuccess(""), 4000)
    } catch (err) {
      console.error(err)
      setPasswordError(err instanceof Error ? err.message : "Erro ao alterar senha")
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Configurações</h1>
          <p className="text-muted-foreground">Gerencie as preferências do sistema</p>
        </div>

        <Button className="bg-primary hover:bg-primary/90" onClick={handleSalvar} disabled={salvando}>
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
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Informações do Perfil</CardTitle>
              <CardDescription>Atualize suas informações pessoais</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center gap-4">
                <Avatar className="h-20 w-20 border border-border overflow-hidden">
                  {avatarUrl ? (
                    <img src={avatarUrl} alt={perfil.nome} className="h-full w-full object-cover" />
                  ) : (
                    <AvatarFallback className="bg-primary text-primary-foreground text-2xl font-bold">
                      {perfil.nome ? perfil.nome.charAt(0).toUpperCase() : "U"}
                    </AvatarFallback>
                  )}
                </Avatar>
                <div>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarUpload}
                    className="hidden"
                    id="avatar-upload-input"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => document.getElementById("avatar-upload-input")?.click()}
                  >
                    Alterar Foto
                  </Button>
                  <p className="text-xs text-muted-foreground mt-1">JPG, PNG ou GIF. Máximo 2MB.</p>
                </div>
              </div>

              <Separator />

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="nome">Nome Completo</Label>
                  <Input
                    id="nome"
                    value={perfil.nome}
                    onChange={(e) => setPerfil({ ...perfil, nome: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">E-mail</Label>
                  <Input
                    id="email"
                    type="email"
                    value={perfil.email}
                    onChange={(e) => setPerfil({ ...perfil, email: e.target.value })}
                  />
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="cargo">Cargo</Label>
                  <Input
                    id="cargo"
                    value={perfil.cargo}
                    onChange={(e) => setPerfil({ ...perfil, cargo: e.target.value })}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Shield className="h-4 w-4" />
                Segurança
              </CardTitle>
              <CardDescription>Gerencie sua senha e autenticação</CardDescription>
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
                    <Label htmlFor="senha-atual">Senha Atual</Label>
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
                    <Label htmlFor="nova-senha">Nova Senha</Label>
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
                <Button type="submit" variant="outline">Alterar Senha</Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Notificações */}
        <TabsContent value="notificacoes" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Notificações por E-mail</CardTitle>
              <CardDescription>Escolha quais e-mails você deseja receber</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-sm">Nova Matrícula</p>
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
              <Separator />
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-sm">Relatório de Presença</p>
                  <p className="text-xs text-muted-foreground">
                    Receber resumo diário de presença
                  </p>
                </div>
                <Switch
                  checked={notificacoes.emailPresenca}
                  onCheckedChange={(checked) => setNotificacoes({ ...notificacoes, emailPresenca: checked })}
                />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-sm">Relatórios Mensais</p>
                  <p className="text-xs text-muted-foreground">
                    Receber relatórios consolidados mensalmente
                  </p>
                </div>
                <Switch
                  checked={notificacoes.emailRelatorios}
                  onCheckedChange={(checked) => setNotificacoes({ ...notificacoes, emailRelatorios: checked })}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Notificações Push</CardTitle>
              <CardDescription>Notificações em tempo real no navegador</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-sm">Lembretes de Aula</p>
                  <p className="text-xs text-muted-foreground">Receber lembrete 30 minutos antes das aulas</p>
                </div>
                <Switch
                  checked={notificacoes.pushAulas}
                  onCheckedChange={(checked) => setNotificacoes({ ...notificacoes, pushAulas: checked })}
                />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-sm">Eventos e Reuniões</p>
                  <p className="text-xs text-muted-foreground">Notificar sobre eventos próximos</p>
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
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Tema</CardTitle>
              <CardDescription>Personalize a aparência do sistema</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <button
                  onClick={() => setAparencia({ ...aparencia, tema: 'light' })}
                  className={`p-4 rounded-lg border-2 transition-colors ${
                    aparencia.tema === 'light'
                      ? 'border-primary bg-primary/5'
                      : 'border-border hover:border-primary/50'
                  }`}
                >
                  <Sun className="h-6 w-6 mx-auto mb-2" />
                  <p className="text-sm font-medium">Claro</p>
                </button>
                <button
                  onClick={() => setAparencia({ ...aparencia, tema: 'dark' })}
                  className={`p-4 rounded-lg border-2 transition-colors ${
                    aparencia.tema === 'dark'
                      ? 'border-primary bg-primary/5'
                      : 'border-border hover:border-primary/50'
                  }`}
                >
                  <Moon className="h-6 w-6 mx-auto mb-2" />
                  <p className="text-sm font-medium">Escuro</p>
                </button>
                <button
                  onClick={() => setAparencia({ ...aparencia, tema: 'system' })}
                  className={`p-4 rounded-lg border-2 transition-colors ${
                    aparencia.tema === 'system'
                      ? 'border-primary bg-primary/5'
                      : 'border-border hover:border-primary/50'
                  }`}
                >
                  <Monitor className="h-6 w-6 mx-auto mb-2" />
                  <p className="text-sm font-medium">Sistema</p>
                </button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Preferências de Exibição</CardTitle>
              <CardDescription>Ajuste como o conteúdo é exibido</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-sm">Modo Compacto</p>
                  <p className="text-xs text-muted-foreground">
                    Reduz o espaçamento para mostrar mais conteúdo
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

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Sobre o Sistema</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Versão</span>
                <span>1.0.0</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Última Atualização</span>
                <span>23/03/2026</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Desenvolvido por</span>
                <span>Equipe Anjos Inocentes</span>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
