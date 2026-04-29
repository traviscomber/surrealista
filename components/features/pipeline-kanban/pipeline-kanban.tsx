'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Plus, DollarSign, Calendar, AlertTriangle, MessageSquare } from 'lucide-react'
import { cn } from '@/lib/utils'
import { formatDistanceToNow } from 'date-fns'
import { es } from 'date-fns/locale'
import { QuickContactPanel } from '@/components/quick-wins/quick-contact-panel'

interface PipelineStage {
  id: string
  name: string
  color: string
  description: string
}

interface PipelineClient {
  id: string
  first_name?: string
  last_name?: string
  company_name?: string
  stage_id: string
  budget_min?: number
  budget_max?: number
  last_contact_date?: string
  created_at?: string
  client_type?: string
  email?: string
  phone?: string
  mobile?: string
}

const PIPELINE_STAGES: PipelineStage[] = [
  {
    id: 'lead',
    name: 'Lead',
    color: 'bg-blue-100 border-blue-300',
    description: 'Nuevos contactos',
  },
  {
    id: 'contacted',
    name: 'Contactado',
    color: 'bg-purple-100 border-purple-300',
    description: 'Primer contacto realizado',
  },
  {
    id: 'qualified',
    name: 'Calificado',
    color: 'bg-yellow-100 border-yellow-300',
    description: 'Necesidad confirmada',
  },
  {
    id: 'proposal',
    name: 'Propuesta',
    color: 'bg-orange-100 border-orange-300',
    description: 'Oferta enviada',
  },
  {
    id: 'closed',
    name: 'Cerrado',
    color: 'bg-green-100 border-green-300',
    description: 'Transacción completada',
  },
]

