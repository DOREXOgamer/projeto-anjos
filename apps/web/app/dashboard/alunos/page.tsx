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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Plus, Pencil, Trash2, Search, CheckCircle, Users } from "lucide-react"
import { store } from "@/lib/store"
import type { Aluno } from "@/lib/types"

const cursos = ["Música", "Artes", "Dança", "Teatro", "Esportes", "Informática"]

// Máscaras para inputs
const formatCPF = (value: string) => {
  return value
    .replace(/\D/g, '')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d{1,2})/, '$1-$2')
    .replace(/(-\d{2})\d+?$/, '$1')
}

const formatTelefone = (value: string) => {
  return value
    .replace(/\D/g, '')
    .replace(/(\d{2})(\d)/, '($1) $2')
    .replace(/(\d{5})(\d)/, '$1-$2')
    .replace(/(-\d{4})\d+?$/, '$1')
}

export default function AlunosPage() {
  const [alunos, setAlunos] = useState<Aluno[]>([])
  const [filtro, setFiltro] = useState("")
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingAluno, setEditingAluno] = useState<Aluno | null>(null)
  const [sucesso, setSucesso] = useState("")
  
  // Form state
  const [form, setForm] = useState({
    nome: "",
    cpf: "",
    dataNascimento: "",
    email: "",
    telefone: "",
    endereco: "",
    curso: "",
  })

  useEffect(() => {
    setAlunos(store.getAlunos())
  }, [])

  const resetForm = () => {
    setForm({
      nome: "",
      cpf: "",
      dataNascimento: "",
      email: "",
      telefone: "",
      endereco: "",
      curso: "",
    })
    setEditingAluno(null)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (editingAluno) {
      store.updateAluno(editingAluno.id, form)
      setSucesso("Aluno atualizado com sucesso!")
    } else {
      store.addAluno(form)
      setSucesso("Aluno cadastrado com sucesso!")
    }
    
    setAlunos(store.getAlunos())
    setDialogOpen(false)
    resetForm()
    
    setTimeout(() => setSucesso(""), 3000)
  }

  const handleEdit = (aluno: Aluno) => {
    setEditingAluno(aluno)
    setForm({
      nome: aluno.nome,
      cpf: aluno.cpf,
      dataNascimento: aluno.dataNascimento,
      email: aluno.email,
      telefone: aluno.telefone,
      endereco: aluno.endereco,
      curso: aluno.curso,
    })
    setDialogOpen(true)
  }

  const handleDelete = (id: string) => {
    if (confirm("Tem certeza que deseja excluir este aluno?")) {
      store.deleteAluno(id)
      setAlunos(store.getAlunos())
      setSucesso("Aluno excluído com sucesso!")
      setTimeout(() => setSucesso(""), 3000)
    }
  }

  const alunosFiltrados = alunos.filter(aluno => 
    aluno.nome.toLowerCase().includes(filtro.toLowerCase()) ||
    aluno.curso.toLowerCase().includes(filtro.toLowerCase())
  )

  return (
    <RequirePermission permission={PERMISSIONS.ALUNOS}>
    <div className="space-y-6 pt-12 md:pt-0">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-foreground">Alunos</h1>
          <p className="text-muted-foreground mt-1">
            Gerencie os alunos cadastrados no projeto
          </p>
        </div>
        
        <Dialog open={dialogOpen} onOpenChange={(open) => {
          setDialogOpen(open)
          if (!open) resetForm()
        }}>
          <DialogTrigger asChild>
            <Button className="bg-primary hover:bg-primary/90 text-primary-foreground">
              <Plus className="h-4 w-4 mr-2" />
              Novo Aluno
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingAluno ? "Editar Aluno" : "Cadastrar Novo Aluno"}
              </DialogTitle>
              <DialogDescription>
                Preencha os dados do aluno abaixo
              </DialogDescription>
            </DialogHeader>
            
            <form onSubmit={handleSubmit} className="space-y-4 mt-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FieldGroup>
                  <Field>
                    <FieldLabel htmlFor="nome">Nome Completo *</FieldLabel>
                    <Input
                      id="nome"
                      value={form.nome}
                      onChange={(e) => setForm({ ...form, nome: e.target.value })}
                      placeholder="Nome do aluno"
                      required
                    />
                  </Field>
                </FieldGroup>

                <FieldGroup>
                  <Field>
                    <FieldLabel htmlFor="cpf">CPF *</FieldLabel>
                    <Input
                      id="cpf"
                      value={form.cpf}
                      onChange={(e) => setForm({ ...form, cpf: formatCPF(e.target.value) })}
                      placeholder="000.000.000-00"
                      maxLength={14}
                      required
                    />
                  </Field>
                </FieldGroup>

                <FieldGroup>
                  <Field>
                    <FieldLabel htmlFor="dataNascimento">Data de Nascimento *</FieldLabel>
                    <Input
                      id="dataNascimento"
                      type="date"
                      value={form.dataNascimento}
                      onChange={(e) => setForm({ ...form, dataNascimento: e.target.value })}
                      required
                    />
                  </Field>
                </FieldGroup>

                <FieldGroup>
                  <Field>
                    <FieldLabel htmlFor="email">E-mail</FieldLabel>
                    <Input
                      id="email"
                      type="email"
                      value={form.email}
                      onChange={(e) => setForm({ ...form, email: e.target.value })}
                      placeholder="email@exemplo.com"
                    />
                  </Field>
                </FieldGroup>

                <FieldGroup>
                  <Field>
                    <FieldLabel htmlFor="telefone">Telefone *</FieldLabel>
                    <Input
                      id="telefone"
                      value={form.telefone}
                      onChange={(e) => setForm({ ...form, telefone: formatTelefone(e.target.value) })}
                      placeholder="(00) 00000-0000"
                      maxLength={15}
                      required
                    />
                  </Field>
                </FieldGroup>

                <FieldGroup>
                  <Field>
                    <FieldLabel htmlFor="curso">Curso *</FieldLabel>
                    <Select
                      value={form.curso}
                      onValueChange={(value) => setForm({ ...form, curso: value })}
                    >
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

              <FieldGroup>
                <Field>
                  <FieldLabel htmlFor="endereco">Endereço *</FieldLabel>
                  <Input
                    id="endereco"
                    value={form.endereco}
                    onChange={(e) => setForm({ ...form, endereco: e.target.value })}
                    placeholder="Rua, número, bairro, cidade"
                    required
                  />
                </Field>
              </FieldGroup>

              <div className="flex gap-3 justify-end pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setDialogOpen(false)
                    resetForm()
                  }}
                >
                  Cancelar
                </Button>
                <Button type="submit" className="bg-primary hover:bg-primary/90 text-primary-foreground">
                  {editingAluno ? "Salvar Alterações" : "Cadastrar Aluno"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Success Alert */}
      {sucesso && (
        <Alert className="bg-success/10 border-success/30 text-success">
          <CheckCircle className="h-4 w-4" />
          <AlertDescription>{sucesso}</AlertDescription>
        </Alert>
      )}

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="border-border/50">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-full bg-primary/10">
              <Users className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total de Alunos</p>
              <p className="text-xl font-bold text-foreground">{alunos.length}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Table */}
      <Card className="border-border/50">
        <CardHeader>
          <CardTitle>Lista de Alunos</CardTitle>
          <CardDescription>
            {alunosFiltrados.length} aluno(s) encontrado(s)
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Search */}
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nome ou curso..."
              value={filtro}
              onChange={(e) => setFiltro(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Table */}
          <div className="rounded-md border border-border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead>Nome</TableHead>
                  <TableHead className="hidden md:table-cell">CPF</TableHead>
                  <TableHead className="hidden sm:table-cell">Telefone</TableHead>
                  <TableHead>Curso</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {alunosFiltrados.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                      Nenhum aluno encontrado
                    </TableCell>
                  </TableRow>
                ) : (
                  alunosFiltrados.map((aluno) => (
                    <TableRow key={aluno.id}>
                      <TableCell className="font-medium">{aluno.nome}</TableCell>
                      <TableCell className="hidden md:table-cell">{aluno.cpf}</TableCell>
                      <TableCell className="hidden sm:table-cell">{aluno.telefone}</TableCell>
                      <TableCell>
                        <span className="px-2 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary">
                          {aluno.curso}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEdit(aluno)}
                            className="h-8 w-8"
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDelete(aluno.id)}
                            className="h-8 w-8 text-destructive hover:text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
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


