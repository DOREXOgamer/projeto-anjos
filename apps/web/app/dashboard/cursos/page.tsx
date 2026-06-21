"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/components/auth/auth-provider"
import { AccessDenied } from "@/components/auth/access-denied"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { FieldGroup, Field, FieldLabel } from "@/components/ui/field"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog"
import { Plus, Pencil, Trash2, BookOpen, CheckCircle } from "lucide-react"
import { getCourses, createCourse, updateCourse, deleteCourse } from "@/lib/api"
import type { Course } from "@/lib/types"
import { Spinner } from "@/components/ui/spinner"

export default function CursosPage() {
  const { user, loading: authLoading } = useAuth()
  const [courses, setCourses] = useState<Course[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingCourse, setEditingCourse] = useState<Course | null>(null)
  const [sucesso, setSucesso] = useState("")
  const [error, setError] = useState("")

  const [form, setForm] = useState({
    name: "",
    description: "",
  })

  useEffect(() => {
    if (!user || (user.role !== "ADMIN" && user.role !== "DIRECTOR")) return

    const loadCourses = async () => {
      setLoading(true)
      try {
        const data = await getCourses()
        setCourses(data)
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    loadCourses()
  }, [user])

  if (authLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Spinner className="h-6 w-6" />
      </div>
    )
  }

  if (!user || (user.role !== "ADMIN" && user.role !== "DIRECTOR")) {
    return <AccessDenied />
  }

  const resetForm = () => {
    setForm({ name: "", description: "" })
    setEditingCourse(null)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setSucesso("")

    try {
      if (editingCourse) {
        await updateCourse(editingCourse.id, form)
        setSucesso("Curso atualizado com sucesso!")
      } else {
        await createCourse(form)
        setSucesso("Curso cadastrado com sucesso!")
      }
      const data = await getCourses()
      setCourses(data)
      setDialogOpen(false)
      resetForm()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao salvar curso")
    }

    setTimeout(() => setSucesso(""), 3000)
  }

  const handleEdit = (course: Course) => {
    setEditingCourse(course)
    setForm({
      name: course.name,
      description: course.description || "",
    })
    setDialogOpen(true)
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Deseja realmente excluir este curso? Todas as turmas deste curso terão sua referência desvinculada.")) {
      return
    }

    try {
      await deleteCourse(id)
      const data = await getCourses()
      setCourses(data)
      setSucesso("Curso excluído com sucesso!")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao excluir curso")
    }
    setTimeout(() => setSucesso(""), 3000)
  }

  return (
    <div className="space-y-6 pt-12 md:pt-0 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-foreground">Cursos</h1>
          <p className="text-muted-foreground mt-1">
            Gerencie os cursos oferecidos pelo projeto
          </p>
        </div>

        <Dialog open={dialogOpen} onOpenChange={(open) => {
          setDialogOpen(open)
          if (!open) resetForm()
        }}>
          <DialogTrigger asChild>
            <Button className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold shadow-md shrink-0">
              <Plus className="h-4 w-4 mr-2" />
              Novo Curso
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md bg-background border border-border">
            <DialogHeader>
              <DialogTitle className="text-foreground">
                {editingCourse ? "Editar Curso" : "Cadastrar Novo Curso"}
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground">
                Insira as informações do curso.
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleSubmit} className="space-y-4 mt-2">
              <FieldGroup>
                <Field>
                  <FieldLabel htmlFor="name" className="text-foreground font-medium">Nome do Curso *</FieldLabel>
                  <Input
                    id="name"
                    type="text"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    placeholder="Ex: Violão Avançado, Dança de Rua"
                    required
                  />
                </Field>
              </FieldGroup>

              <FieldGroup>
                <Field>
                  <FieldLabel htmlFor="description" className="text-foreground font-medium">Descrição</FieldLabel>
                  <Input
                    id="description"
                    type="text"
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                    placeholder="Resumo sobre o que é ensinado"
                  />
                </Field>
              </FieldGroup>

              <DialogFooter className="pt-4 border-t border-border/50">
                <DialogClose asChild>
                  <Button type="button" variant="outline" className="border-border hover:bg-muted">
                    Cancelar
                  </Button>
                </DialogClose>
                <Button type="submit" className="bg-primary hover:bg-primary/90 font-semibold px-6">
                  {editingCourse ? "Salvar" : "Cadastrar"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Alerts */}
      {sucesso && (
        <Alert className="bg-success/10 border-success/30 text-success">
          <CheckCircle className="h-4 w-4" />
          <AlertDescription>{sucesso}</AlertDescription>
        </Alert>
      )}

      {error && (
        <Alert variant="destructive" className="bg-destructive/10 border-destructive/30 text-destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Courses Feed */}
      {loading ? (
        <div className="py-12 flex justify-center">
          <Spinner className="h-6 w-6" />
        </div>
      ) : courses.length === 0 ? (
        <Card className="border-border/50 bg-card/30">
          <CardContent className="py-12 text-center text-muted-foreground">
            <BookOpen className="h-12 w-12 mx-auto mb-4 opacity-30 text-primary" />
            <p className="font-semibold text-lg">Nenhum curso cadastrado</p>
            <p className="text-sm mt-1">
              Clique em "Novo Curso" para começar a estruturar as turmas.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {courses.map((course) => (
            <Card 
              key={course.id} 
              className="border-border/50 hover:shadow-md transition-all duration-300 bg-card/30 flex flex-col justify-between"
            >
              <CardHeader className="pb-2">
                <CardTitle className="text-lg font-bold text-foreground truncate">{course.name}</CardTitle>
                <CardDescription className="text-xs line-clamp-2 min-h-[32px] mt-1">
                  {course.description || "Sem descrição informada."}
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-2 border-t border-border/30 mt-4">
                <div className="flex gap-2 justify-end">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEdit(course)}
                    className="h-8 text-xs border-border"
                  >
                    <Pencil className="h-3.5 w-3.5 mr-1" />
                    Editar
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDelete(course.id)}
                    className="h-8 text-xs border-border text-destructive hover:bg-destructive/10 hover:text-destructive"
                  >
                    <Trash2 className="h-3.5 w-3.5 mr-1" />
                    Excluir
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
