// Alerts & Notifications Schemas
import { z } from 'zod'

export const AlertRuleSchema = z.object({
  id: z.string().uuid(),
  user_id: z.string().uuid(),
  rule_name: z.string(),
  trigger_type: z.enum([
    'client_milestone',
    'document_expiring',
    'follow_up_due',
    'price_change',
    'competitor_activity',
    'task_overdue'
  ]),
  condition: z.record(z.any()),
  notification_channels: z.array(z.enum(['email', 'push', 'in_app', 'whatsapp'])),
  is_active: z.boolean().default(true),
  created_at: z.date(),
  updated_at: z.date()
})

export type AlertRule = z.infer<typeof AlertRuleSchema>

export const AlertNotificationSchema = z.object({
  id: z.string().uuid(),
  user_id: z.string().uuid(),
  rule_id: z.string().uuid(),
  title: z.string(),
  message: z.string(),
  action_url: z.string().optional(),
  read_at: z.date().optional(),
  created_at: z.date()
})

export type AlertNotification = z.infer<typeof AlertNotificationSchema>
