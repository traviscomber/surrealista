'use client'

import { useState, useEffect } from 'react'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Phone,
  Mail,
  MessageCircle,
  Calendar,
  Plus,
  Edit,
  Trash2,
  CheckCircle,
  Clock,
  AlertCircle,
  User,
  FileText,
  MessageSquare,
  Activity,
  TrendingUp,
} from 'lucide-react'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'

interface Client360ViewProps {
  clientId: string
  client: any
}

export function Client360View({ clientId, client }: Client360ViewProps) {
  const [interactions, setInteractions] = useState([])
  const [tasks, setTasks] = useState([])
  const [notes, setNotes] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('overview')

  // Estados para nuevas interacciones
  const [newInteractionOpen, setNewInteractionOpen] = useState(false)
  const [newInteractionData, setNewInteractionData] = useState({
    interaction_type: 'call',
    subject: '',
    description: '',
    outcome: 'pending',
  })

  // Estados para nuevas tareas
  const [newTaskOpen, setNewTaskOpen] = useState(false)
  const [newTaskData, setNewTaskData] = useState({
    title: '',
    description: '',
    task_type: 'followup',
    priority: 'medium',
    due_date: '',
  })

  // Estados para nuevas notas
  const [newNoteOpen, setNewNoteOpen] = useState(false)
  const [newNoteData, setNewNoteData] = useState({
    title: '',
    content: '',
    note_type: 'personal',
  })

  useEffect(() => {
    loadClientData()
  }, [clientId])

  const loadClientData = async () => {
    try {
      const [interactionsRes, tasksRes, notesRes] = await Promise.all([
        fetch(`/api/crm/interactions?client_id=${clientId}`),
        fetch(`/api/crm/tasks?client_id=${clientId}`),
        fetch(`/api/crm/notes?client_id=${clientId}`),
      ])

      const interactionsData = await interactionsRes.json()
      const tasksData = await tasksRes.json()
      const notesData = await notesRes.json()

      setInteractions(interactionsData.data || [])
      setTasks(tasksData.data || [])
      setNotes(notesData.data || [])
    } catch (error) {
      console.error('Error loading client data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleAddInteraction = async () => {
    try {
      const res = await fetch('/api/crm/interactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...newInteractionData,
          client_id: clientId,
          created_by: 'current-user',
        }),
      })

      if (res.ok) {
        setNewInteractionOpen(false)
        loadClientData()
        setNewInteractionData({
          interaction_type: 'call',
          subject: '',
          description: '',
          outcome: 'pending',
        })
      }
    } catch (error) {
      console.error('Error adding interaction:', error)
    }
  }

  const handleAddTask = async () => {
    try {
      const res = await fetch('/api/crm/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...newTaskData,
          client_id: clientId,
          status: 'pending',
          assigned_to: 'current-user',
        }),
      })

      if (res.ok) {
        setNewTaskOpen(false)
        loadClientData()
        setNewTaskData({
          title: '',
          description: '',
          task_type: 'followup',
          priority: 'medium',
          due_date: '',
        })
      }
    } catch (error) {
      console.error('Error adding task:', error)
    }
  }

  const handleAddNote = async () => {
    try {
      const res = await fetch('/api/crm/notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...newNoteData,
          client_id: clientId,
          created_by: 'current-user',
        }),
      })

      if (res.ok) {
        setNewNoteOpen(false)
        loadClientData()
        setNewNoteData({
          title: '',
          content: '',
          note_type: 'personal',
        })
      }
    } catch (error) {
      console.error('Error adding note:', error)
    }
  }

  const getInteractionIcon = (type: string) => {
    switch (type) {
      case 'call':
        return <Phone className="h-4 w-4" />
      case 'email':
        return <Mail className="h-4 w-4" />
      case 'whatsapp':
        return <MessageCircle className="h-4 w-4" />
      case 'meeting':
        return <Calendar className="h-4 w-4" />
      default:
        return <MessageSquare className="h-4 w-4" />
    }
  }

  const getOutcomeColor = (outcome: string) => {
    switch (outcome) {
      case 'positive':
        return 'bg-green-100 text-green-800'
      case 'negative':
        return 'bg-red-100 text-red-800'
      case 'neutral':
        return 'bg-gray-100 text-gray-800'
      default:
        return 'bg-yellow-100 text-yellow-800'
    }
  }

  const getTaskPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return 'bg-red-100 text-red-800'
      case 'high':
        return 'bg-orange-100 text-orange-800'
      case 'medium':
        return 'bg-blue-100 text-blue-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const stats = {
    totalInteractions: interactions.length,
    lastInteraction: interactions[0]?.created_at || null,
    activeTasks: tasks.filter((t) => t.status === 'pending').length,
    overdueTasks: tasks.filter((t) => t.status === 'pending' && new Date(t.due_date) < new Date()).length,
  }

  if (loading) {
    return <div className="flex items-center justify-center p-8">Cargando información del cliente...</div>
  }

  return (
    <div className="space-y-6">
      {/* Header con Info del Cliente */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-100 to-blue-200 rounded-full flex items-center justify-center">
                <User className="h-8 w-8 text-blue-600" />
              </div>
              <div>
                <h2 className="text-2xl font-bold">{client?.name || 'Cliente'}</h2>
                <p className="text-gray-600">{client?.email || 'Sin email'}</p>
                <div className="flex gap-2 mt-2">
                  {client?.phone && (
                    <Badge variant="outline" className="flex gap-1">
                      <Phone className="h-3 w-3" />
                      {client.phone}
                    </Badge>
                  )}
                  {client?.status && (
                    <Badge variant="secondary">{client.status}</Badge>
                  )}
                </div>
              </div>
            </div>

            {/* Stats Rápidos */}
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-3 bg-blue-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">{stats.totalInteractions}</div>
                <div className="text-xs text-gray-600">Interacciones</div>
              </div>
              <div className="text-center p-3 bg-orange-50 rounded-lg">
                <div className="text-2xl font-bold text-orange-600">{stats.activeTasks}</div>
                <div className="text-xs text-gray-600">Tareas Activas</div>
              </div>
              <div className="text-center p-3 bg-red-50 rounded-lg">
                <div className="text-2xl font-bold text-red-600">{stats.overdueTasks}</div>
                <div className="text-xs text-gray-600">Atrasadas</div>
              </div>
              {stats.lastInteraction && (
                <div className="text-center p-3 bg-green-50 rounded-lg">
                  <div className="text-xs font-bold text-green-600">
                    {format(new Date(stats.lastInteraction), 'd MMM', { locale: es })}
                  </div>
                  <div className="text-xs text-gray-600">Última Interacción</div>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs con Secciones */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Resumen</TabsTrigger>
          <TabsTrigger value="interactions">Interacciones</TabsTrigger>
          <TabsTrigger value="tasks">Tareas</TabsTrigger>
          <TabsTrigger value="notes">Notas</TabsTrigger>
        </TabsList>

        {/* Overview */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Últimas Interacciones</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {interactions.slice(0, 5).map((interaction) => (
                  <div key={interaction.id} className="flex gap-3 pb-3 border-b last:border-0">
                    <div className="mt-1">{getInteractionIcon(interaction.interaction_type)}</div>
                    <div className="flex-1">
                      <p className="font-medium text-sm">{interaction.subject}</p>
                      <p className="text-xs text-gray-600">{interaction.description?.substring(0, 60)}</p>
                      <div className="flex gap-2 mt-2">
                        <Badge className={`text-xs ${getOutcomeColor(interaction.outcome)}`}>
                          {interaction.outcome}
                        </Badge>
                        <span className="text-xs text-gray-500">
                          {format(new Date(interaction.created_at), 'd MMM HH:mm', { locale: es })}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
                {interactions.length === 0 && (
                  <p className="text-sm text-gray-500 text-center py-4">No hay interacciones registradas</p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Próximas Tareas</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {tasks
                  .filter((t) => t.status === 'pending')
                  .slice(0, 5)
                  .map((task) => (
                    <div key={task.id} className="flex gap-3 pb-3 border-b last:border-0">
                      <Clock className="h-4 w-4 mt-1 text-gray-400" />
                      <div className="flex-1">
                        <p className="font-medium text-sm">{task.title}</p>
                        <p className="text-xs text-gray-600">Vence: {format(new Date(task.due_date), 'd MMM', { locale: es })}</p>
                        <Badge className={`text-xs mt-2 ${getTaskPriorityColor(task.priority)}`}>
                          {task.priority}
                        </Badge>
                      </div>
                    </div>
                  ))}
                {tasks.filter((t) => t.status === 'pending').length === 0 && (
                  <p className="text-sm text-gray-500 text-center py-4">No hay tareas pendientes</p>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Interacciones */}
        <TabsContent value="interactions" className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Historial de Interacciones</h3>
            <Dialog open={newInteractionOpen} onOpenChange={setNewInteractionOpen}>
              <DialogTrigger asChild>
                <Button size="sm" className="gap-2">
                  <Plus className="h-4 w-4" />
                  Agregar Interacción
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Nueva Interacción</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label>Tipo</Label>
                    <Select
                      value={newInteractionData.interaction_type}
                      onValueChange={(value) =>
                        setNewInteractionData({ ...newInteractionData, interaction_type: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="call">Llamada</SelectItem>
                        <SelectItem value="email">Email</SelectItem>
                        <SelectItem value="whatsapp">WhatsApp</SelectItem>
                        <SelectItem value="meeting">Reunión</SelectItem>
                        <SelectItem value="visit">Visita</SelectItem>
                        <SelectItem value="note">Nota</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Asunto</Label>
                    <Input
                      value={newInteractionData.subject}
                      onChange={(e) =>
                        setNewInteractionData({ ...newInteractionData, subject: e.target.value })
                      }
                      placeholder="Breve descripción"
                    />
                  </div>
                  <div>
                    <Label>Descripción</Label>
                    <Textarea
                      value={newInteractionData.description}
                      onChange={(e) =>
                        setNewInteractionData({ ...newInteractionData, description: e.target.value })
                      }
                      placeholder="Detalles de la interacción"
                      className="min-h-20"
                    />
                  </div>
                  <div>
                    <Label>Resultado</Label>
                    <Select
                      value={newInteractionData.outcome}
                      onValueChange={(value) =>
                        setNewInteractionData({ ...newInteractionData, outcome: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="positive">Positivo</SelectItem>
                        <SelectItem value="neutral">Neutral</SelectItem>
                        <SelectItem value="negative">Negativo</SelectItem>
                        <SelectItem value="pending">Pendiente</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <Button onClick={handleAddInteraction} className="w-full">
                    Guardar Interacción
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          <div className="space-y-3">
            {interactions.map((interaction) => (
              <Card key={interaction.id}>
                <CardContent className="pt-6">
                  <div className="flex gap-4">
                    <div className="mt-1">{getInteractionIcon(interaction.interaction_type)}</div>
                    <div className="flex-1">
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-semibold">{interaction.subject}</h4>
                          <p className="text-sm text-gray-600 mt-1">{interaction.description}</p>
                        </div>
                        <div className="flex gap-2">
                          <Badge className={getOutcomeColor(interaction.outcome)}>
                            {interaction.outcome}
                          </Badge>
                        </div>
                      </div>
                      <div className="mt-3 text-xs text-gray-500">
                        {format(new Date(interaction.created_at), 'd MMM yyyy HH:mm', { locale: es })}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
            {interactions.length === 0 && (
              <p className="text-center text-gray-500 py-8">No hay interacciones registradas</p>
            )}
          </div>
        </TabsContent>

        {/* Tareas */}
        <TabsContent value="tasks" className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Tareas y Recordatorios</h3>
            <Dialog open={newTaskOpen} onOpenChange={setNewTaskOpen}>
              <DialogTrigger asChild>
                <Button size="sm" className="gap-2">
                  <Plus className="h-4 w-4" />
                  Agregar Tarea
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Nueva Tarea</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label>Título</Label>
                    <Input
                      value={newTaskData.title}
                      onChange={(e) =>
                        setNewTaskData({ ...newTaskData, title: e.target.value })
                      }
                      placeholder="Título de la tarea"
                    />
                  </div>
                  <div>
                    <Label>Descripción</Label>
                    <Textarea
                      value={newTaskData.description}
                      onChange={(e) =>
                        setNewTaskData({ ...newTaskData, description: e.target.value })
                      }
                      placeholder="Detalles de la tarea"
                      className="min-h-20"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Tipo</Label>
                      <Select
                        value={newTaskData.task_type}
                        onValueChange={(value) =>
                          setNewTaskData({ ...newTaskData, task_type: value })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="followup">Seguimiento</SelectItem>
                          <SelectItem value="call">Llamada</SelectItem>
                          <SelectItem value="email">Email</SelectItem>
                          <SelectItem value="proposal">Propuesta</SelectItem>
                          <SelectItem value="meeting">Reunión</SelectItem>
                          <SelectItem value="visit">Visita</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Prioridad</Label>
                      <Select
                        value={newTaskData.priority}
                        onValueChange={(value) =>
                          setNewTaskData({ ...newTaskData, priority: value })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="low">Baja</SelectItem>
                          <SelectItem value="medium">Media</SelectItem>
                          <SelectItem value="high">Alta</SelectItem>
                          <SelectItem value="urgent">Urgente</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div>
                    <Label>Fecha de Vencimiento</Label>
                    <Input
                      type="date"
                      value={newTaskData.due_date}
                      onChange={(e) =>
                        setNewTaskData({ ...newTaskData, due_date: e.target.value })
                      }
                    />
                  </div>
                  <Button onClick={handleAddTask} className="w-full">
                    Crear Tarea
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          <div className="space-y-3">
            {tasks.map((task) => (
              <Card key={task.id}>
                <CardContent className="pt-6">
                  <div className="flex gap-4">
                    <div className="mt-1">
                      {task.status === 'completed' ? (
                        <CheckCircle className="h-5 w-5 text-green-600" />
                      ) : (
                        <Clock className="h-5 w-5 text-gray-400" />
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className={`font-semibold ${task.status === 'completed' ? 'line-through' : ''}`}>
                            {task.title}
                          </h4>
                          <p className="text-sm text-gray-600 mt-1">{task.description}</p>
                        </div>
                        <div className="flex gap-2">
                          <Badge className={getTaskPriorityColor(task.priority)}>
                            {task.priority}
                          </Badge>
                        </div>
                      </div>
                      <div className="mt-3 text-xs text-gray-500">
                        Vence: {format(new Date(task.due_date), 'd MMM yyyy', { locale: es })}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
            {tasks.length === 0 && (
              <p className="text-center text-gray-500 py-8">No hay tareas registradas</p>
            )}
          </div>
        </TabsContent>

        {/* Notas */}
        <TabsContent value="notes" className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Notas y Comentarios</h3>
            <Dialog open={newNoteOpen} onOpenChange={setNewNoteOpen}>
              <DialogTrigger asChild>
                <Button size="sm" className="gap-2">
                  <Plus className="h-4 w-4" />
                  Agregar Nota
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Nueva Nota</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label>Título</Label>
                    <Input
                      value={newNoteData.title}
                      onChange={(e) =>
                        setNewNoteData({ ...newNoteData, title: e.target.value })
                      }
                      placeholder="Título de la nota"
                    />
                  </div>
                  <div>
                    <Label>Contenido</Label>
                    <Textarea
                      value={newNoteData.content}
                      onChange={(e) =>
                        setNewNoteData({ ...newNoteData, content: e.target.value })
                      }
                      placeholder="Contenido de la nota"
                      className="min-h-32"
                    />
                  </div>
                  <div>
                    <Label>Tipo</Label>
                    <Select
                      value={newNoteData.note_type}
                      onValueChange={(value) =>
                        setNewNoteData({ ...newNoteData, note_type: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="personal">Personal</SelectItem>
                        <SelectItem value="internal">Interna</SelectItem>
                        <SelectItem value="important">Importante</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <Button onClick={handleAddNote} className="w-full">
                    Guardar Nota
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          <div className="space-y-3">
            {notes.map((note) => (
              <Card key={note.id}>
                <CardContent className="pt-6">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h4 className="font-semibold">{note.title}</h4>
                      <Badge variant="outline" className="mt-2">
                        {note.note_type}
                      </Badge>
                    </div>
                  </div>
                  <p className="text-sm text-gray-700 mt-3 whitespace-pre-wrap">{note.content}</p>
                  <div className="mt-3 text-xs text-gray-500">
                    {format(new Date(note.created_at), 'd MMM yyyy HH:mm', { locale: es })}
                  </div>
                </CardContent>
              </Card>
            ))}
            {notes.length === 0 && (
              <p className="text-center text-gray-500 py-8">No hay notas registradas</p>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
