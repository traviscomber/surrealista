'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { AlertCircle, Plus, Phone, Mail, MessageSquare, Calendar, FileText, MessageCircle, Zap, TrendingUp, Download, MapPin } from 'lucide-react'
import { ClientInteraction, ClientTask, ClientNote } from '@/lib/types/crm'
import { QuickOpportunityForm } from '@/components/quick-wins/quick-opportunity-form'
import { DocumentChecklist } from '@/components/quick-wins/document-checklist'
import { OfferManager } from '@/components/quick-wins/offer-manager'
import { PriceTasacionMotor } from '@/components/quick-wins/price-tasacion-motor'
import { VisitScheduler } from '@/components/visits/visit-scheduler'
import { VisitsList } from '@/components/visits/visits-list'
import { VisitEvaluation } from '@/components/visits/visit-evaluation'

interface Client360ViewProps {
  clientId: string
  client?: {
    id: string
    name: string
    email: string
    phone: string
    status: string
    pipeline_status: string
    type: string
  }
}

export function Client360View({ clientId, client }: Client360ViewProps) {
  const [interactions, setInteractions] = useState<ClientInteraction[]>([])
  const [tasks, setTasks] = useState<ClientTask[]>([])
  const [notes, setNotes] = useState<ClientNote[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [exportingPDF, setExportingPDF] = useState(false)

  useEffect(() => {
    loadClientData()
  }, [clientId])

  const loadClientData = async () => {
    try {
      setLoading(true)
      setError(null)

      const [interactionsRes, tasksRes, notesRes] = await Promise.all([
        fetch(`/api/crm/interactions?client_id=${clientId}`).catch(() => null),
        fetch(`/api/crm/tasks?client_id=${clientId}`).catch(() => null),
        fetch(`/api/crm/notes?client_id=${clientId}`).catch(() => null),
      ])

      if (interactionsRes?.ok) {
        const data = await interactionsRes.json()
        setInteractions(data?.data || [])
      }

      if (tasksRes?.ok) {
        const data = await tasksRes.json()
        setTasks(data?.data || [])
      }

      if (notesRes?.ok) {
        const data = await notesRes.json()
        setNotes(data?.data || [])
      }
    } catch (err) {
      console.error('[v0] Error loading client data:', err)
      setError('Error cargando datos del cliente')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="pt-6 text-center text-gray-500">Cargando datos del cliente...</CardContent>
      </Card>
    )
  }

  const exportToPDF = async () => {
    try {
      setExportingPDF(true)
      const response = await fetch('/api/pdf/generate-client-report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clientId, clientData: client }),
      })

      if (!response.ok) throw new Error('Error generating PDF')

      const blob = await response.blob()
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `cliente_${client?.name || 'reporte'}_${Date.now()}.html`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Error exporting PDF:', error)
      alert('Error al exportar PDF')
    } finally {
      setExportingPDF(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header Info */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="text-2xl">{client?.name || 'Cliente'}</CardTitle>
              <CardDescription>{client?.email || 'Sin email'}</CardDescription>
            </div>
            <div className="flex gap-2">
              <Badge variant="outline">{client?.type || 'N/A'}</Badge>
              <Badge>{client?.pipeline_status || 'N/A'}</Badge>
              <Button
                size="sm"
                variant="outline"
                onClick={exportToPDF}
                disabled={exportingPDF}
              >
                <Download className="w-4 h-4 mr-2" />
                {exportingPDF ? 'Exportando...' : 'Exportar PDF'}
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <p className="text-xs text-gray-500">Teléfono</p>
              <p className="font-medium">{client?.phone || '-'}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Email</p>
              <p className="font-medium text-sm">{client?.email || '-'}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Estado</p>
              <p className="font-medium">{client?.status || '-'}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Tipo</p>
              <p className="font-medium">{client?.type || '-'}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Error Alert */}
      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6 flex gap-3">
            <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm text-red-800">{error}</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tabs - Responsive layout */}
      <Tabs defaultValue="interactions" className="w-full">
        <TabsList className="grid w-full grid-cols-3 sm:grid-cols-4 md:grid-cols-8 overflow-x-auto">
          <TabsTrigger value="interactions" className="text-xs sm:text-sm">
            <MessageSquare className="w-3 h-3 sm:w-4 sm:h-4 mr-0 sm:mr-2" />
            <span className="hidden sm:inline">Interacciones</span>
            <span className="sm:hidden">Int.</span>
          </TabsTrigger>
          <TabsTrigger value="tasks" className="text-xs sm:text-sm">
            <Calendar className="w-3 h-3 sm:w-4 sm:h-4 mr-0 sm:mr-2" />
            <span className="hidden sm:inline">Tareas</span>
            <span className="sm:hidden">Tar.</span>
          </TabsTrigger>
          <TabsTrigger value="notes" className="text-xs sm:text-sm">
            <FileText className="w-3 h-3 sm:w-4 sm:h-4 mr-0 sm:mr-2" />
            <span className="hidden sm:inline">Notas</span>
            <span className="sm:hidden">Not.</span>
          </TabsTrigger>
          <TabsTrigger value="oportunidades" className="text-xs sm:text-sm">
            <Zap className="w-3 h-3 sm:w-4 sm:h-4 mr-0 sm:mr-2" />
            <span className="hidden sm:inline">Oportunidad</span>
            <span className="sm:hidden">Opor.</span>
          </TabsTrigger>
          <TabsTrigger value="documentos" className="text-xs sm:text-sm hidden sm:flex">
            <FileText className="w-3 h-3 sm:w-4 sm:h-4 mr-0 sm:mr-2" />
            <span className="hidden md:inline">Documentos</span>
            <span className="md:hidden">Docs</span>
          </TabsTrigger>
          <TabsTrigger value="ofertas" className="text-xs sm:text-sm hidden md:flex">
            <MessageSquare className="w-3 h-3 sm:w-4 sm:h-4 mr-0 sm:mr-2" />
            <span>Ofertas</span>
          </TabsTrigger>
          <TabsTrigger value="tasacion" className="text-xs sm:text-sm hidden md:flex">
            <TrendingUp className="w-3 h-3 sm:w-4 sm:h-4 mr-0 sm:mr-2" />
            <span>Tasación</span>
          </TabsTrigger>
          <TabsTrigger value="visitas" className="text-xs sm:text-sm hidden lg:flex">
            <MapPin className="w-3 h-3 sm:w-4 sm:h-4 mr-0 sm:mr-2" />
            <span>Visitas</span>
          </TabsTrigger>
        </TabsList>

        {/* Interactions Tab */}
        <TabsContent value="interactions" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
              <div>
                <CardTitle className="text-base">Historial de Interacciones</CardTitle>
                <CardDescription>Todas las comunicaciones con este cliente</CardDescription>
              </div>
              <Dialog>
                <DialogTrigger asChild>
                  <Button size="sm">
                    <Plus className="w-4 h-4 mr-2" />
                    Agregar
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Nueva Interacción</DialogTitle>
                    <DialogDescription>Registra una nueva comunicación con el cliente</DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <Input placeholder="Título de la interacción" />
                    <Textarea placeholder="Detalles de la interacción" rows={4} />
                    <Button className="w-full">Guardar Interacción</Button>
                  </div>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent>
              {interactions.length === 0 ? (
                <p className="text-center text-gray-500 py-8">Sin interacciones registradas</p>
              ) : (
                <div className="space-y-4">
                  {interactions.map((interaction) => (
                    <div key={interaction.id} className="border rounded-lg p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex gap-3">
                          {interaction.type === 'call' && <Phone className="w-4 h-4 text-blue-600 mt-1" />}
                          {interaction.type === 'email' && <Mail className="w-4 h-4 text-green-600 mt-1" />}
                          {interaction.type === 'whatsapp' && <MessageCircle className="w-4 h-4 text-green-500 mt-1" />}
                          <div>
                            <p className="font-medium">{interaction.title}</p>
                            <p className="text-sm text-gray-600">{interaction.description}</p>
                          </div>
                        </div>
                        <span className="text-xs text-gray-500">{interaction.date}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tasks Tab */}
        <TabsContent value="tasks" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
              <div>
                <CardTitle className="text-base">Tareas y Recordatorios</CardTitle>
                <CardDescription>Seguimiento de acciones pendientes</CardDescription>
              </div>
              <Dialog>
                <DialogTrigger asChild>
                  <Button size="sm">
                    <Plus className="w-4 h-4 mr-2" />
                    Nueva Tarea
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Nueva Tarea</DialogTitle>
                    <DialogDescription>Crea un recordatorio o tarea para este cliente</DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <Input placeholder="Título de la tarea" />
                    <Textarea placeholder="Descripción" rows={3} />
                    <Input type="date" />
                    <Button className="w-full">Crear Tarea</Button>
                  </div>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent>
              {tasks.length === 0 ? (
                <p className="text-center text-gray-500 py-8">Sin tareas registradas</p>
              ) : (
                <div className="space-y-4">
                  {tasks.map((task) => (
                    <div key={task.id} className="border rounded-lg p-4 flex items-center justify-between">
                      <div>
                        <p className="font-medium">{task.title}</p>
                        <p className="text-sm text-gray-600">{task.description}</p>
                      </div>
                      <div className="flex gap-2">
                        <Badge
                          variant={task.priority === 'high' ? 'destructive' : task.priority === 'medium' ? 'default' : 'secondary'}
                        >
                          {task.priority}
                        </Badge>
                        <Badge variant="outline">{task.status}</Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Notes Tab */}
        <TabsContent value="notes" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
              <div>
                <CardTitle className="text-base">Notas Internas</CardTitle>
                <CardDescription>Comentarios y observaciones del equipo</CardDescription>
              </div>
              <Dialog>
                <DialogTrigger asChild>
                  <Button size="sm">
                    <Plus className="w-4 h-4 mr-2" />
                    Agregar Nota
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Nueva Nota</DialogTitle>
                    <DialogDescription>Agrega una nota interna sobre este cliente</DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <Textarea placeholder="Escribe tu nota aquí..." rows={5} />
                    <Button className="w-full">Guardar Nota</Button>
                  </div>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent>
              {notes.length === 0 ? (
                <p className="text-center text-gray-500 py-8">Sin notas registradas</p>
              ) : (
                <div className="space-y-4">
                  {notes.map((note) => (
                    <div key={note.id} className="border rounded-lg p-4">
                      <p className="text-sm">{note.content}</p>
                      <p className="text-xs text-gray-500 mt-2">
                        por {note.created_by} • {note.created_at}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Quick Wins - Oportunidad Tab */}
        <TabsContent value="oportunidades" className="space-y-4">
          <QuickOpportunityForm />
        </TabsContent>

        {/* Quick Wins - Documentos Tab */}
        <TabsContent value="documentos" className="space-y-4">
          <DocumentChecklist clientId={clientId} />
        </TabsContent>

        {/* Quick Wins - Ofertas Tab */}
        <TabsContent value="ofertas" className="space-y-4">
          <OfferManager clientId={clientId} />
        </TabsContent>

        {/* Quick Wins - Tasación Tab */}
        <TabsContent value="tasacion" className="space-y-4">
          <PriceTasacionMotor clientId={clientId} />
        </TabsContent>

        {/* Visitas a Terreno Tab */}
        <TabsContent value="visitas" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Left: Scheduler and List */}
            <div className="lg:col-span-2 space-y-4">
              <VisitScheduler clientId={clientId} clientName={client?.name} />
              <VisitsList clientId={clientId} />
            </div>

            {/* Right: Evaluation */}
            <div>
              <VisitEvaluation visitId={clientId} clientName={client?.name} />
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
