"use client"

import { useEffect, useMemo, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
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
import { 
  UserPlus, 
  ShieldCheck, 
  Users, 
  KeyRound, 
  Edit2, 
  Trash2, 
  MoreVertical, 
  Lock, 
  UserMinus, 
  UserCheck,
  Download,
  History,
  BarChart3,
  Layers,
  AlertTriangle 
} from "lucide-react"
import { useAuth } from "@/components/auth/auth-provider"
import { AccessDenied } from "@/components/auth/access-denied"
import { Spinner } from "@/components/ui/spinner"
import { API_URL, getStoredToken, type UserRole } from "@/lib/auth"
import { PERMISSIONS, type Permission } from "@/lib/permissions"
import { updateTeacher, deleteTeacher, resetPassword, getAuditLogs, getClasses, getStudents, type AuditLog } from "@/lib/api"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip } from "recharts"
import type { Turma } from "@/lib/types"

const permissionOptions: Array<{ value: Permission; label: string; description: string }> = [
  { value: PERMISSIONS.ALUNOS, label: "Alunos", description: "Cadastrar e editar alunos" },
  { value: PERMISSIONS.TURMAS, label: "Turmas", description: "Criar e editar turmas" },
  { value: PERMISSIONS.PRESENCA, label: "Presença", description: "Registrar presença" },
  { value: PERMISSIONS.PLANO_AULA, label: "Plano de Aula", description: "Criar planos de aula" },
  { value: PERMISSIONS.NOTAS, label: "Notas", description: "Lançar e gerenciar notas" },
  { value: PERMISSIONS.CALENDARIO, label: "Calendário", description: "Gerenciar eventos e aulas" },
  { value: PERMISSIONS.COMUNICACAO, label: "Comunicação", description: "Visualizar avisos" },
]

const DEFAULT_ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  TEACHER: [
    PERMISSIONS.PRESENCA,
    PERMISSIONS.NOTAS,
    PERMISSIONS.PLANO_AULA,
    PERMISSIONS.CALENDARIO,
    PERMISSIONS.COMUNICACAO,
  ],
  COORDINATOR: [
    PERMISSIONS.ALUNOS,
    PERMISSIONS.TURMAS,
    PERMISSIONS.PRESENCA,
    PERMISSIONS.PLANO_AULA,
    PERMISSIONS.NOTAS,
    PERMISSIONS.CALENDARIO,
    PERMISSIONS.COMUNICACAO,
  ],
  SECRETARY: [
    PERMISSIONS.ALUNOS,
    PERMISSIONS.TURMAS,
    PERMISSIONS.PRESENCA,
    PERMISSIONS.CALENDARIO,
    PERMISSIONS.COMUNICACAO,
  ],
  ADMIN: [
    PERMISSIONS.ALUNOS,
    PERMISSIONS.TURMAS,
    PERMISSIONS.PRESENCA,
    PERMISSIONS.PLANO_AULA,
    PERMISSIONS.NOTAS,
    PERMISSIONS.CALENDARIO,
    PERMISSIONS.COMUNICACAO,
  ],
  DIRECTOR: [
    PERMISSIONS.ALUNOS,
    PERMISSIONS.TURMAS,
    PERMISSIONS.PRESENCA,
    PERMISSIONS.PLANO_AULA,
    PERMISSIONS.NOTAS,
    PERMISSIONS.CALENDARIO,
    PERMISSIONS.COMUNICACAO,
  ],
  STUDENT: [],
}

type Teacher = {
  id: string
  name: string
  email: string
  role?: string
  permissions: string[]
  active: boolean
  cpf?: string
  telefone?: string
  dataNascimento?: string
  endereco?: string
  createdAt: string
}

const renderRoleBadge = (role?: string) => {
  switch (role) {
    case "ADMIN":
      return <Badge className="bg-orange-600 hover:bg-orange-700 text-white font-bold">Administrador</Badge>
    case "DIRECTOR":
      return <Badge className="bg-red-500 hover:bg-red-600 text-white font-bold">Diretor</Badge>
    case "COORDINATOR":
      return <Badge className="bg-purple-600 hover:bg-purple-700 text-white font-bold">Coordenador</Badge>
    case "SECRETARY":
      return <Badge className="bg-blue-600 hover:bg-blue-700 text-white font-bold">Secretário</Badge>
    case "TEACHER":
      return <Badge className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold">Professor</Badge>
    case "STUDENT":
      return <Badge className="bg-gray-500 hover:bg-gray-600 text-white font-bold">Aluno</Badge>
    default:
      return <Badge variant="secondary">Colaborador</Badge>
  }
}

