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
} from "@/components/ui/dialog"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { UserPlus, ShieldCheck, Users, KeyRound } from "lucide-react"
import { useAuth } from "@/components/auth/auth-provider"
import { AccessDenied } from "@/components/auth/access-denied"
import { Spinner } from "@/components/ui/spinner"
import { API_URL, getStoredToken } from "@/lib/auth"
import { PERMISSIONS, type Permission } from "@/lib/permissions"

const permissionOptions: Array<{ value: Permission; label: string; description: string }> = [
  { value: PERMISSIONS.ALUNOS, label: "Alunos", description: "Cadastrar e editar alunos" },
  { value: PERMISSIONS.TURMAS, label: "Turmas", description: "Criar e editar turmas" },
  { value: PERMISSIONS.PRESENCA, label: "Presença", description: "Registrar presença" },
  { value: PERMISSIONS.PLANO_AULA, label: "Plano de Aula", description: "Criar planos de aula" },
  { value: PERMISSIONS.CALENDARIO, label: "Calendário", description: "Gerenciar eventos e aulas" },
  { value: PERMISSIONS.COMUNICACAO, label: "Comunicação", description: "Visualizar avisos" },
]

type Teacher = {
  id: string
  name: string
  email: string
  permissions: string[]
  createdAt: string
}

export default function ProfessoresPage() {
  const { user, loading } = useAuth()
  const [teachers, setTeachers] = useState<Teacher[]>([])
  const [listLoading, setListLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    permissions: [] as Permission[],
  })

  const permissionLabelMap = useMemo(() => {
    return new Map(permissionOptions.map((p) => [p.value, p.label]))
  }, [])

  useEffect(() => {
    if (!user || user.role !== "DIRECTOR") {
      setListLoading(false)
      return
    }

    const loadTeachers = async () => {
      setListLoading(true)
      setError("")
      const token = getStoredToken()
      if (!token) {
        setListLoading(false)
        return
      }
      try {
        const res = await fetch(`${API_URL}/users/teachers`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })
        const data = (await res.json()) as { teachers?: Teacher[]; error?: string }
        if (!res.ok || !data.teachers) {
          throw new Error(data.error || "Não foi possível carregar os professores")
        }
        setTeachers(data.teachers)
      } catch (err) {
        setError(err instanceof Error ? err.message : "Erro ao carregar professores")
      } finally {
        setListLoading(false)
      }
    }

    loadTeachers()
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

  if (user.role !== "DIRECTOR") {
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
      permissions: [],
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setSuccess("")
    setSaving(true)

    const token = getStoredToken()
    if (!token) {
      setSaving(false)
      setError("Sessão inválida. Faça login novamente.")
      return
    }

    try {
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
          permissions: form.permissions,
        }),
      })

      const data = (await res.json()) as { user?: Teacher; error?: string }
      if (!res.ok || !data.user) {
        throw new Error(data.error || "Não foi possível cadastrar o professor")
      }

      setTeachers((prev) => [data.user!, ...prev])
      setSuccess("Professor cadastrado com sucesso")
      setDialogOpen(false)
      resetForm()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao cadastrar professor")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Professores</h1>
          <p className="text-muted-foreground">Cadastre professores e defina permissões</p>
        </div>

        <Dialog open={dialogOpen} onOpenChange={(open) => {
          setDialogOpen(open)
          if (!open) resetForm()
        }}>
          <DialogTrigger asChild>
            <Button className="bg-primary hover:bg-primary/90">
              <UserPlus className="h-4 w-4 mr-2" />
              Novo Professor
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Cadastrar Professor</DialogTitle>
              <DialogDescription>Defina os dados de acesso e as permissões.</DialogDescription>
            </DialogHeader>

            <form onSubmit={handleSubmit} className="space-y-4 mt-2">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Nome</label>
                  <Input
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    placeholder="Nome do professor"
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
              </div>

              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm font-medium">
                  <ShieldCheck className="h-4 w-4 text-primary" />
                  Permissões
                </div>
                <div className="grid sm:grid-cols-2 gap-3">
                  {permissionOptions.map((permission) => (
                    <label
                      key={permission.value}
                      className="flex items-start gap-3 p-3 rounded-lg border border-border hover:bg-accent/40 cursor-pointer"
                    >
                      <Checkbox
                        checked={form.permissions.includes(permission.value)}
                        onCheckedChange={() => togglePermission(permission.value)}
                      />
                      <span className="space-y-0.5">
                        <span className="block text-sm font-medium">{permission.label}</span>
                        <span className="block text-xs text-muted-foreground">{permission.description}</span>
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit" className="bg-primary hover:bg-primary/90" disabled={saving}>
                  {saving ? "Salvando..." : "Cadastrar"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
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

      <Card className="border-border/50">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Lista de Professores</CardTitle>
              <CardDescription>{teachers.length} professor(es) cadastrados</CardDescription>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Users className="h-4 w-4" />
              {teachers.length}
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
                    <TableHead>Nome</TableHead>
                    <TableHead>E-mail</TableHead>
                    <TableHead>Permissões</TableHead>
                    <TableHead className="text-right">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {teachers.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                        Nenhum professor cadastrado
                      </TableCell>
                    </TableRow>
                  ) : (
                    teachers.map((teacher) => (
                      <TableRow key={teacher.id}>
                        <TableCell className="font-medium">{teacher.name}</TableCell>
                        <TableCell>{teacher.email}</TableCell>
                        <TableCell>
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
                        <TableCell className="text-right">
                          <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                            <KeyRound className="h-3 w-3" />
                            Ativo
                          </span>
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
    </div>
  )
}
