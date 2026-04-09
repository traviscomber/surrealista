// Pipeline and CRM Schemas
import { z } from 'zod'

export const PipelineStageSchema = z.enum([
  'lead',
  'contacted',
  'qualified',
  'proposal',
  'negotiation',
  'closed_won',
  'closed_lost'
])

export const PipelineStage = {
  LEAD: 'lead',
  CONTACTED: 'contacted',
  QUALIFIED: 'qualified',
  PROPOSAL: 'proposal',
  NEGOTIATION: 'negotiation',
  CLOSED_WON: 'closed_won',
  CLOSED_LOST: 'closed_lost'
} as const

export const ClientPipelineSchema = z.object({
  id: z.string().uuid(),
  client_id: z.string().uuid(),
  stage: PipelineStageSchema,
  probability: z.number().min(0).max(100), // % probabilidad de cierre
  property_id: z.string().uuid().optional(),
  estimated_value: z.number().optional(),
  next_action: z.string().optional(),
  next_action_date: z.date().optional(),
  created_at: z.date(),
  updated_at: z.date(),
  moved_at: z.date().optional()
})

export type ClientPipeline = z.infer<typeof ClientPipelineSchema>

// Heatmap & Analytics Schemas
export const HeatmapDataSchema = z.object({
  latitude: z.number(),
  longitude: z.number(),
  value: z.number(), // intensity
  property_count: z.number(),
  avg_price: z.number().optional(),
  sale_volume: z.number()
})

export type HeatmapData = z.infer<typeof HeatmapDataSchema>