export function PipelineKanban() {
  const [clients, setClients] = useState<PipelineClient[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedClientForContact, setSelectedClientForContact] = useState<PipelineClient | null>(null)

  // Helper function to check if lead is abandoned (7+ days without contact)
  const isLeadAbandoned = (client: PipelineClient): boolean => {
    if (!client.last_contact_date) {
      // If no contact date, check if created more than 7 days ago
      if (client.created_at) {
        const createdDate = new Date(client.created_at)
        const daysSinceCreated = Math.floor((new Date().getTime() - createdDate.getTime()) / (1000 * 60 * 60 * 24))
        return daysSinceCreated > 7
      }
      return false
    }

    const lastContact = new Date(client.last_contact_date)
    const daysSinceContact = Math.floor((new Date().getTime() - lastContact.getTime()) / (1000 * 60 * 60 * 24))
    return daysSinceContact > 7
  }

  // Helper function to get relative time in Spanish
  const getRelativeTime = (dateString?: string): string => {
    if (!dateString) return 'Sin contacto'
    try {
      return formatDistanceToNow(new Date(dateString), { addSuffix: true, locale: es })
    } catch {
      return 'Fecha inválida'
    }
  }

  useEffect(() => {
    // TODO: Cargar clientes desde Supabase con stage_id
    setLoading(false)
  }, [])

  const getClientsByStage = (stageId: string) => {
    return clients.filter((client) => client.stage_id === stageId)
  }

  return (
    <div className="w-full h-full bg-gradient-to-br from-slate-50 to-slate-100 p-3 sm:p-6">
      <div className="mb-4 sm:mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">Pipeline de Ventas</h1>
        <p className="text-sm sm:text-base text-slate-600 mt-1 sm:mt-2">Visualiza y gestiona el progreso de tus oportunidades</p>
      </div>

      {/* Kanban Board - Responsive layout */}
      <div className="flex gap-2 sm:gap-4 overflow-x-auto pb-4 -mx-3 sm:mx-0 px-3 sm:px-0">
        {PIPELINE_STAGES.map((stage) => {
          const stageClients = getClientsByStage(stage.id)
          return (
            <div key={stage.id} className="flex-shrink-0 w-80">
              {/* Stage Header */}
              <div className="mb-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="font-semibold text-slate-900">{stage.name}</h2>
                    <p className="text-sm text-slate-500">{stage.description}</p>
                  </div>
                  <Badge variant="outline">{stageClients.length}</Badge>
                </div>
              </div>

              {/* Cards Container */}
              <div className="space-y-3 min-h-96 bg-slate-200 rounded-lg p-3">
                {stageClients.length === 0 ? (
                  <div className="flex items-center justify-center h-full text-slate-500">
                    <span className="text-sm">Sin clientes</span>
                  </div>
                ) : (
                  stageClients.map((client) => (
                    <Card
                      key={client.id}
                      className={cn(
                        'cursor-move hover:shadow-md transition-all border-2 bg-white',
                        stage.color,
                        isLeadAbandoned(client) && 'ring-2 ring-red-400',
                      )}
                    >
                      <CardContent className="p-3">
                        {/* Header with name and type badge */}
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <p className="font-semibold text-sm text-slate-900 flex-1">
                            {client.first_name} {client.last_name}
                          </p>
                          {client.client_type && (
                            <Badge variant="secondary" className="text-xs whitespace-nowrap">
                              {client.client_type === 'buyer' ? '🛒 Comprador' : '🏠 Vendedor'}
                            </Badge>
                          )}
                        </div>

                        {/* Company name */}
                        {client.company_name && (
                          <p className="text-xs text-slate-600 mb-2">{client.company_name}</p>
                        )}

                        {/* Abandoned lead alert */}
                        {isLeadAbandoned(client) && (
                          <div className="flex items-center gap-1 mb-2 px-2 py-1 bg-red-50 rounded border border-red-200">
                            <AlertTriangle className="w-3 h-3 text-red-600" />
                            <span className="text-xs font-semibold text-red-600">Abandonado</span>
                          </div>
                        )}

                        {/* Budget */}
                        {client.budget_min && (
                          <div className="flex items-center gap-1 mt-2 text-xs text-slate-600">
                            <DollarSign className="w-3 h-3" />
                            <span>
                              UF {client.budget_min?.toLocaleString()} - UF {client.budget_max?.toLocaleString()}
                            </span>
                          </div>
                        )}

                        {/* Last contact date - relative time */}
                        {client.last_contact_date && (
                          <div className="flex items-center gap-1 mt-2 text-xs text-slate-600">
                            <Calendar className="w-3 h-3" />
                            <span>{getRelativeTime(client.last_contact_date)}</span>
                          </div>
                        )}

                        {/* Contact Button */}
                        <Button
                          onClick={() => setSelectedClientForContact(client)}
                          size="sm"
                          variant="outline"
                          className="w-full mt-3 h-8"
                        >
                          <MessageSquare className="w-3 h-3 mr-1" />
                          Contactar
                        </Button>
                      </CardContent>
                    </Card>
                  ))
                )}

                <Button
                  variant="outline"
                  size="sm"
                  className="w-full mt-auto"
                  onClick={() => {
                    // TODO: Abrir diálogo para agregar cliente
                  }}
                >
                  <Plus className="w-4 h-4 mr-1" />
                  Agregar
                </Button>
              </div>
            </div>
          )
        })}
      </div>

      {/* Stats Footer - Responsive grid */}
      <div className="mt-6 sm:mt-8 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2 sm:gap-4">
        {PIPELINE_STAGES.map((stage) => {
          const stageBudget = getClientsByStage(stage.id).reduce(
            (sum, client) => sum + (client.budget_max || 0),
            0,
          )
          return (
            <Card key={stage.id}>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-slate-600">{stage.name}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-slate-900">
                  ${stageBudget.toLocaleString()}
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  {getClientsByStage(stage.id).length} cliente{getClientsByStage(stage.id).length !== 1 ? 's' : ''}
                </p>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Quick Contact Panel Modal */}
      {selectedClientForContact && (
        <QuickContactPanel
          isOpen={!!selectedClientForContact}
          onClose={() => setSelectedClientForContact(null)}
          client={selectedClientForContact}
        />
      )}
    </div>
  )
}
