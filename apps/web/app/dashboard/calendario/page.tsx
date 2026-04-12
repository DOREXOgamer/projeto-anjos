"use client"

import { useState } from "react"
import { RequirePermission } from "@/components/auth/require-permission"
import { PERMISSIONS } from "@/lib/permissions"
import { 
  Calendar as CalendarIcon, 
  Plus, 
  ChevronLeft, 
  ChevronRight,
  Clock,
  MapPin,
  Edit2,
  Trash2,
  MoreVertical
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog"
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
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import type { Evento } from "@/lib/types"

const eventosMock: Evento[] = [
  { id: '1', titulo: 'Aula de Música', descricao: 'Teoria musical básica', data: '2026-03-23', horario: '08:00', tipo: 'aula', turmaId: '1' },
  { id: '2', titulo: 'Aula de Artes', descricao: 'Pintura em aquarela', data: '2026-03-23', horario: '14:00', tipo: 'aula', turmaId: '2' },
  { id: '3', titulo: 'Reunião de Pais', descricao: 'Reunião semestral com pais e responsáveis', data: '2026-03-25', horario: '19:00', tipo: 'reuniao' },
  { id: '4', titulo: 'Apresentação de Dança', descricao: 'Apresentação final do semestre', data: '2026-03-28', horario: '15:00', tipo: 'evento' },
  { id: '5', titulo: 'Feriado - Páscoa', descricao: 'Sexta-feira Santa', data: '2026-03-29', horario: '', tipo: 'feriado' },
  { id: '6', titulo: 'Aula de Teatro', descricao: 'Improvisação teatral', data: '2026-03-24', horario: '15:00', tipo: 'aula', turmaId: '4' },
]

const diasSemana = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']
const meses = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro']

const tipoEventoConfig = {
  aula: { label: 'Aula', color: 'bg-blue-500', textColor: 'text-blue-500' },
  evento: { label: 'Evento', color: 'bg-primary', textColor: 'text-primary' },
  feriado: { label: 'Feriado', color: 'bg-red-500', textColor: 'text-red-500' },
  reuniao: { label: 'Reunião', color: 'bg-purple-500', textColor: 'text-purple-500' },
}

export default function CalendarioPage() {
  const [eventos, setEventos] = useState<Evento[]>(eventosMock)
  const [currentDate, setCurrentDate] = useState(new Date(2026, 2, 1)) // Março 2026
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [editingEvento, setEditingEvento] = useState<Evento | null>(null)
  const [formData, setFormData] = useState({
    titulo: '',
    descricao: '',
    data: '',
    horario: '',
    tipo: 'aula' as Evento['tipo']
  })

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear()
    const month = date.getMonth()
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const daysInMonth = lastDay.getDate()
    const startingDay = firstDay.getDay()
    
    const days: (number | null)[] = []
    
    // Dias vazios antes do primeiro dia
    for (let i = 0; i < startingDay; i++) {
      days.push(null)
    }
    
    // Dias do mês
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(i)
    }
    
    return days
  }

  const formatDateString = (year: number, month: number, day: number) => {
    return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
  }

  const getEventosForDate = (day: number) => {
    const dateStr = formatDateString(currentDate.getFullYear(), currentDate.getMonth(), day)
    return eventos.filter(e => e.data === dateStr)
  }

  const prevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1))
  }

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1))
  }

  const handleDayClick = (day: number) => {
    const dateStr = formatDateString(currentDate.getFullYear(), currentDate.getMonth(), day)
    setSelectedDate(dateStr)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (editingEvento) {
      setEventos(eventos.map(ev => 
        ev.id === editingEvento.id ? { ...ev, ...formData } : ev
      ))
    } else {
      const newEvento: Evento = {
        id: String(Date.now()),
        ...formData
      }
      setEventos([...eventos, newEvento])
    }
    resetForm()
    setModalOpen(false)
  }

  const resetForm = () => {
    setFormData({
      titulo: '',
      descricao: '',
      data: selectedDate || '',
      horario: '',
      tipo: 'aula'
    })
    setEditingEvento(null)
  }

  const handleEdit = (evento: Evento) => {
    setEditingEvento(evento)
    setFormData({
      titulo: evento.titulo,
      descricao: evento.descricao,
      data: evento.data,
      horario: evento.horario,
      tipo: evento.tipo
    })
    setModalOpen(true)
  }

  const handleDelete = (id: string) => {
    setEventos(eventos.filter(e => e.id !== id))
  }

  const handleAddEvento = () => {
    resetForm()
    setFormData(prev => ({ ...prev, data: selectedDate || new Date().toISOString().split('T')[0] }))
    setModalOpen(true)
  }

  const eventosDoMes = eventos.filter(e => {
    const eventDate = new Date(e.data)
    return eventDate.getMonth() === currentDate.getMonth() && eventDate.getFullYear() === currentDate.getFullYear()
  })

  const eventosHoje = eventos.filter(e => e.data === new Date().toISOString().split('T')[0])
  const eventosSelecionados = selectedDate ? eventos.filter(e => e.data === selectedDate) : []

  const days = getDaysInMonth(currentDate)
  const today = new Date()
  const isToday = (day: number) => {
    return day === today.getDate() && 
           currentDate.getMonth() === today.getMonth() && 
           currentDate.getFullYear() === today.getFullYear()
  }

  return (
    <RequirePermission permission={PERMISSIONS.CALENDARIO}>
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Calendário</h1>
          <p className="text-muted-foreground">Visualize e gerencie eventos e aulas</p>
        </div>
        
        <Dialog open={modalOpen} onOpenChange={(open) => {
          setModalOpen(open)
          if (!open) resetForm()
        }}>
          <DialogTrigger asChild>
            <Button className="bg-primary hover:bg-primary/90" onClick={handleAddEvento}>
              <Plus className="h-4 w-4 mr-2" />
              Novo Evento
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingEvento ? 'Editar Evento' : 'Novo Evento'}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="titulo">Título</Label>
                <Input
                  id="titulo"
                  value={formData.titulo}
                  onChange={(e) => setFormData({...formData, titulo: e.target.value})}
                  placeholder="Nome do evento"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="data">Data</Label>
                  <Input
                    id="data"
                    type="date"
                    value={formData.data}
                    onChange={(e) => setFormData({...formData, data: e.target.value})}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="horario">Horário</Label>
                  <Input
                    id="horario"
                    type="time"
                    value={formData.horario}
                    onChange={(e) => setFormData({...formData, horario: e.target.value})}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="tipo">Tipo</Label>
                <Select
                  value={formData.tipo}
                  onValueChange={(value: Evento['tipo']) => setFormData({...formData, tipo: value})}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="aula">Aula</SelectItem>
                    <SelectItem value="evento">Evento</SelectItem>
                    <SelectItem value="reuniao">Reunião</SelectItem>
                    <SelectItem value="feriado">Feriado</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="descricao">Descrição</Label>
                <Textarea
                  id="descricao"
                  value={formData.descricao}
                  onChange={(e) => setFormData({...formData, descricao: e.target.value})}
                  placeholder="Detalhes do evento"
                  rows={3}
                />
              </div>

              <DialogFooter>
                <DialogClose asChild>
                  <Button type="button" variant="outline">Cancelar</Button>
                </DialogClose>
                <Button type="submit" className="bg-primary hover:bg-primary/90">
                  {editingEvento ? 'Salvar' : 'Criar'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Calendário */}
        <Card className="lg:col-span-2">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">
                {meses[currentDate.getMonth()]} {currentDate.getFullYear()}
              </CardTitle>
              <div className="flex items-center gap-1">
                <Button variant="ghost" size="icon" onClick={prevMonth}>
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => setCurrentDate(new Date())}
                >
                  Hoje
                </Button>
                <Button variant="ghost" size="icon" onClick={nextMonth}>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {/* Dias da semana */}
            <div className="grid grid-cols-7 gap-1 mb-2">
              {diasSemana.map(dia => (
                <div key={dia} className="text-center text-sm font-medium text-muted-foreground py-2">
                  {dia}
                </div>
              ))}
            </div>
            
            {/* Dias do mês */}
            <div className="grid grid-cols-7 gap-1">
              {days.map((day, index) => {
                if (day === null) {
                  return <div key={`empty-${index}`} className="h-20 sm:h-24" />
                }
                
                const dayEvents = getEventosForDate(day)
                const dateStr = formatDateString(currentDate.getFullYear(), currentDate.getMonth(), day)
                const isSelected = selectedDate === dateStr
                
                return (
                  <button
                    key={day}
                    onClick={() => handleDayClick(day)}
                    className={`h-20 sm:h-24 p-1 sm:p-2 border rounded-lg text-left transition-colors hover:bg-accent ${
                      isToday(day) ? 'bg-primary/10 border-primary' : 'border-border'
                    } ${isSelected ? 'ring-2 ring-primary' : ''}`}
                  >
                    <span className={`text-sm font-medium ${isToday(day) ? 'text-primary' : ''}`}>
                      {day}
                    </span>
                    <div className="mt-1 space-y-0.5 overflow-hidden">
                      {dayEvents.slice(0, 2).map(evento => (
                        <div 
                          key={evento.id}
                          className={`text-xs truncate rounded px-1 py-0.5 text-white ${tipoEventoConfig[evento.tipo].color}`}
                        >
                          {evento.titulo}
                        </div>
                      ))}
                      {dayEvents.length > 2 && (
                        <div className="text-xs text-muted-foreground">
                          +{dayEvents.length - 2} mais
                        </div>
                      )}
                    </div>
                  </button>
                )
              })}
            </div>
          </CardContent>
        </Card>

        {/* Sidebar de eventos */}
        <div className="space-y-4">
          {/* Legenda */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Legenda</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {Object.entries(tipoEventoConfig).map(([key, config]) => (
                <div key={key} className="flex items-center gap-2">
                  <div className={`w-3 h-3 rounded ${config.color}`} />
                  <span className="text-sm">{config.label}</span>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Eventos do dia selecionado ou hoje */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">
                {selectedDate 
                  ? `Eventos em ${new Date(selectedDate + 'T12:00:00').toLocaleDateString('pt-BR')}`
                  : 'Eventos de Hoje'
                }
              </CardTitle>
            </CardHeader>
            <CardContent>
              {(selectedDate ? eventosSelecionados : eventosHoje).length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  Nenhum evento
                </p>
              ) : (
                <div className="space-y-3">
                  {(selectedDate ? eventosSelecionados : eventosHoje).map(evento => (
                    <div key={evento.id} className="flex items-start gap-3 p-3 rounded-lg bg-accent/50">
                      <div className={`w-1 h-full min-h-[40px] rounded ${tipoEventoConfig[evento.tipo].color}`} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <h4 className="font-medium text-sm truncate">{evento.titulo}</h4>
                            {evento.horario && (
                              <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                                <Clock className="h-3 w-3" />
                                {evento.horario}
                              </p>
                            )}
                          </div>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-6 w-6">
                                <MoreVertical className="h-3 w-3" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => handleEdit(evento)}>
                                <Edit2 className="h-3 w-3 mr-2" />
                                Editar
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                onClick={() => handleDelete(evento.id)}
                                className="text-destructive"
                              >
                                <Trash2 className="h-3 w-3 mr-2" />
                                Excluir
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                        {evento.descricao && (
                          <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                            {evento.descricao}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Próximos eventos */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Próximos Eventos</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {eventos
                  .filter(e => new Date(e.data) >= new Date())
                  .sort((a, b) => new Date(a.data).getTime() - new Date(b.data).getTime())
                  .slice(0, 5)
                  .map(evento => (
                    <div key={evento.id} className="flex items-center gap-3 py-2 border-b border-border last:border-0">
                      <div className={`w-2 h-2 rounded-full ${tipoEventoConfig[evento.tipo].color}`} />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{evento.titulo}</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(evento.data + 'T12:00:00').toLocaleDateString('pt-BR')}
                          {evento.horario && ` às ${evento.horario}`}
                        </p>
                      </div>
                    </div>
                  ))
                }
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
    </RequirePermission>
  )
}


