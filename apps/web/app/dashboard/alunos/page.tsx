"use client"

import { useState, useEffect } from "react"
import { RequirePermission } from "@/components/auth/require-permission"
import { PERMISSIONS } from "@/lib/permissions"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { FieldGroup, Field, FieldLabel } from "@/components/ui/field"
import { Label } from "@/components/ui/label"
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
  DialogFooter
} from "@/components/ui/dialog"
import { Progress } from "@/components/ui/progress"
import { 
  Plus, 
  Pencil, 
  Trash2, 
  Search, 
  CheckCircle, 
  Users, 
  Upload, 
  Download, 
  FileSpreadsheet, 
  AlertTriangle,
  Loader2
} from "lucide-react"
import { getStudents, createStudent, updateStudent, deleteStudent, getClasses, getCourses } from "@/lib/api"
import type { Aluno, Turma, Course } from "@/lib/types"
import { Checkbox } from "@/components/ui/checkbox"
import { toast } from "sonner"

// Máscaras para inputs
const formatCPF = (value: string) => {
  return value
    .replace(/\D/g, '')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d{1,2})/, '$1-$2')
    .replace(/(-\d{2})\d+?$/, '$1')
}

const isValidCPF = (cpf: string): boolean => {
  const cleanCpf = cpf.replace(/\D/g, '')
  if (cleanCpf.length !== 11 || /^(\d)\1+$/.test(cleanCpf)) return false

  let sum = 0
  for (let i = 0; i < 9; i++) {
    sum += parseInt(cleanCpf.charAt(i)) * (10 - i)
  }
  let remainder = (sum * 10) % 11
  if (remainder === 10 || remainder === 11) remainder = 0
  if (remainder !== parseInt(cleanCpf.charAt(9))) return false

  sum = 0
  for (let i = 0; i < 10; i++) {
    sum += parseInt(cleanCpf.charAt(i)) * (11 - i)
  }
  remainder = (sum * 10) % 11
  if (remainder === 10 || remainder === 11) remainder = 0
  if (remainder !== parseInt(cleanCpf.charAt(10))) return false

  return true
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
  const [classes, setClasses] = useState<Turma[]>([])
  const [cursosList, setCursosList] = useState<Course[]>([])
  const [filtro, setFiltro] = useState("")
  const [filtroCurso, setFiltroCurso] = useState("todos")
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingAluno, setEditingAluno] = useState<Aluno | null>(null)

  // CSV Import States
  const [csvImportOpen, setCsvImportOpen] = useState(false)
  const [csvFile, setCsvFile] = useState<File | null>(null)
  const [csvPreview, setCsvPreview] = useState<any[]>([])
  const [importProgress, setImportProgress] = useState(0)
  const [importing, setImporting] = useState(false)
  
  // Form state
  const [form, setForm] = useState({
    nome: "",
    cpf: "",
    dataNascimento: "",
    email: "",
    telefone: "",
    endereco: "",
    curso: "",
    classIds: [] as string[],
  })
  const [cpfValid, setCpfValid] = useState<boolean | null>(null)
  const [cpfValidating, setCpfValidating] = useState(false)
  const [cpfError, setCpfError] = useState("")

  useEffect(() => {
    const loadData = async () => {
      try {
        const [students, classesData, coursesData] = await Promise.all([
          getStudents(),
          getClasses(),
          getCourses()
        ])
        setAlunos(students)
        setClasses(classesData)
        setCursosList(coursesData)
      } catch (error) {
        console.error("Erro ao carregar dados:", error)
        toast.error("Erro ao carregar dados dos alunos.")
      }
    }

    loadData()
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
      classIds: [],
    })
    setEditingAluno(null)
    setCpfValid(null)
    setCpfError("")
  }

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()

    const cleanCpf = form.cpf.replace(/\D/g, '')
    if (cleanCpf.length === 11 && cpfValid !== true) {
      setCpfError("Valide o CPF antes de cadastrar")
      return
    }

    try {
      // Derive curso from selected classes
      const selectedClasses = classes.filter(c => form.classIds.includes(c.id))
      const cursoNames = [...new Set(selectedClasses.map(c => c.curso).filter(Boolean))]
      const curso = cursoNames.join(", ") || form.curso || ""

      const payload = {
        ...form,
        curso,
        classIds: form.classIds,
        classId: form.classIds[0] || null
      }
      await createStudent(payload)
      toast.success("Aluno cadastrado com sucesso!")
      const students = await getStudents()
      setAlunos(students)
      setDialogOpen(false)
      resetForm()
    } catch (error) {
      console.error("Erro ao salvar aluno:", error)
      toast.error("Erro ao salvar aluno. Tente novamente.")
    }
  }

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault()

    const cleanCpf = form.cpf.replace(/\D/g, '')
    if (cleanCpf.length === 11 && cpfValid !== true) {
      setCpfError("Valide o CPF antes de salvar")
      return
    }

    try {
      if (editingAluno) {
        // Derive curso from selected classes
        const selectedClasses = classes.filter(c => form.classIds.includes(c.id))
        const cursoNames = [...new Set(selectedClasses.map(c => c.curso).filter(Boolean))]
        const curso = cursoNames.join(", ") || form.curso || ""

        const payload = {
          ...form,
          curso,
          classIds: form.classIds,
          classId: form.classIds[0] || null
        }
        await updateStudent(editingAluno.id, payload)
        toast.success("Aluno atualizado com sucesso!")
        const students = await getStudents()
        setAlunos(students)
        setDialogOpen(false)
        resetForm()
      }
    } catch (error) {
      console.error("Erro ao salvar aluno:", error)
      toast.error("Erro ao salvar aluno. Tente novamente.")
    }
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
      classIds: aluno.classIds ?? [],
    })
    setCpfValid(true) // Editing implies it was valid
    setDialogOpen(true)
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Tem certeza que deseja excluir este aluno?")) {
      return
    }

    try {
      await deleteStudent(id)
      const students = await getStudents()
      setAlunos(students)
      toast.success("Aluno excluído com sucesso!")
    } catch (error) {
      console.error("Erro ao excluir aluno:", error)
      toast.error("Erro ao excluir aluno. Tente novamente.")
    }
  }

  // Export current student list to CSV
  const handleExportCSV = () => {
    const headers = ["Nome", "CPF", "Data de Nascimento", "Email", "Telefone", "Endereço", "Curso"]
    const rows = alunos.map(a => [
      a.nome,
      a.cpf,
      a.dataNascimento,
      a.email || "",
      a.telefone || "",
      a.endereco || "",
      a.curso || ""
    ])
    
    // Using semicolon (;) as separator for Excel compatibility in PT-BR systems
    const csvContent = "data:text/csv;charset=utf-8,\uFEFF" 
      + [headers.join(";"), ...rows.map(r => r.map(val => `"${val.replace(/"/g, '""')}"`).join(";"))].join("\r\n")
    
    const encodedUri = encodeURI(csvContent)
    const link = document.createElement("a")
    link.setAttribute("href", encodedUri)
    link.setAttribute("download", `alunos_${new Date().toISOString().split("T")[0]}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    toast.success("CSV de alunos exportado com sucesso!")
  }

  // Parse CSV upload
  const handleCSVUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (event) => {
      const text = event.target?.result as string
      if (!text) return

      const lines = text.split(/\r?\n/).filter(line => line.trim().length > 0)
      if (lines.length <= 1) {
        toast.error("O arquivo CSV está vazio ou possui apenas o cabeçalho.")
        return
      }

      const parsedRows = lines.slice(1).map((line, idx) => {
        // Splitting by semicolon or comma, taking care of quotes
        const matches = line.match(/(".*?"|[^;,]+)/g) || []
        const row = matches.map(val => val.trim().replace(/^["']|["']$/g, '').replace(/""/g, '"'))
        
        const nome = row[0] || ""
        const cpf = row[1] || ""
        const dataNascimento = row[2] || ""
        const email = row[3] || ""
        const telefone = row[4] || ""
        const endereco = row[5] || ""
        const curso = row[6] || ""

        const errors: string[] = []
        if (!nome) errors.push("Nome obrigatório")
        if (!cpf) errors.push("CPF obrigatório")
        if (cpf && !isValidCPF(cpf)) errors.push("CPF inválido")
        if (!dataNascimento) errors.push("Nascimento obrigatório")

        return {
          id: idx,
          nome,
          cpf,
          dataNascimento,
          email,
          telefone,
          endereco,
          curso,
          errors,
          isValid: errors.length === 0
        }
      })

      setCsvPreview(parsedRows)
      setCsvFile(file)
    }
    reader.readAsText(file, "UTF-8")
  }

  // Confirm CSV bulk import
  const handleConfirmImport = async () => {
    if (!csvPreview || csvPreview.length === 0) return
    
    const validRows = csvPreview.filter(r => r.isValid)
    if (validRows.length === 0) {
      toast.error("Nenhum aluno válido para importar.")
      return
    }

    setImporting(true)
    setImportProgress(0)
    
    let successCount = 0
    let failCount = 0

    for (let i = 0; i < validRows.length; i++) {
      const row = validRows[i]
      try {
        await createStudent({
          nome: row.nome,
          cpf: row.cpf,
          dataNascimento: row.dataNascimento,
          email: row.email,
          telefone: row.telefone,
          endereco: row.endereco,
          curso: row.curso,
          classIds: []
        })
        successCount++
      } catch (err) {
        console.error(err)
        failCount++
      }
      setImportProgress(Math.round(((i + 1) / validRows.length) * 100))
    }

    setImporting(false)
    setCsvImportOpen(false)
    setCsvPreview([])
    setCsvFile(null)

    // Reload list
    const updated = await getStudents()
    setAlunos(updated)

    if (failCount === 0) {
      toast.success(`${successCount} alunos importados com sucesso!`)
    } else {
      toast.warning(`${successCount} alunos importados. ${failCount} falharam.`)
    }
  }

  // Download template CSV
  const handleDownloadTemplate = () => {
    const headers = ["Nome", "CPF", "Data de Nascimento", "Email", "Telefone", "Endereço", "Curso"]
    const sampleRow = ["José Silva", "123.456.789-00", "2010-05-15", "jose@email.com", "(11) 98888-7777", "Rua das Flores, 123", "Música"]
    const csvContent = "data:text/csv;charset=utf-8,\uFEFF" 
      + [headers.join(";"), sampleRow.join(";")].join("\r\n")
    const encodedUri = encodeURI(csvContent)
    const link = document.createElement("a")
    link.setAttribute("href", encodedUri)
    link.setAttribute("download", "modelo_alunos.csv")
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const alunosFiltrados = alunos.filter(aluno => {
    const matchBusca = aluno.nome.toLowerCase().includes(filtro.toLowerCase())
    
    // Check if filter course matches any of student's classes courses or student.curso string
    const studentCourses = aluno.curso ? aluno.curso.split(", ").map(c => c.trim()) : []
    const matchCurso = filtroCurso === "todos" || studentCourses.includes(filtroCurso)
    
    return matchBusca && matchCurso
  })

  return (
    <RequirePermission permission={PERMISSIONS.ALUNOS}>
    <div className="space-y-6 pt-12 md:pt-0 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-foreground">Alunos</h1>
          <p className="text-muted-foreground mt-1">
            Gerencie as matrículas e dados pessoais dos alunos
          </p>
        </div>
        
        <div className="flex flex-wrap gap-2">
          <Button 
            variant="outline"
            onClick={handleExportCSV}
            className="border-primary text-primary hover:bg-primary/10 font-semibold shadow-sm text-xs"
          >
            <Download className="h-4 w-4 mr-1.5" />
            Exportar CSV
          </Button>
          <Button 
            variant="outline"
            onClick={() => setCsvImportOpen(true)}
            className="border-primary text-primary hover:bg-primary/10 font-semibold shadow-sm text-xs"
          >
            <Upload className="h-4 w-4 mr-1.5" />
            Importar CSV
          </Button>

          <Dialog open={dialogOpen} onOpenChange={(open) => {
            setDialogOpen(open)
            if (!open) resetForm()
          }}>
            <DialogTrigger asChild>
              <Button className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold shadow-md text-xs">
                <Plus className="h-4 w-4 mr-2" />
                Novo Aluno
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-background border border-border">
              <DialogHeader>
                <DialogTitle className="text-foreground">
                  {editingAluno ? "Editar Aluno" : "Cadastrar Novo Aluno"}
                </DialogTitle>
                <DialogDescription className="text-muted-foreground text-xs">
                  Preencha os dados do aluno e selecione as turmas desejadas
                </DialogDescription>
              </DialogHeader>
              
              <form onSubmit={editingAluno ? handleUpdate : handleCreate} className="space-y-4 mt-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FieldGroup>
                    <Field>
                      <FieldLabel htmlFor="nome" className="text-foreground font-medium">Nome Completo *</FieldLabel>
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
                      <FieldLabel htmlFor="cpf" className="text-foreground font-medium">CPF *</FieldLabel>
                      <Input
                        id="cpf"
                        value={form.cpf}
                        onChange={(e) => {
                          const formatted = formatCPF(e.target.value)
                          setForm({ ...form, cpf: formatted })
                          setCpfValid(null)
                          setCpfError("")
                        }}
                        onBlur={async () => {
                          const cleanCpf = form.cpf.replace(/\D/g, '')
                          if (cleanCpf.length === 11) {
                            setCpfValidating(true)
                            const formatValid = isValidCPF(form.cpf)
                            if (!formatValid) {
                              setCpfError("CPF inválido (formato)")
                              setCpfValid(false)
                            } else {
                              setCpfValid(true)
                            }
                            setCpfValidating(false)
                          }
                        }}
                        placeholder="000.000.000-00"
                        maxLength={14}
                        required
                        className={cpfValid === false ? "border-destructive" : ""}
                      />
                      {cpfError && (
                        <p className="text-xs text-destructive mt-1">{cpfError}</p>
                      )}
                      {cpfValidating && (
                        <p className="text-xs text-muted-foreground mt-1">Validando CPF...</p>
                      )}
                      {cpfValid === true && (
                        <p className="text-xs text-success mt-1">CPF válido ✓</p>
                      )}
                    </Field>
                  </FieldGroup>

                  <FieldGroup>
                    <Field>
                      <FieldLabel htmlFor="dataNascimento" className="text-foreground font-medium">Data de Nascimento *</FieldLabel>
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
                      <FieldLabel htmlFor="email" className="text-foreground font-medium">Email</FieldLabel>
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
                      <FieldLabel htmlFor="telefone" className="text-foreground font-medium">Telefone *</FieldLabel>
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

                  {/* Multi-Course & Multi-Class Selection */}
                  <div className="md:col-span-2 space-y-2">
                    <Label className="text-sm font-semibold text-foreground">Matricular em Turmas *</Label>
                    <div className="border border-border rounded-lg p-4 max-h-60 overflow-y-auto space-y-4 bg-muted/10">
                      {cursosList.length === 0 ? (
                        <p className="text-xs text-muted-foreground py-2 text-center">Nenhum curso cadastrado no sistema</p>
                      ) : (
                        cursosList.map((curso) => {
                          const classesForCourse = classes.filter(c => (c.courseId === curso.id || c.curso === curso.name) && c.status === "ativa")
                          if (classesForCourse.length === 0) return null
                          
                          return (
                            <div key={curso.id} className="space-y-2 border-b border-border/30 pb-3 last:border-0 last:pb-0">
                              <h4 className="font-bold text-xs uppercase tracking-wider text-primary">{curso.name}</h4>
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pl-2">
                                {classesForCourse.map((c) => {
                                  const isChecked = form.classIds.includes(c.id)
                                  return (
                                    <label key={c.id} className="flex items-center gap-2.5 text-sm cursor-pointer p-1.5 rounded hover:bg-accent/40 select-none">
                                      <Checkbox
                                        checked={isChecked}
                                        onCheckedChange={(checked) => {
                                          setForm(prev => ({
                                            ...prev,
                                            classIds: checked
                                              ? [...prev.classIds, c.id]
                                              : prev.classIds.filter(id => id !== c.id)
                                          }))
                                        }}
                                      />
                                      <span className="text-foreground font-medium">
                                        {c.nome} <span className="text-xs text-muted-foreground font-normal">({c.horario})</span>
                                      </span>
                                    </label>
                                  )
                                })}
                              </div>
                            </div>
                          )
                        })
                      )}
                    </div>
                  </div>
                </div>

                <FieldGroup>
                  <Field>
                    <FieldLabel htmlFor="endereco" className="text-foreground font-medium">Endereço *</FieldLabel>
                    <Input
                      id="endereco"
                      value={form.endereco}
                      onChange={(e) => setForm({ ...form, endereco: e.target.value })}
                      placeholder="Rua, número, bairro, cidade"
                      required
                    />
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
                    className="border-border hover:bg-muted text-xs"
                  >
                    Cancelar
                  </Button>
                  <Button type="submit" className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold px-6 shadow-md text-xs">
                    {editingAluno ? "Salvar Alterações" : "Cadastrar Aluno"}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* CSV Import Dialog */}
      <Dialog open={csvImportOpen} onOpenChange={setCsvImportOpen}>
        <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto bg-background border border-border">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-foreground">
              <FileSpreadsheet className="h-5 w-5 text-primary" />
              Importar Alunos via Planilha (CSV)
            </DialogTitle>
            <DialogDescription className="text-xs">
              Envie um arquivo CSV com as colunas corretas. Baixe o modelo abaixo se necessário.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-3">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-3 rounded-lg border border-border bg-muted/20 gap-3">
              <div className="text-xs space-y-1">
                <p className="font-semibold text-foreground">Modelo de Importação</p>
                <p className="text-muted-foreground">O arquivo deve conter: Nome, CPF, Nascimento, Email, Telefone, Endereço, Curso.</p>
              </div>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleDownloadTemplate}
                className="text-xs border-border flex items-center gap-1.5"
              >
                <Download className="h-3.5 w-3.5" />
                Baixar Modelo CSV
              </Button>
            </div>

            <Field>
              <FieldLabel className="text-foreground font-semibold">Selecionar Arquivo CSV</FieldLabel>
              <Input
                type="file"
                accept=".csv"
                onChange={handleCSVUpload}
                disabled={importing}
                className="cursor-pointer file:text-primary file:font-semibold file:border-0 file:bg-transparent"
              />
            </Field>

            {/* Import Preview Table */}
            {csvPreview.length > 0 && (
              <div className="space-y-3">
                <p className="text-sm font-semibold text-foreground">Pré-visualização da Importação ({csvPreview.length} registros)</p>
                <div className="rounded-md border border-border max-h-56 overflow-y-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/40">
                        <TableHead className="text-xs">Nome</TableHead>
                        <TableHead className="text-xs">CPF</TableHead>
                        <TableHead className="text-xs">Nascimento</TableHead>
                        <TableHead className="text-xs">Curso</TableHead>
                        <TableHead className="text-xs">Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {csvPreview.map((row) => (
                        <TableRow key={row.id} className={row.isValid ? "hover:bg-accent/10" : "bg-destructive/5 hover:bg-destructive/10"}>
                          <TableCell className="text-xs font-medium py-2">{row.nome || <span className="text-destructive font-bold">Vazio</span>}</TableCell>
                          <TableCell className="text-xs py-2">{row.cpf || <span className="text-destructive font-bold">Vazio</span>}</TableCell>
                          <TableCell className="text-xs py-2">{row.dataNascimento || <span className="text-destructive font-bold">Vazio</span>}</TableCell>
                          <TableCell className="text-xs py-2">{row.curso || "-"}</TableCell>
                          <TableCell className="text-xs py-2">
                            {row.isValid ? (
                              <span className="text-success font-semibold flex items-center gap-1">✓ Válido</span>
                            ) : (
                              <span className="text-destructive font-semibold flex items-center gap-1" title={row.errors.join(", ")}>
                                <AlertTriangle className="h-3 w-3" />
                                Inválido
                              </span>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                {importing && (
                  <div className="space-y-2">
                    <div className="flex justify-between text-xs font-semibold text-muted-foreground">
                      <span>Importando alunos...</span>
                      <span>{importProgress}%</span>
                    </div>
                    <Progress value={importProgress} className="h-2 bg-muted [&>div]:bg-primary" />
                  </div>
                )}
              </div>
            )}
          </div>

          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setCsvImportOpen(false)
                setCsvPreview([])
                setCsvFile(null)
              }}
              disabled={importing}
              className="text-xs"
            >
              Cancelar
            </Button>
            <Button
              onClick={handleConfirmImport}
              disabled={importing || csvPreview.filter(r => r.isValid).length === 0}
              className="bg-primary hover:bg-primary/90 text-xs"
            >
              {importing ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Importando ({importProgress}%)
                </>
              ) : (
                <>
                  Confirmar Importação ({csvPreview.filter(r => r.isValid).length})
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="border-border/50 bg-card/30">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-full bg-primary/10">
              <Users className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground font-medium">Total de Alunos</p>
              <p className="text-xl font-bold text-foreground mt-0.5">{alunos.length}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Table */}
      <Card className="border-border/50">
        <CardHeader className="pb-3 border-b border-border/50">
          <CardTitle className="text-lg">Lista de Alunos</CardTitle>
          <CardDescription className="text-xs">
            {alunosFiltrados.length} aluno(s) encontrado(s)
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-4">
          {/* Search and Filter */}
          <div className="flex flex-col sm:flex-row gap-4 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nome..."
                value={filtro}
                onChange={(e) => setFiltro(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={filtroCurso} onValueChange={setFiltroCurso}>
              <SelectTrigger className="w-full sm:w-56">
                <SelectValue placeholder="Filtrar por Curso" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos os cursos</SelectItem>
                {cursosList.map(curso => (
                  <SelectItem key={curso.id} value={curso.name}>{curso.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Table */}
          <div className="rounded-md border border-border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead className="font-semibold text-foreground text-sm">Nome</TableHead>
                  <TableHead className="hidden md:table-cell font-semibold text-foreground text-sm">CPF</TableHead>
                  <TableHead className="hidden sm:table-cell font-semibold text-foreground text-sm">Telefone</TableHead>
                  <TableHead className="font-semibold text-foreground text-sm">Curso(s)</TableHead>
                  <TableHead className="font-semibold text-foreground text-sm">Turma(s)</TableHead>
                  <TableHead className="text-right font-semibold text-foreground text-sm w-24">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {alunosFiltrados.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      Nenhum aluno encontrado
                    </TableCell>
                  </TableRow>
                ) : (
                  alunosFiltrados.map((aluno) => {
                    const studentClasses = classes.filter(c => aluno.classIds?.includes(c.id))
                    
                    return (
                      <TableRow key={aluno.id} className="hover:bg-accent/20">
                        <TableCell className="font-medium text-foreground">{aluno.nome}</TableCell>
                        <TableCell className="hidden md:table-cell text-muted-foreground text-sm">{aluno.cpf}</TableCell>
                        <TableCell className="hidden sm:table-cell text-muted-foreground text-sm">{aluno.telefone}</TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            {studentClasses.length === 0 ? (
                              <span className="text-xs text-muted-foreground italic">Sem curso</span>
                            ) : (
                              Array.from(new Set(studentClasses.map(c => c.curso))).map(courseName => (
                                <span key={courseName} className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-primary/10 text-primary border border-primary/20">
                                  {courseName}
                                </span>
                              ))
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            {studentClasses.length === 0 ? (
                              <span className="text-xs text-muted-foreground italic">Não matriculado</span>
                            ) : (
                              studentClasses.map(c => (
                                <span key={c.id} className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-muted text-muted-foreground border border-border">
                                  {c.nome}
                                </span>
                              ))
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleEdit(aluno)}
                              className="h-8 w-8 text-muted-foreground hover:text-foreground"
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDelete(aluno.id)}
                              className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
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
    </RequirePermission>
  )
}
