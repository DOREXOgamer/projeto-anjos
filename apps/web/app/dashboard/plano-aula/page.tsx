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
  Paperclip,
  FileText,
  X,
  Download
} from "lucide-react"
import { getLessonPlans, createLessonPlan, updateLessonPlan, deleteLessonPlan, getClasses, getCourses } from "@/lib/api"
import type { PlanoAula, Turma, Course } from "@/lib/types"
import { API_URL, getStoredToken } from "@/lib/auth"

export default function PlanoAulaPage() {
  const [planos, setPlanos] = useState<PlanoAula[]>([])
  const [turmasList, setTurmasList] = useState<Turma[]>([])
  const [courses, setCourses] = useState<Course[]>([])
  const [dialogOpen, setDialogOpen] = useState(false)
  const [viewDialogOpen, setViewDialogOpen] = useState(false)
  const [editingPlano, setEditingPlano] = useState<PlanoAula | null>(null)
  const [viewingPlano, setViewingPlano] = useState<PlanoAula | null>(null)
  const [sucesso, setSucesso] = useState("")
  const [uploading, setUploading] = useState(false)
  
  // Form state
  const [form, setForm] = useState({
    data: "",
    endDate: "",
    turma: "",
    classId: "",
    disciplina: "",
    conteudo: "",
    observacoes: "",
    files: [] as string[],
  })

  useEffect(() => {
    const loadInitialData = async () => {
      try {
        const [plans, classes, fetchedCourses] = await Promise.all([
          getLessonPlans(),
          getClasses(),
          getCourses()
        ])
        setPlanos(plans)
        setTurmasList(classes.filter(c => c.status === "ativa"))
        setCourses(fetchedCourses)
      } catch (error) {
        console.error("Erro ao carregar dados iniciais de planos de aula:", error)
      }
    }

    loadInitialData()
  }, [])

  const resetForm = () => {
    setForm({
      data: "",
      endDate: "",
      turma: "",
      classId: "",
      disciplina: "",
      conteudo: "",
      observacoes: "",
      files: [],
    })
    setEditingPlano(null)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      if (editingPlano) {
        await updateLessonPlan(editingPlano.id, form)
        setSucesso("Plano de aula atualizado com sucesso!")
      } else {
        await createLessonPlan(form)
        setSucesso("Plano de aula criado com sucesso!")
      }

      const plans = await getLessonPlans()
      setPlanos(plans)
      setDialogOpen(false)
      resetForm()
    } catch (error) {
      console.error("Erro ao salvar plano:", error)
      setSucesso("Erro ao salvar plano de aula. Tente novamente.")
    }

    setTimeout(() => setSucesso(""), 3000)
  }

  const handleEdit = (plano: PlanoAula) => {
    setEditingPlano(plano)
    setForm({
      data: plano.data,
      endDate: plano.endDate || "",
      turma: plano.turma,
      classId: plano.classId || "",
      disciplina: plano.disciplina,
      conteudo: plano.conteudo,
      observacoes: plano.observacoes,
      files: plano.files || [],
    })
    setDialogOpen(true)
  }

  const handleView = (plano: PlanoAula) => {
    setViewingPlano(plano)
    setViewDialogOpen(true)
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return

    setUploading(true)
    const formData = new FormData()
    for (let i = 0; i < files.length; i++) {
      formData.append("files", files[i])
    }

    try {
      const token = getStoredToken()
      const res = await fetch(`${API_URL}/lesson-plans/upload`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      })

      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error || "Erro ao fazer upload dos arquivos")
      }

      setForm((prev) => ({
        ...prev,
        files: [...prev.files, ...data.urls],
      }))
    } catch (error) {
      console.error("Erro no upload:", error)
      alert("Erro ao fazer upload dos arquivos. Tente novamente.")
    } finally {
      setUploading(false)
    }
  }

  const handleRemoveFile = (fileUrl: string) => {
    setForm((prev) => ({
      ...prev,
      files: prev.files.filter((url) => url !== fileUrl),
    }))
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Tem certeza que deseja excluir este plano de aula?")) {
      return
    }

    try {
      await deleteLessonPlan(id)
      const plans = await getLessonPlans()
      setPlanos(plans)
      setSucesso("Plano de aula excluído com sucesso!")
    } catch (error) {
      console.error("Erro ao excluir plano de aula:", error)
      setSucesso("Erro ao excluir plano de aula. Tente novamente.")
    }

    setTimeout(() => setSucesso(""), 3000)
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
    <div className="space-y-6 pt-12 md:pt-0 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-foreground">Plano de Aula</h1>
          <p className="text-muted-foreground mt-1">
            Crie e gerencie os planos de aula vinculados às turmas
          </p>
        </div>
        
        <Dialog open={dialogOpen} onOpenChange={(open) => {
          setDialogOpen(open)
          if (!open) resetForm()
        }}>
          <DialogTrigger asChild>
            <Button className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold shadow-md">
              <Plus className="h-4 w-4 mr-2" />
              Novo Plano
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-background border border-border">
            <DialogHeader>
              <DialogTitle className="text-foreground">
                {editingPlano ? "Editar Plano de Aula" : "Criar Novo Plano de Aula"}
              </DialogTitle>
              <DialogDescription className="text-muted-foreground text-xs">
                Preencha os detalhes do plano de aula
              </DialogDescription>
            </DialogHeader>
            
            <form onSubmit={handleSubmit} className="space-y-4 mt-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FieldGroup>
                  <Field>
                    <FieldLabel htmlFor="data" className="text-foreground font-medium">Data de Início *</FieldLabel>
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
                    <FieldLabel htmlFor="endDate" className="text-foreground font-medium">Data Final (Opcional - Período)</FieldLabel>
                    <Input
                      id="endDate"
                      type="date"
                      value={form.endDate}
                      onChange={(e) => setForm({ ...form, endDate: e.target.value })}
                      min={form.data}
                    />
                  </Field>
                </FieldGroup>

                <FieldGroup className="md:col-span-2">
                  <Field>
                    <FieldLabel htmlFor="turma" className="text-foreground font-medium">Turma *</FieldLabel>
                    <Select
                      value={form.classId}
                      onValueChange={(value) => {
                        const selected = turmasList.find(t => t.id === value)
                        setForm({
                          ...form,
                          classId: value,
                          turma: selected ? `${selected.nome} (${selected.curso})` : ""
                        })
                      }}
                    >
                      <SelectTrigger id="turma">
                        <SelectValue placeholder="Selecione a turma" />
                      </SelectTrigger>
                      <SelectContent>
                        {turmasList.map((turma) => (
                          <SelectItem key={turma.id} value={turma.id}>
                            {turma.nome} ({turma.curso})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </Field>
                </FieldGroup>

                <FieldGroup className="md:col-span-2">
                  <Field>
                    <FieldLabel htmlFor="disciplina" className="text-foreground font-medium">Curso *</FieldLabel>
                    <Select
                      value={form.disciplina}
                      onValueChange={(value) => setForm({ ...form, disciplina: value })}
                    >
                      <SelectTrigger id="disciplina">
                        <SelectValue placeholder="Selecione o curso" />
                      </SelectTrigger>
                      <SelectContent>
                        {courses.map((course) => (
                          <SelectItem key={course.id} value={course.name}>
                            {course.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </Field>
                </FieldGroup>
              </div>

              <FieldGroup>
                <Field>
                  <FieldLabel htmlFor="conteudo" className="text-foreground font-medium">Conteúdo da Aula *</FieldLabel>
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
                  <FieldLabel htmlFor="observacoes" className="text-foreground font-medium">Observações</FieldLabel>
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

              <FieldGroup>
                <Field>
                  <FieldLabel className="text-foreground font-medium">Arquivos Anexos (Planos de aula)</FieldLabel>
                  <div className="flex flex-col gap-3">
                    <div className="flex items-center gap-2">
                      <Input
                        type="file"
                        multiple
                        onChange={handleFileUpload}
                        disabled={uploading}
                        className="hidden"
                        id="file-upload-input"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => document.getElementById("file-upload-input")?.click()}
                        disabled={uploading}
                        className="border-dashed border-2 hover:bg-muted py-6 flex flex-col items-center justify-center gap-1 w-full"
                      >
                        <Plus className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm font-medium">Anexar Arquivos</span>
                        <span className="text-xs text-muted-foreground">PDFs, Imagens, Documentos</span>
                      </Button>
                    </div>

                    {uploading && (
                      <p className="text-xs text-muted-foreground animate-pulse">Enviando arquivos...</p>
                    )}

                    {form.files && form.files.length > 0 && (
                      <div className="grid grid-cols-1 gap-2 mt-1">
                        {form.files.map((fileUrl, index) => {
                          const fileName = fileUrl.split("/").pop() || `Arquivo ${index + 1}`
                          return (
                            <div key={fileUrl} className="flex items-center justify-between p-2 bg-muted/40 rounded-lg border border-border">
                              <div className="flex items-center gap-2 truncate">
                                <FileText className="h-4 w-4 text-primary shrink-0" />
                                <span className="text-xs truncate">{fileName}</span>
                              </div>
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                onClick={() => handleRemoveFile(fileUrl)}
                                className="h-7 w-7 text-destructive hover:bg-destructive/10"
                              >
                                <X className="h-3.5 w-3.5" />
                              </Button>
                            </div>
                          )
                        })}
                      </div>
                    )}
                  </div>
                </Field>
              </FieldGroup>

              <div className="flex gap-3 justify-end pt-4 border-t border-border/50">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setDialogOpen(false)
                    resetForm()
                  }}
                  className="border-border hover:bg-muted"
                >
                  Cancelar
                </Button>
                <Button type="submit" className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold px-6 shadow-md">
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
              <p className="text-sm text-muted-foreground font-medium">Total de Planos</p>
              <p className="text-xl font-bold text-foreground mt-0.5">{planos.length}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/50">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-full bg-success/10">
              <Calendar className="h-5 w-5 text-success" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground font-medium">Aulas Agendadas Hoje</p>
              <p className="text-xl font-bold text-foreground mt-0.5">
                {planos.filter(p => p.data === new Date().toISOString().split('T')[0]).length}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Plans List */}
      <Card className="border-border/50">
        <CardHeader className="pb-3 border-b border-border/50">
          <CardTitle className="text-lg">Planos de Aula Cadastrados</CardTitle>
          <CardDescription className="text-xs">
            {planos.length} plano(s) cadastrado(s)
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          {planos.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <BookOpen className="h-12 w-12 mx-auto mb-4 opacity-30 text-primary" />
              <p className="font-semibold">Nenhum plano de aula cadastrado</p>
              <p className="text-sm mt-1">Clique em "Novo Plano" para criar o primeiro</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {planos.map((plano) => (
                <Card key={plano.id} className="border-border/50 hover:shadow-md transition-all duration-300 flex flex-col justify-between hover:border-primary/40 bg-card/30">
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <CardTitle className="text-base truncate text-foreground">{plano.disciplina}</CardTitle>
                        <CardDescription className="mt-1 text-xs truncate">
                          {plano.turma}
                        </CardDescription>
                      </div>
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20 shrink-0 text-center">
                        {plano.endDate ? `${formatDate(plano.data)} - ${formatDate(plano.endDate)}` : formatDate(plano.data)}
                      </span>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-2">
                    <p className="text-sm text-muted-foreground line-clamp-3 mb-2 min-h-[60px]">
                      {plano.conteudo}
                    </p>
                    {plano.files && plano.files.length > 0 && (
                      <div className="flex items-center gap-1.5 text-xs text-primary font-medium mb-4">
                        <FileText className="h-3.5 w-3.5" />
                        <span>{plano.files.length} anexo(s)</span>
                      </div>
                    )}
                    <div className="flex gap-2 border-t border-border/30 pt-3">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleView(plano)}
                        className="flex-1 text-xs h-8 border-border"
                      >
                        <Eye className="h-3.5 w-3.5 mr-1" />
                        Ver
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEdit(plano)}
                        className="h-8 w-8 border-border"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDelete(plano.id)}
                        className="h-8 w-8 border-border text-destructive hover:text-destructive hover:bg-destructive/10"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
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
        <DialogContent className="max-w-2xl bg-background border border-border">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-foreground">
              <BookOpen className="h-5 w-5 text-primary" />
              {viewingPlano?.disciplina}
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              {viewingPlano?.turma} - {viewingPlano && (
                viewingPlano.endDate 
                  ? `${formatDate(viewingPlano.data)} a ${formatDate(viewingPlano.endDate)}` 
                  : formatDate(viewingPlano.data)
              )}
            </DialogDescription>
          </DialogHeader>
          
          {viewingPlano && (
            <div className="space-y-4 mt-4">
              <div>
                <h4 className="text-sm font-semibold text-foreground mb-1.5">Conteúdo da Aula</h4>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap bg-muted/30 border border-border/50 p-4 rounded-lg">
                  {viewingPlano.conteudo}
                </p>
              </div>
              
              {viewingPlano.observacoes && (
                <div>
                  <h4 className="text-sm font-semibold text-foreground mb-1.5">Observações</h4>
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap bg-muted/30 border border-border/50 p-4 rounded-lg">
                    {viewingPlano.observacoes}
                  </p>
                </div>
              )}

              {viewingPlano.files && viewingPlano.files.length > 0 && (
                <div>
                  <h4 className="text-sm font-semibold text-foreground mb-1.5">Arquivos Anexos</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {viewingPlano.files.map((fileUrl: string, index: number) => {
                      const fileName = fileUrl.split("/").pop() || `Arquivo ${index + 1}`
                      const baseUrl = API_URL.endsWith("/api") ? API_URL.slice(0, -4) : API_URL
                      const downloadUrl = fileUrl.startsWith("http") ? fileUrl : `${baseUrl}${fileUrl}`
                      return (
                        <a
                          key={fileUrl}
                          href={downloadUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center justify-between p-2.5 bg-muted/40 hover:bg-muted/80 rounded-lg border border-border transition-colors group cursor-pointer"
                        >
                          <div className="flex items-center gap-2 truncate">
                            <FileText className="h-4 w-4 text-primary shrink-0" />
                            <span className="text-xs truncate group-hover:text-primary transition-colors">{fileName}</span>
                          </div>
                          <Download className="h-3.5 w-3.5 text-muted-foreground group-hover:text-primary transition-colors shrink-0" />
                        </a>
                      )
                    })}
                  </div>
                </div>
              )}

              <div className="flex justify-end pt-2">
                <Button
                  variant="outline"
                  onClick={() => setViewDialogOpen(false)}
                  className="border-border hover:bg-muted"
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
