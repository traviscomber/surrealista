// CRM Types - Interacciones, Tareas, Notas y Alertas

export interface ClientInteraction {
  id: string
  client_id: string
  interaction_type: 'call' | 'email' | 'whatsapp' | 'meeting' | 'visit' | 'note'
  subject: string
  description: string
  duration_minutes?: number
  outcome: 'positive' | 'neutral' | 'negative' | 'pending'
  next_followup_date?: string
  created_by: string
  created_at: string
  updated_at: string
}

export interface ClientTask {
  id: string
  client_id: string
  title: string
  description: string
  task_type: 'followup' | 'call' | 'email' | 'proposal' | 'meeting' | 'visit' | 'other'
  priority: 'low' | 'medium' | 'high' | 'urgent'
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled'
  due_date: string
  assigned_to: string
  completed_at?: string
  created_at: string
  updated_at: string
}

export interface ClientNote {
  id: string
  client_id: string
  title: string
  content: string
  note_type: 'personal' | 'internal' | 'important'
  created_by: string
  created_at: string
  updated_at: string
}

export interface ClientAlert {
  id: string
  client_id: string
  alert_type: 'abandoned_lead' | 'followup_overdue' | 'birthday' | 'anniversary' | 'custom'
  title: string
  message: string
  priority: 'low' | 'medium' | 'high'
  is_read: boolean
  action_url?: string
  created_at: string
  read_at?: string
}

export interface ClientCommunicationLog {
  id: string
  client_id: string
  channel: 'email' | 'phone' | 'whatsapp' | 'sms' | 'platform'
  message_type: 'outgoing' | 'incoming'
  subject: string
  content: string
  external_id?: string
  status: 'sent' | 'delivered' | 'read' | 'failed' | 'received'
  created_at: string
  updated_at: string
}

export interface Client360View {
  client: any
  interactions: ClientInteraction[]
  tasks: ClientTask[]
  notes: ClientNote[]
  alerts: ClientAlert[]
  communicationLog: ClientCommunicationLog[]
  stats: {
    totalInteractions: number
    lastInteractionDate: string | null
    nextFollowupDate: string | null
    overdueTasks: number
    activeTasks: number
    pipeline_status: string
  }
}
