export type ClientInteraction = {
  id: string
  client_id: string
  type: 'call' | 'email' | 'whatsapp' | 'meeting' | 'visit' | 'message'
  title: string
  description: string
  date: string
  duration?: number
  notes?: string
  created_at: string
}

export type ClientTask = {
  id: string
  client_id: string
  title: string
  description?: string
  status: 'pending' | 'in_progress' | 'completed'
  priority: 'low' | 'medium' | 'high'
  due_date: string
  assigned_to?: string
  created_at: string
}

export type ClientNote = {
  id: string
  client_id: string
  content: string
  created_by: string
  created_at: string
  updated_at: string
}

export type ClientAlert = {
  id: string
  client_id: string
  type: 'follow_up_needed' | 'abandoned' | 'price_changed' | 'document_pending'
  message: string
  severity: 'low' | 'medium' | 'high'
  created_at: string
}