export default function ProfessoresPage() {
  const { user, loading } = useAuth()
  const isAdminOrDirector = user?.role === "ADMIN" || user?.role === "DIRECTOR"
  const canAccess = user?.role === "ADMIN" || user?.role === "DIRECTOR" || user?.role === "COORDINATOR"
  const [teachers, setTeachers] = useState<Teacher[]>([])
  const [listLoading, setListLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingTeacher, setEditingTeacher] = useState<Teacher | null>(null)
  
  const [resetPasswordDialogOpen, setResetPasswordDialogOpen] = useState(false)
  const [resettingTeacher, setResettingTeacher] = useState<Teacher | null>(null)
  const [newPassword, setNewPassword] = useState("")

  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    role: "TEACHER" as UserRole,
    permissions: DEFAULT_ROLE_PERMISSIONS.TEACHER,
    cpf: "",
    telefone: "",
    dataNascimento: "",
    endereco: "",
  })

  // Additional states for Management panel
  const [logs, setLogs] = useState<AuditLog[]>([])
  const [classes, setClasses] = useState<Turma[]>([])
  const [studentsCount, setStudentsCount] = useState(0)

  const [searchQuery, setSearchQuery] = useState("")
  const [filterAction, setFilterAction] = useState("ALL")
  const [filterResource, setFilterResource] = useState("ALL")

  const permissionLabelMap = useMemo(() => {
    return new Map(permissionOptions.map((p) => [p.value, p.label]))
  }, [])

  const loadData = async () => {
    if (!user) return
    const token = getStoredToken()
    if (!token) return

    setListLoading(true)
    try {
      const res = await fetch(`${API_URL}/users/teachers`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      const data = (await res.json()) as { teachers?: Teacher[]; error?: string }
      if (!res.ok || !data.teachers) {
        throw new Error(data.error || "Não foi possível carregar os colaboradores")
      }
      setTeachers(data.teachers)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao carregar colaboradores")
    } finally {
      setListLoading(false)
    }

    if (isAdminOrDirector) {
      getAuditLogs().then(setLogs).catch(err => console.error("Error loading logs:", err))
    }

    getClasses().then(setClasses).catch(err => console.error("Error loading classes:", err))
    getStudents().then(list => setStudentsCount(list.length)).catch(err => console.error("Error loading students count:", err))
  }

  useEffect(() => {
    if (user) {
      loadData()
    }
  }, [user])

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

  if (!canAccess) {
    return <AccessDenied />
  }

  const togglePermission = (permission: Permission) => {
    setForm((prev) => {
      const exists = prev.permissions.includes(permission)
      return {
        ...prev,
        permissions: exists
          ? prev.permissions.filter((p) => p !== permission)
          : [...prev.permissions, permission],
      }
    })
  }

  const resetForm = () => {
    setForm({
      name: "",
      email: "",
      password: "",
      role: "TEACHER" as UserRole,
      permissions: DEFAULT_ROLE_PERMISSIONS.TEACHER,
      cpf: "",
      telefone: "",
      dataNascimento: "",
      endereco: "",
    })
    setEditingTeacher(null)
  }

  const handleEdit = (teacher: Teacher) => {
    setEditingTeacher(teacher)
    setForm({
      name: teacher.name,
      email: teacher.email,
      password: "",
      role: (teacher.role as UserRole) || "TEACHER",
      permissions: teacher.permissions as Permission[],
      cpf: teacher.cpf || "",
      telefone: teacher.telefone || "",
      dataNascimento: teacher.dataNascimento || "",
      endereco: teacher.endereco || "",
    })
    setDialogOpen(true)
  }

  const handleToggleActive = async (teacher: Teacher) => {
    setError("")
    setSuccess("")
    try {
      const data = await updateTeacher(teacher.id, { active: !teacher.active })
      setTeachers(prev => prev.map(t => t.id === teacher.id ? data.user : t))
      setSuccess(`Colaborador ${data.user.active ? 'ativado' : 'desativado'} com sucesso`)
      loadData()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao alterar status do colaborador")
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Tem certeza que deseja excluir este colaborador?")) return
    setError("")
    setSuccess("")
    try {
      await deleteTeacher(id)
      setTeachers(prev => prev.filter(t => t.id !== id))
      setSuccess("Colaborador excluído com sucesso")
      loadData()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao excluir colaborador")
    }
  }

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!resettingTeacher) return
    setError("")
    setSuccess("")
    setSaving(true)
    try {
      await resetPassword(resettingTeacher.id, { password: newPassword })
      setSuccess("Senha redefinida com sucesso")
      setResetPasswordDialogOpen(false)
      setNewPassword("")
      setResettingTeacher(null)
      loadData()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao redefinir senha")
    } finally {
      setSaving(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setSuccess("")
    setSaving(true)

    try {
      if (editingTeacher) {
        const data = await updateTeacher(editingTeacher.id, {
          name: form.name,
          email: form.email,
          role: form.role,
          permissions: form.permissions,
          cpf: form.cpf,
          telefone: form.telefone,
          dataNascimento: form.dataNascimento,
          endereco: form.endereco,
        })
        setTeachers((prev) => prev.map(t => t.id === editingTeacher.id ? data.user : t))
        setSuccess("Colaborador atualizado com sucesso")
      } else {
        const token = getStoredToken()
        if (!token) {
          setError("Sessão inválida. Faça login novamente.")
          setSaving(false)
          return
        }
        const res = await fetch(`${API_URL}/users/teachers`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            name: form.name,
            email: form.email,
            password: form.password,
            role: form.role,
            permissions: form.permissions,
            cpf: form.cpf,
            telefone: form.telefone,
            dataNascimento: form.dataNascimento,
            endereco: form.endereco,
          }),
        })

        const data = (await res.json()) as { user?: Teacher; error?: string }
        if (!res.ok || !data.user) {
          throw new Error(data.error || "Não foi possível cadastrar o colaborador")
        }

        setTeachers((prev) => [data.user!, ...prev])
        setSuccess("Colaborador cadastrado com sucesso")
      }
      setDialogOpen(false)
      resetForm()
      loadData()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao cadastrar colaborador")
    } finally {
      setSaving(false)
    }
  }

  const exportTeamToCSV = () => {
    const headers = ["Nome", "Email", "Cargo", "CPF", "Telefone", "Data de Nascimento", "Endereço", "Status", "Data de Cadastro"]
    const rows = teachers.map(t => {
      let cargo = "Colaborador"
      if (t.role === "ADMIN") cargo = "Administrador"
      else if (t.role === "DIRECTOR") cargo = "Diretor"
      else if (t.role === "COORDINATOR") cargo = "Coordenador"
      else if (t.role === "SECRETARY") cargo = "Secretário(a)"
      else if (t.role === "TEACHER") cargo = "Professor"
      else if (t.role === "STUDENT") cargo = "Aluno"

      return [
        t.name,
        t.email,
        cargo,
        t.cpf || "",
        t.telefone || "",
        t.dataNascimento || "",
        t.endereco || "",
        t.active ? "Ativo" : "Inativo",
        t.createdAt ? t.createdAt.split("T")[0] : ""
      ]
    })

    const csvContent = "\uFEFF" 
      + [headers.join(";"), ...rows.map(e => e.join(";"))].join("\n")

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.setAttribute("href", url)
    link.setAttribute("download", `equipe_projeto_anjos_${new Date().toISOString().split("T")[0]}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const resourceMap: Record<string, string> = {
    student: "Aluno",
    class: "Turma",
    course: "Curso",
    grade: "Nota",
    lesson: "Plano Aula",
    event: "Evento",
    announcement: "Aviso",
    user: "Colaborador",
  }

  const renderActionBadge = (action: string) => {
    switch (action) {
      case "CREATE":
        return <Badge className="bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20 border-0 font-bold">Criar</Badge>
      case "UPDATE":
        return <Badge className="bg-blue-500/10 text-blue-500 hover:bg-blue-500/20 border-0 font-bold">Editar</Badge>
      case "DELETE":
        return <Badge className="bg-rose-500/10 text-rose-500 hover:bg-rose-500/20 border-0 font-bold">Excluir</Badge>
      case "RESET_PASSWORD":
        return <Badge className="bg-amber-500/10 text-amber-500 hover:bg-amber-500/20 border-0 font-bold">Senha</Badge>
      default:
        return <Badge variant="secondary">{action}</Badge>
    }
  }

  const filteredLogs = useMemo(() => {
    return logs.filter(log => {
      const matchesSearch = log.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            log.userName.toLowerCase().includes(searchQuery.toLowerCase())
      const matchesAction = filterAction === "ALL" || log.action === filterAction
      const matchesResource = filterResource === "ALL" || log.resource === filterResource
      return matchesSearch && matchesAction && matchesResource
    })
  }, [logs, searchQuery, filterAction, filterResource])

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Equipe e Gestão</h1>
          <p className="text-muted-foreground">Administre colaboradores, controle turmas, verifique atribuições e logs de auditoria</p>
        </div>

        {(user.role === "DIRECTOR" || user.role === "ADMIN") &&  (
          <Dialog open={dialogOpen} onOpenChange={(open) => {
            setDialogOpen(open)
            if (!open) resetForm()
          }}>
            <DialogTrigger asChild>
              <Button className="bg-primary hover:bg-primary/90">
                <UserPlus className="h-4 w-4 mr-2" />
                Novo Colaborador
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>{editingTeacher ? "Editar Colaborador" : "Novo Colaborador"}</DialogTitle>
                <DialogDescription>
                  {editingTeacher ? "Atualize os dados, cargo e permissões do colaborador." : "Defina os dados de acesso, cargo e permissões."}
                </DialogDescription>
              </DialogHeader>

              <form onSubmit={handleSubmit} className="space-y-4 mt-2">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Nome</label>
                    <Input
                      value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                      placeholder="Nome do colaborador"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">E-mail</label>
                    <Input
                      type="email"
                      value={form.email}
                      onChange={(e) => setForm({ ...form, email: e.target.value })}
                      placeholder="email@exemplo.com"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">CPF</label>
                    <Input
                      value={form.cpf}
                      onChange={(e) => setForm({ ...form, cpf: e.target.value })}
                      placeholder="000.000.000-00"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Telefone</label>
                    <Input
                      value={form.telefone}
                      onChange={(e) => setForm({ ...form, telefone: e.target.value })}
                      placeholder="(00) 00000-0000"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Data de Nascimento</label>
                    <Input
                      type="date"
                      value={form.dataNascimento}
                      onChange={(e) => setForm({ ...form, dataNascimento: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Cargo (Função)</label>
                    <Select
                      value={form.role}
                      onValueChange={(val: UserRole) => setForm({
                        ...form,
                        role: val,
                        permissions: DEFAULT_ROLE_PERMISSIONS[val] || [],
                      })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o cargo" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="TEACHER">Professor</SelectItem>
                        <SelectItem value="COORDINATOR">Coordenador</SelectItem>
                        <SelectItem value="SECRETARY">Secretário(a)</SelectItem>
                        <SelectItem value="DIRECTOR">Diretor(a)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2 sm:col-span-2">
                    <label className="text-sm font-medium">Endereço</label>
                    <Input
                      value={form.endereco}
                      onChange={(e) => setForm({ ...form, endereco: e.target.value })}
                      placeholder="Rua, número, bairro, cidade - UF"
                    />
                  </div>
                  {!editingTeacher && (
                    <div className="space-y-2 sm:col-span-2">
                      <label className="text-sm font-medium">Senha inicial</label>
                      <Input
                        type="password"
                        value={form.password}
                        onChange={(e) => setForm({ ...form, password: e.target.value })}
                        placeholder="Mínimo 6 caracteres"
                        minLength={6}
                        required
                      />
                    </div>
                  )}
                </div>

                <div className="space-y-3">
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-2 text-sm font-medium">
                      <ShieldCheck className="h-4 w-4 text-primary" />
                      Permissões Predefinidas
                    </div>
                    <span className="text-xs text-muted-foreground font-normal">
                      As permissões são fixas de acordo com o Cargo selecionado e não podem ser alteradas.
                    </span>
                  </div>
                  <div className="grid sm:grid-cols-2 gap-3">
                    {permissionOptions.map((permission) => (
                      <div
                        key={permission.value}
                        className="flex items-start gap-3 p-3 rounded-lg border border-border bg-muted/40 opacity-80 cursor-not-allowed select-none"
                      >
                        <Checkbox
                          checked={form.permissions.includes(permission.value)}
                          disabled
                        />
                        <span className="space-y-0.5">
                          <span className="block text-sm font-medium">{permission.label}</span>
                          <span className="block text-xs text-muted-foreground">{permission.description}</span>
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                    Cancelar
                  </Button>
                  <Button type="submit" className="bg-primary hover:bg-primary/90" disabled={saving}>
                    {saving ? "Salvando..." : (editingTeacher ? "Salvar" : "Cadastrar")}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        )}
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

      <Tabs defaultValue={(user.role === "DIRECTOR" || user.role === "ADMIN")? "colaboradores" : "estatisticas"} className="w-full">
        <TabsList className="grid w-full sm:w-auto grid-cols-2 lg:grid-cols-4 mb-6 bg-muted/60 h-auto p-1 gap-1">
          {(user.role === "DIRECTOR" || user.role === "ADMIN") && (
            <TabsTrigger value="colaboradores" className="flex items-center gap-2 py-2">
              <Users className="h-4 w-4" />
              Colaboradores
            </TabsTrigger>
          )}
          <TabsTrigger value="estatisticas" className="flex items-center gap-2 py-2">
            <BarChart3 className="h-4 w-4" />
            Métricas da Equipe
          </TabsTrigger>
          <TabsTrigger value="atribuicoes" className="flex items-center gap-2 py-2">
            <Layers className="h-4 w-4" />
            Atribuições
          </TabsTrigger>
          {(user.role === "DIRECTOR" || user.role === "ADMIN") && (
            <TabsTrigger value="auditoria" className="flex items-center gap-2 py-2">
              <History className="h-4 w-4" />
              Auditoria
            </TabsTrigger>
          )}
        </TabsList>

        {(user.role === "DIRECTOR" || user.role === "ADMIN") && (
          <TabsContent value="colaboradores" className="space-y-6 outline-none">
            <Card className="border-border/50">
              <CardHeader>
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <CardTitle>Lista de Colaboradores</CardTitle>
                    <CardDescription>{teachers.length} colaborador(es) cadastrados</CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button onClick={exportTeamToCSV} variant="outline" size="sm" className="h-9">
                      <Download className="h-4 w-4 mr-2" />
                      Exportar CSV
                    </Button>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground ml-2">
                      <Users className="h-4 w-4" />
                      {teachers.length}
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {listLoading ? (
                  <div className="py-10 flex justify-center">
                    <Spinner className="h-6 w-6" />
                  </div>
                ) : (
                  <div className="rounded-md border border-border overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-muted/50">
                          <TableHead className="font-semibold text-foreground text-sm">Nome / Detalhes</TableHead>
                          <TableHead className="font-semibold text-foreground text-sm">E-mail</TableHead>
                          <TableHead className="font-semibold text-foreground text-sm">Cargo</TableHead>
                          <TableHead className="font-semibold text-foreground text-sm">Permissões</TableHead>
                          <TableHead className="text-right font-semibold text-foreground text-sm">Status</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {teachers.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                              Nenhum colaborador cadastrado
                            </TableCell>
                          </TableRow>
                        ) : (
                          teachers.map((teacher) => (
                            <TableRow key={teacher.id} className="hover:bg-accent/10">
                              <TableCell className="font-medium align-top py-3 max-w-[280px]">
                                <div className="space-y-1">
                                  <p className="font-semibold text-foreground text-sm">{teacher.name}</p>
                                  <div className="text-[11px] text-muted-foreground space-y-0.5">
                                    {teacher.cpf && <p><strong>CPF:</strong> {teacher.cpf}</p>}
                                    {teacher.telefone && <p><strong>Tel:</strong> {teacher.telefone}</p>}
                                    {teacher.dataNascimento && (
                                      <p><strong>Nasc:</strong> {
                                        teacher.dataNascimento.includes("-") 
                                          ? teacher.dataNascimento.split("-").reverse().join("/") 
                                          : teacher.dataNascimento
                                      }</p>
                                    )}
                                    {teacher.endereco && <p className="truncate" title={teacher.endereco}><strong>End:</strong> {teacher.endereco}</p>}
                                  </div>
                                </div>
                              </TableCell>
                              <TableCell className="align-top py-3">{teacher.email}</TableCell>
                              <TableCell className="align-top py-3">{renderRoleBadge(teacher.role)}</TableCell>
                              <TableCell className="align-top py-3">
                                <div className="flex flex-wrap gap-1">
                                  {teacher.permissions.length === 0 ? (
                                    <Badge variant="secondary">Sem permissões</Badge>
                                  ) : (
                                    teacher.permissions.map((permission) => (
                                      <Badge key={permission} variant="secondary">
                                        {permissionLabelMap.get(permission as Permission) ?? permission}
                                      </Badge>
                                    ))
                                  )}
                                </div>
                              </TableCell>
                              <TableCell className="text-right align-top py-3">
                                <div className="flex items-center justify-end gap-2">
                                  <Badge variant={teacher.active ? "default" : "secondary"}>
                                    {teacher.active ? "Ativo" : "Inativo"}
                                  </Badge>
                                  <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                      <Button variant="ghost" size="icon" className="h-8 w-8">
                                        <MoreVertical className="h-4 w-4" />
                                      </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                      <DropdownMenuItem onClick={() => handleEdit(teacher)}>
                                        <Edit2 className="h-4 w-4 mr-2" />
                                        Editar
                                      </DropdownMenuItem>
                                      <DropdownMenuItem onClick={() => {
                                        setResettingTeacher(teacher)
                                        setResetPasswordDialogOpen(true)
                                      }}>
                                        <Lock className="h-4 w-4 mr-2" />
                                        Redefinir Senha
                                      </DropdownMenuItem>
                                      <DropdownMenuItem onClick={() => handleToggleActive(teacher)}>
                                        {teacher.active ? (
                                          <>
                                            <UserMinus className="h-4 w-4 mr-2 text-warning" />
                                            Desativar
                                          </>
                                        ) : (
                                          <>
                                            <UserCheck className="h-4 w-4 mr-2 text-success" />
                                            Ativar
                                          </>
                                        )}
                                      </DropdownMenuItem>
                                      <DropdownMenuItem 
                                        onClick={() => handleDelete(teacher.id)}
                                        className="text-destructive"
                                      >
                                        <Trash2 className="h-4 w-4 mr-2" />
                                        Excluir
                                      </DropdownMenuItem>
                                    </DropdownMenuContent>
                                  </DropdownMenu>
                                </div>
                              </TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        )}

        <TabsContent value="estatisticas" className="space-y-6 outline-none">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card className="border-border/50">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Total da Equipe</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{teachers.length}</div>
                <p className="text-xs text-muted-foreground">
                  {teachers.filter(t => t.active).length} ativos / {teachers.filter(t => !t.active).length} inativos
                </p>
              </CardContent>
            </Card>

            <Card className="border-border/50">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Professores</CardTitle>
                <Layers className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{teachers.filter(t => t.role === "TEACHER").length}</div>
                <p className="text-xs text-muted-foreground">Lecionando nas turmas ativas</p>
              </CardContent>
            </Card>

            <Card className="border-border/50">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Proporção Aluno-Prof.</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {teachers.filter(t => t.role === "TEACHER").length > 0
                    ? (studentsCount / teachers.filter(t => t.role === "TEACHER").length).toFixed(1)
                    : "N/A"}
                </div>
                <p className="text-xs text-muted-foreground">Média de alunos por professor</p>
              </CardContent>
            </Card>

            <Card className="border-border/50">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Gestão e Secretaria</CardTitle>
                <ShieldCheck className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {teachers.filter(t => t.role === "COORDINATOR" || t.role === "SECRETARY" || t.role === "DIRECTOR" || t.role === "ADMIN").length}
                </div>
                <p className="text-xs text-muted-foreground">Gestores, coordenação e secretaria</p>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <Card className="border-border/50">
              <CardHeader>
                <CardTitle>Distribuição por Função</CardTitle>
                <CardDescription>Quantidade de colaboradores em cada cargo</CardDescription>
              </CardHeader>
              <CardContent className="h-[280px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={[
                    { name: "Professor", quantidade: teachers.filter(t => t.role === "TEACHER").length },
                    { name: "Coordenador", quantidade: teachers.filter(t => t.role === "COORDINATOR").length },
                    { name: "Secretário", quantidade: teachers.filter(t => t.role === "SECRETARY").length },
                    { name: "Diretor", quantidade: teachers.filter(t => t.role === "DIRECTOR").length },
                    { name: "Administrador", quantidade: teachers.filter(t => t.role === "ADMIN").length },
                  ]}>
                    <XAxis dataKey="name" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                    <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} allowDecimals={false} />
                    <Tooltip cursor={{ fill: 'rgba(0, 0, 0, 0.05)' }} />
                    <Bar dataKey="quantidade" fill="#3b82f6" radius={[4, 4, 0, 0]} maxBarSize={50} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card className="border-border/50">
              <CardHeader>
                <CardTitle>Informações Administrativas</CardTitle>
                <CardDescription>Carga horária e dados agregados</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Total de Alunos Ativos:</span>
                    <span className="font-semibold">{studentsCount}</span>
                  </div>
                  <hr className="border-border/50" />
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Total de Turmas Cadastradas:</span>
                    <span className="font-semibold">{classes.length}</span>
                  </div>
                  <hr className="border-border/50" />
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Média de Turmas por Professor:</span>
                    <span className="font-semibold">
                      {teachers.filter(t => t.role === "TEACHER").length > 0
                        ? (classes.length / teachers.filter(t => t.role === "TEACHER").length).toFixed(1)
                        : "0"}
                    </span>
                  </div>
                  <hr className="border-border/50" />
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Status da Equipe:</span>
                    <span className="font-semibold text-emerald-500">
                      {teachers.filter(t => t.active).length} Ativos
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="atribuicoes" className="space-y-6 outline-none">
          {classes.filter(c => !c.professorId || c.professorId === "").length > 0 && (
            <Alert variant="destructive" className="bg-destructive/10 border-destructive/30 text-destructive">
              <AlertTriangle className="h-4 w-4 mr-2" />
              <AlertDescription className="font-semibold text-sm">
                Atenção: Há {classes.filter(c => !c.professorId || c.professorId === "").length} turma(s) sem professor responsável.
              </AlertDescription>
            </Alert>
          )}

          <div className="grid gap-6 md:grid-cols-3">
            <div className="md:col-span-2">
              <Card className="border-border/50">
                <CardHeader>
                  <CardTitle>Alocação de Professores</CardTitle>
                  <CardDescription>Carga horária e turmas sob responsabilidade de cada docente</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="rounded-md border border-border overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-muted/50">
                          <TableHead>Professor</TableHead>
                          <TableHead>Turmas</TableHead>
                          <TableHead>Qtd. Turmas</TableHead>
                          <TableHead>Status</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {teachers.filter(t => t.role === "TEACHER").length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                              Nenhum professor cadastrado
                            </TableCell>
                          </TableRow>
                        ) : (
                          teachers.filter(t => t.role === "TEACHER").map((teacher) => {
                            const teacherClasses = classes.filter(c => c.professorId === teacher.id)
                            const classCount = teacherClasses.length
                            let statusBadge = <Badge className="bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20 font-bold border-0">Adequado</Badge>
                            if (classCount === 0) {
                              statusBadge = <Badge className="bg-yellow-500/10 text-yellow-500 hover:bg-yellow-500/20 font-bold border-0">Sem Turmas</Badge>
                            } else if (classCount > 3) {
                              statusBadge = <Badge className="bg-amber-500/10 text-amber-500 hover:bg-amber-500/20 font-bold border-0 flex items-center gap-1 w-max">
                                <AlertTriangle className="h-3 w-3" /> Sobrecarga
                              </Badge>
                            }
                            
                            return (
                              <TableRow key={teacher.id}>
                                <TableCell className="font-medium">
                                  <div>
                                    <p>{teacher.name}</p>
                                    <p className="text-xs text-muted-foreground">{teacher.email}</p>
                                  </div>
                                </TableCell>
                                <TableCell>
                                  <div className="flex flex-wrap gap-1 max-w-[300px]">
                                    {classCount === 0 ? (
                                      <span className="text-xs text-muted-foreground">—</span>
                                    ) : (
                                      teacherClasses.map(c => (
                                        <Badge key={c.id} variant="secondary" className="text-xs">
                                          {c.nome} ({c.curso})
                                        </Badge>
                                      ))
                                    )}
                                  </div>
                                </TableCell>
                                <TableCell className="font-semibold text-center">{classCount}</TableCell>
                                <TableCell>{statusBadge}</TableCell>
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

            <div>
              <Card className="border-border/50">
                <CardHeader>
                  <CardTitle className="text-sm font-semibold flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-destructive" />
                    Turmas Sem Professor
                  </CardTitle>
                  <CardDescription>Turmas que necessitam de atribuição de docente</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {classes.filter(c => !c.professorId || c.professorId === "").length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-4">Tudo em dia! Todas as turmas têm professores.</p>
                  ) : (
                    classes.filter(c => !c.professorId || c.professorId === "").map(c => (
                      <div key={c.id} className="p-3 rounded-lg border border-destructive/20 bg-destructive/5 space-y-1">
                        <p className="text-sm font-medium text-foreground">{c.nome}</p>
                        <div className="flex justify-between text-xs text-muted-foreground">
                          <span>Curso: {c.curso}</span>
                          <span>Sala: {c.sala}</span>
                        </div>
                      </div>
                    ))
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        {(user.role === "DIRECTOR" || user.role === "ADMIN") && (
          <TabsContent value="auditoria" className="space-y-6 outline-none">
            <Card className="border-border/50">
              <CardHeader>
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                  <div>
                    <CardTitle>Histórico de Auditoria</CardTitle>
                    <CardDescription>Registro das ações realizadas pelos coordenadores e administradores</CardDescription>
                  </div>
                  <div className="flex flex-wrap gap-2 items-center">
                    <Input
                      placeholder="Buscar descrição ou usuário..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full sm:w-[220px] h-9 text-sm"
                    />
                    <Select value={filterAction} onValueChange={setFilterAction}>
                      <SelectTrigger className="w-[120px] h-9 text-sm">
                        <SelectValue placeholder="Ação" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ALL">Todas Ações</SelectItem>
                        <SelectItem value="CREATE">Criar</SelectItem>
                        <SelectItem value="UPDATE">Editar</SelectItem>
                        <SelectItem value="DELETE">Excluir</SelectItem>
                        <SelectItem value="RESET_PASSWORD">Senha</SelectItem>
                      </SelectContent>
                    </Select>
                    <Select value={filterResource} onValueChange={setFilterResource}>
                      <SelectTrigger className="w-[140px] h-9 text-sm">
                        <SelectValue placeholder="Recurso" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ALL">Todos Recursos</SelectItem>
                        <SelectItem value="student">Aluno</SelectItem>
                        <SelectItem value="class">Turma</SelectItem>
                        <SelectItem value="course">Curso</SelectItem>
                        <SelectItem value="grade">Nota</SelectItem>
                        <SelectItem value="lesson">Plano Aula</SelectItem>
                        <SelectItem value="event">Evento</SelectItem>
                        <SelectItem value="announcement">Aviso</SelectItem>
                        <SelectItem value="user">Colaborador</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="rounded-md border border-border overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/50">
                        <TableHead>Data/Hora</TableHead>
                        <TableHead>Usuário</TableHead>
                        <TableHead>Cargo</TableHead>
                        <TableHead>Ação</TableHead>
                        <TableHead>Recurso</TableHead>
                        <TableHead>Descrição</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredLogs.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                            Nenhum registro encontrado
                          </TableCell>
                        </TableRow>
                      ) : (
                        filteredLogs.map((log) => (
                          <TableRow key={log.id}>
                            <TableCell className="text-xs whitespace-nowrap">
                              {new Date(log.createdAt).toLocaleString("pt-BR")}
                            </TableCell>
                            <TableCell className="font-medium">{log.userName}</TableCell>
                            <TableCell>{renderRoleBadge(log.userRole)}</TableCell>
                            <TableCell>{renderActionBadge(log.action)}</TableCell>
                            <TableCell>
                              <Badge variant="outline" className="text-xs font-normal">
                                {resourceMap[log.resource] || log.resource}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-sm text-foreground max-w-[400px] break-words">
                              {log.description}
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        )}
      </Tabs>

      <Dialog open={resetPasswordDialogOpen} onOpenChange={setResetPasswordDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Redefinir Senha</DialogTitle>
            <DialogDescription>
              Redefinir a senha do colaborador <strong>{resettingTeacher?.name}</strong>.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleResetPassword} className="space-y-4 mt-2">
            <div className="space-y-2">
              <label className="text-sm font-medium">Nova Senha</label>
              <Input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Mínimo 6 caracteres"
                minLength={6}
                required
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => setResetPasswordDialogOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" className="bg-primary hover:bg-primary/90" disabled={saving}>
                {saving ? "Salvando..." : "Redefinir"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
