"use client"

import { useState, useEffect } from "react"
import { RequirePermission } from "@/components/auth/require-permission"
import { PERMISSIONS } from "@/lib/permissions"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { 
  Plus, 
  Pencil, 
  Trash2, 
  CheckCircle, 
  BookOpen, 
  Calendar,
  Eye,
  X
} from "lucide-react"
import { store } from "@/lib/store"
import type { PlanoAula } from "@/lib/types"

const turmas = [
  "Música - Manhã",
  "Música - Tarde",
  "Artes - Manhã",
  "Artes - Tarde",
  "Dança - Manhã",
  "Dança - Tarde",
  "Teatro - Manhã",
  "Teatro - Tarde",
  "Esportes - Manhã",
  "Esportes - Tarde",
]

const disciplinas = [
  "Teoria Musical",
  "Prática Instrumental",
  "Canto Coral",
  "Pintura",
  "Desenho",
  "Escultura",
  "Dança Contemporânea",
  "Ballet",
  "Dança de Rua",
  "Teatro",
  "Expressão Corporal",
  "Futebol",
  "Vôlei",
  "Basquete",
]

export default function PlanoAulaPage() {
  const [planos, setPlanos] = useState<PlanoAula[]>([])
  const [dialogOpen, setDialogOpen] = useState(false)
  const [viewDialogOpen, setViewDialogOpen] = useState(false)
  const [editingPlano, setEditingPlano] = useState<PlanoAula | null>(null)
  const [viewingPlano, setViewingPlano] = useState<PlanoAula | null>(null)
  const [sucesso, setSucesso] = useState("")
  
  // Form state
  const [form, setForm] = useState({
    data: "",
    turma: "",
    disciplina: "",
    conteudo: "",
    observacoes: "",
  })

  useEffect(() => {
    setPlanos(store.getPlanos())
  }, [])

  const resetForm = () => {
    setForm({
      data: "",
      turma: "",
      disciplina: "",
      conteudo: "",
      observacoes: "",
    })
    setEditingPlano(null)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (editingPlano) {
      store.updatePlano(editingPlano.id, form)
      setSucesso("Plano de aula atualizado com sucesso!")
    } else {
      store.addPlano(form)
      setSucesso("Plano de aula criado com sucesso!")
    }
    
    setPlanos(store.getPlanos())
    setDialogOpen(false)
    resetForm()
    
    setTimeout(() => setSucesso(""), 3000)
  }

  const handleEdit = (plano: PlanoAula) => {
    setEditingPlano(plano)
    setForm({
      data: plano.data,
      turma: plano.turma,
      disciplina: plano.disciplina,
      conteudo: plano.conteudo,
      observacoes: plano.observacoes,
    })
    setDialogOpen(true)
  }

  const handleView = (plano: PlanoAula) => {
    setViewingPlano(plano)
    setViewDialogOpen(true)
  }

  const handleDelete = (id: string) => {
    if (confirm("Tem certeza que deseja excluir este plano de aula?")) {
      store.deletePlano(id)
      setPlanos(store.getPlanos())
      setSucesso("Plano de aula excluído com sucesso!")
      setTimeout(() => setSucesso(""), 3000)
    }
  }

  const formatDate = (dateStr: string) => {
    return new Date(dateStr + 'T12:00:00').toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    })
  }

  return (
    <RequirePermission permission={PERMISSIONS.PLANO_AULA}>
    <div className="space-y-6 pt-12 md:pt-0">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-foreground">Plano de Aula</h1>
          <p className="text-muted-foreground mt-1">
            Crie e gerencie os planos de aula
          </p>
        </div>
        
        <Dialog open={dialogOpen} onOpenChange={(open) => {
          setDialogOpen(open)
          if (!open) resetForm()
        }}>
          <DialogTrigger asChild>
            <Button className="bg-primary hover:bg-primary/90 text-primary-foreground">
              <Plus className="h-4 w-4 mr-2" />
              Novo Plano
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingPlano ? "Editar Plano de Aula" : "Criar Novo Plano de Aula"}
              </DialogTitle>
              <DialogDescription>
                Preencha os detalhes do plano de aula
              </DialogDescription>
            </DialogHeader>
            
            <form onSubmit={handleSubmit} className="space-y-4 mt-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FieldGroup>
                  <Field>
                    <FieldLabel htmlFor="data">Data *</FieldLabel>
                    <Input
                      id="data"
                      type="date"
                      value={form.data}
                      onChange={(e) => setForm({ ...form, data: e.target.value })}
                      required
                    />
                  </Field>
                </FieldGroup>

                <FieldGroup>
                  <Field>
                    <FieldLabel htmlFor="turma">Turma *</FieldLabel>
                    <Select
                      value={form.turma}
                      onValueChange={(value) => setForm({ ...form, turma: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione a turma" />
                      </SelectTrigger>
                      <SelectContent>
                        {turmas.map((turma) => (
                          <SelectItem key={turma} value={turma}>
                            {turma}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </Field>
                </FieldGroup>

                <FieldGroup className="md:col-span-2">
                  <Field>
                    <FieldLabel htmlFor="disciplina">Disciplina *</FieldLabel>
                    <Select
                      value={form.disciplina}
                      onValueChange={(value) => setForm({ ...form, disciplina: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione a disciplina" />
                      </SelectTrigger>
                      <SelectContent>
                        {disciplinas.map((disciplina) => (
                          <SelectItem key={disciplina} value={disciplina}>
                            {disciplina}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </Field>
                </FieldGroup>
              </div>

              <FieldGroup>
                <Field>
                  <FieldLabel htmlFor="conteudo">Conteúdo da Aula *</FieldLabel>
                  <Textarea
                    id="conteudo"
                    value={form.conteudo}
                    onChange={(e) => setForm({ ...form, conteudo: e.target.value })}
                    placeholder="Descreva o conteúdo que será abordado na aula..."
                    rows={5}
                    required
                    className="resize-none"
                  />
                </Field>
              </FieldGroup>

              <FieldGroup>
                <Field>
                  <FieldLabel htmlFor="observacoes">Observações</FieldLabel>
                  <Textarea
                    id="observacoes"
                    value={form.observacoes}
                    onChange={(e) => setForm({ ...form, observacoes: e.target.value })}
                    placeholder="Observações adicionais, materiais necessários, etc."
                    rows={3}
                    className="resize-none"
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
                  {editingPlano ? "Salvar Alterações" : "Criar Plano"}
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
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Card className="border-border/50">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-full bg-primary/10">
              <BookOpen className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total de Planos</p>
              <p className="text-xl font-bold text-foreground">{planos.length}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/50">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-full bg-success/10">
              <Calendar className="h-5 w-5 text-success" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Aulas Agendadas Hoje</p>
              <p className="text-xl font-bold text-foreground">
                {planos.filter(p => p.data === new Date().toISOString().split('T')[0]).length}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Plans List */}
      <Card className="border-border/50">
        <CardHeader>
          <CardTitle>Planos de Aula</CardTitle>
          <CardDescription>
            {planos.length} plano(s) cadastrado(s)
          </CardDescription>
        </CardHeader>
        <CardContent>
          {planos.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <BookOpen className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Nenhum plano de aula cadastrado</p>
              <p className="text-sm mt-1">Clique em "Novo Plano" para criar o primeiro</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {planos.map((plano) => (
                <Card key={plano.id} className="border-border/50 hover:shadow-md transition-shadow">
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-base">{plano.disciplina}</CardTitle>
                        <CardDescription className="mt-1">
                          {plano.turma}
                        </CardDescription>
                      </div>
                      <span className="text-xs font-medium px-2 py-1 rounded-full bg-primary/10 text-primary">
                        {formatDate(plano.data)}
                      </span>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground line-clamp-2 mb-4">
                      {plano.conteudo}
                    </p>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleView(plano)}
                        className="flex-1"
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        Ver
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEdit(plano)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDelete(plano.id)}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* View Dialog */}
      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-primary" />
              {viewingPlano?.disciplina}
            </DialogTitle>
            <DialogDescription>
              {viewingPlano?.turma} - {viewingPlano && formatDate(viewingPlano.data)}
            </DialogDescription>
          </DialogHeader>
          
          {viewingPlano && (
            <div className="space-y-4 mt-4">
              <div>
                <h4 className="text-sm font-medium text-muted-foreground mb-2">Conteúdo da Aula</h4>
                <p className="text-foreground whitespace-pre-wrap bg-muted/50 p-4 rounded-lg">
                  {viewingPlano.conteudo}
                </p>
              </div>
              
              {viewingPlano.observacoes && (
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground mb-2">Observações</h4>
                  <p className="text-foreground whitespace-pre-wrap bg-muted/50 p-4 rounded-lg">
                    {viewingPlano.observacoes}
                  </p>
                </div>
              )}

              <div className="flex justify-end pt-4">
                <Button
                  variant="outline"
                  onClick={() => setViewDialogOpen(false)}
                >
                  Fechar
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
    </RequirePermission>
  )
}


