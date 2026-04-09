// Email & Communication Tracking Schemas
import { z } from 'zod'

export const EmailStatusSchema = z.enum(['sent', 'delivered', 'opened', 'clicked', 'bounced', 'failed'])

export const EmailTrackingSchema = z.object({
  id: z.string().uuid(),
  message_id: z.string(),
  recipient_email: z.string().email(),
  client_id: z.string().uuid().optional(),
  subject: z.string(),
  sent_at: z.date(),
  opened_at: z.date().optional(),
  clicked_at: z.date().optional(),
  status: EmailStatusSchema,
  clicks_count: z.number().default(0),
  open_count: z.number().default(0),
  template_type: z.string().optional(),
  campaign_id: z.string().uuid().optional()
})

export type EmailTracking = z.infer<typeof EmailTrackingSchema>

export const WhatsAppMessageSchema = z.object({
  id: z.string().uuid(),
  wha_message_id: z.string(),
  phone_number: z.string(),
  client_id: z.string().uuid().optional(),
  message_type: z.enum(['text', 'image', 'document', 'template']),
  content: z.string(),
  sent_at: z.date(),
  delivered_at: z.date().optional(),
  read_at: z.date().optional(),
  status: z.enum(['sent', 'delivered', 'read', 'failed']),
  template_id: z.string().optional()
})

export type WhatsAppMessage = z.infer<typeof WhatsAppMessageSchema>
