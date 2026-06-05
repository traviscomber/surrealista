// Valuation Engine Schemas
import { z } from 'zod'

export const ValuationMethodSchema = z.enum(['comparable', 'income', 'cost', 'hybrid'])

export const ComparablePropertySchema = z.object({
  id: z.string().uuid(),
  property_id: z.string().uuid(),
  name: z.string(),
  price: z.number(),
  price_per_hectare: z.number(),
  distance_km: z.number(),
  similarity_score: z.number().min(0).max(100),
  sale_date: z.date(),
  features: z.record(z.any())
})

export type ComparableProperty = z.infer<typeof ComparablePropertySchema>

export const ValuationReportSchema = z.object({
  id: z.string().uuid(),
  property_id: z.string().uuid(),
  method: ValuationMethodSchema,
  valuation_date: z.date(),
  estimated_value: z.number(),
  estimated_price_per_hectare: z.number(),
  confidence_level: z.number().min(0).max(100),
  comparable_properties: z.array(ComparablePropertySchema),
  market_trend: z.enum(['rising', 'stable', 'falling']),
  recommendations: z.array(z.string()).optional(),
  created_at: z.date(),
  updated_at: z.date()
})

export type ValuationReport = z.infer<typeof ValuationReportSchema>
