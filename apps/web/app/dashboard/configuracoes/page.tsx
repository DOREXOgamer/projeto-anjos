"use client"

import { useState } from "react"
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
  const { user, loading } = useAuth()
  const [perfil, setPerfil] = useState({
    nome: 'Administrador',
    email: 'admin@anjosinocentes.org.br',
    cargo: 'Coordenador Pedagógico',
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

  const handleSalvar = () => {
    setSalvando(true)
    setTimeout(() => {
      setSalvando(false)
    }, 1000)
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
                <Avatar className="h-20 w-20">
                  <AvatarFallback className="bg-primary text-primary-foreground text-2xl">
                    {perfil.nome.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <Button variant="outline" size="sm">
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
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="senha-atual">Senha Atual</Label>
                  <Input id="senha-atual" type="password" placeholder="••••••••" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="nova-senha">Nova Senha</Label>
                  <Input id="nova-senha" type="password" placeholder="••••••••" />
                </div>
              </div>
              <Button variant="outline">Alterar Senha</Button>
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
              <div className="space-y-2">
                <Label>Idioma</Label>
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

              <Separator />

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
              <CardTitle className="text-base flex items-center gap-2">
                <Database className="h-4 w-4" />
                Dados do Sistema
              </CardTitle>
              <CardDescription>Informações e ações sobre os dados</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="p-4 rounded-lg bg-accent/50">
                  <p className="text-sm text-muted-foreground">Alunos Cadastrados</p>
                  <p className="text-2xl font-bold">145</p>
                </div>
                <div className="p-4 rounded-lg bg-accent/50">
                  <p className="text-sm text-muted-foreground">Turmas Ativas</p>
                  <p className="text-2xl font-bold">5</p>
                </div>
                <div className="p-4 rounded-lg bg-accent/50">
                  <p className="text-sm text-muted-foreground">Planos de Aula</p>
                  <p className="text-2xl font-bold">32</p>
                </div>
                <div className="p-4 rounded-lg bg-accent/50">
                  <p className="text-sm text-muted-foreground">Registros de Presença</p>
                  <p className="text-2xl font-bold">1.234</p>
                </div>
              </div>

              <Separator />

              <div className="flex flex-wrap gap-2">
                <Button variant="outline">Exportar Dados</Button>
                <Button variant="outline">Fazer Backup</Button>
                <Button variant="outline" className="text-destructive hover:text-destructive">
                  Limpar Cache
                </Button>
              </div>
            </CardContent>
          </Card>

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
