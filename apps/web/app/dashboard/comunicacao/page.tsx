"use client"

import { useState, useEffect } from "react"
import { RequirePermission } from "@/components/auth/require-permission"
import { PERMISSIONS } from "@/lib/permissions"
import { useAuth } from "@/components/auth/auth-provider"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { FieldGroup, Field, FieldLabel } from "@/components/ui/field"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Megaphone, Plus, CheckCircle, Calendar, Trash2, AlertCircle } from "lucide-react"
import { getAnnouncements, createAnnouncement, deleteAnnouncement, type Announcement } from "@/lib/api"

export default function ComunicacaoPage() {
  const { user } = useAuth()
  const [announcements, setAnnouncements] = useState<Announcement[]>([])
  const [dialogOpen, setDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [announcementToDelete, setAnnouncementToDelete] = useState<Announcement | null>(null)
  const [sucesso, setSucesso] = useState("")
  const [erro, setErro] = useState("")
  const [loading, setLoading] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const [form, setForm] = useState({ title: "", body: "" })

  const isDirector = user?.role === "ADMIN" || user?.role === "DIRECTOR"

  const loadAnnouncements = async () => {
    try {
      const data = await getAnnouncements()
      setAnnouncements(data)
    } catch (error) {
      console.error("Erro ao carregar avisos:", error)
    }
  }

  useEffect(() => {
    loadAnnouncements()
  }, [])

  const showFeedback = (msg: string, type: "ok" | "err") => {
    if (type === "ok") setSucesso(msg)
    else setErro(msg)
    setTimeout(() => { setSucesso(""); setErro("") }, 4000)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setErro("")
    try {
      await createAnnouncement(form)
      setForm({ title: "", body: "" })
      setDialogOpen(false)
      await loadAnnouncements()
      showFeedback("Aviso publicado com sucesso!", "ok")
    } catch (error) {
      showFeedback(error instanceof Error ? error.message : "Erro ao publicar aviso.", "err")
    } finally {
      setLoading(false)
    }
  }

  const requestDelete = (announcement: Announcement) => {
    setAnnouncementToDelete(announcement)
    setDeleteDialogOpen(true)
  }

  const confirmDelete = async () => {
    if (!announcementToDelete) return
    setDeleting(true)
    try {
      await deleteAnnouncement(announcementToDelete.id)
      setAnnouncements(prev => prev.filter(a => a.id !== announcementToDelete.id))
      setDeleteDialogOpen(false)
      setAnnouncementToDelete(null)
      showFeedback("Aviso excluído com sucesso!", "ok")
    } catch (error) {
      console.error("Erro ao excluir aviso:", error)
      showFeedback(error instanceof Error ? error.message : "Erro ao excluir aviso.", "err")
    } finally {
      setDeleting(false)
    }
  }

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const getInitials = (name: string) =>
    name.split(" ").slice(0, 2).map(p => p[0]).join("").toUpperCase()

  return (
    <RequirePermission permission={PERMISSIONS.COMUNICACAO}>
      <div className="space-y-6 pt-12 md:pt-0 animate-in fade-in duration-300">

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-foreground">Comunicação Interna</h1>
            <p className="text-muted-foreground mt-1">
              Consulte e acompanhe os avisos e comunicados importantes para a equipe
            </p>
          </div>

          {isDirector && (
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold shadow-md shrink-0">
                  <Plus className="h-4 w-4 mr-2" />
                  Publicar Aviso
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md bg-background border border-border">
                <DialogHeader>
                  <DialogTitle className="text-foreground">Publicar Novo Aviso</DialogTitle>
                  <DialogDescription className="text-xs text-muted-foreground">
                    Este aviso ficará visível para toda a equipe do projeto.
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4 mt-4">
                  <FieldGroup>
                    <Field>
                      <FieldLabel htmlFor="title" className="text-foreground font-medium">Título *</FieldLabel>
                      <Input
                        id="title"
                        value={form.title}
                        onChange={e => setForm({ ...form, title: e.target.value })}
                        placeholder="Ex: Reunião Geral de Planejamento"
                        required
                      />
                    </Field>
                  </FieldGroup>
                  <FieldGroup>
                    <Field>
                      <FieldLabel htmlFor="body" className="text-foreground font-medium">Mensagem *</FieldLabel>
                      <Textarea
                        id="body"
                        value={form.body}
                        onChange={e => setForm({ ...form, body: e.target.value })}
                        placeholder="Escreva a mensagem do comunicado aqui..."
                        rows={6}
                        required
                        className="resize-none"
                      />
                    </Field>
                  </FieldGroup>
                  <div className="flex gap-3 justify-end pt-4 border-t border-border/50">
                    <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                      Cancelar
                    </Button>
                    <Button type="submit" disabled={loading} className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold px-6">
                      {loading ? "Publicando..." : "Publicar"}
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          )}
        </div>

        {/* Feedback */}
        {sucesso && (
          <Alert className="bg-success/10 border-success/30 text-success">
            <CheckCircle className="h-4 w-4" />
            <AlertDescription>{sucesso}</AlertDescription>
          </Alert>
        )}
        {erro && (
          <Alert variant="destructive" className="bg-destructive/10 border-destructive/30">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{erro}</AlertDescription>
          </Alert>
        )}

        {/* Confirm Delete Dialog */}
        <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <DialogContent className="max-w-sm bg-background border border-border">
            <DialogHeader>
              <DialogTitle className="text-foreground">Excluir Aviso</DialogTitle>
              <DialogDescription className="text-muted-foreground text-sm mt-1">
                Tem certeza que deseja excluir o aviso <strong>"{announcementToDelete?.title}"</strong>? Esta ação não pode ser desfeita.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter className="mt-4 gap-2">
              <Button
                variant="outline"
                onClick={() => { setDeleteDialogOpen(false); setAnnouncementToDelete(null) }}
                disabled={deleting}
              >
                Cancelar
              </Button>
              <Button
                variant="destructive"
                onClick={confirmDelete}
                disabled={deleting}
                className="bg-destructive hover:bg-destructive/90"
              >
                {deleting ? "Excluindo..." : "Excluir"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Notice Board */}
        <div className="max-w-4xl space-y-4">
          {announcements.length === 0 ? (
            <Card className="border-border/50 bg-card/30">
              <CardContent className="py-12 text-center text-muted-foreground">
                <Megaphone className="h-12 w-12 mx-auto mb-4 opacity-30 text-primary" />
                <p className="font-semibold text-lg">Mural de avisos vazio</p>
                <p className="text-sm mt-1">
                  {isDirector
                    ? 'Clique em "Publicar Aviso" para enviar o primeiro comunicado.'
                    : "Não há comunicados internos publicados no momento."}
                </p>
              </CardContent>
            </Card>
          ) : (
            announcements.map(announcement => (
              <Card
                key={announcement.id}
                className="border-border/50 hover:shadow-md transition-all duration-300 bg-card/30 hover:border-primary/30"
              >
                <CardHeader className="pb-3 border-b border-border/30">
                  <div className="flex items-start gap-4">
                    <div className="h-10 w-10 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-sm border border-primary/20 shrink-0 select-none">
                      {announcement.author?.name ? getInitials(announcement.author.name) : "AI"}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
                        <h3 className="font-bold text-foreground text-base sm:text-lg truncate">
                          {announcement.title}
                        </h3>
                        <div className="flex items-center gap-2 shrink-0">
                          <span className="flex items-center text-[10px] sm:text-xs text-muted-foreground font-medium bg-muted/60 px-2 py-0.5 rounded-full border border-border/50">
                            <Calendar className="h-3 w-3 mr-1" />
                            {formatDate(announcement.createdAt)}
                          </span>
                          {isDirector && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                              onClick={() => requestDelete(announcement)}
                              title="Excluir aviso"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <p className="text-xs font-semibold text-foreground truncate">
                          {announcement.author?.name || "Administrador"}
                        </p>
                        <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 bg-primary/15 text-primary rounded border border-primary/20">
                          {announcement.author?.role === "ADMIN" || announcement.author?.role === "DIRECTOR" ? "Diretoria" : "Professor"}
                        </span>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-4">
                  <p className="text-sm sm:text-base text-muted-foreground whitespace-pre-wrap leading-relaxed">
                    {announcement.body}
                  </p>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </RequirePermission>
  )
}
