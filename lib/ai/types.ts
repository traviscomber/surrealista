/**
 * Tipos de datos comunes para el sistema de IA
 */

// Tipos básicos
export type AIModelType = "gpt-4o" | "gpt-4" | "gpt-3.5-turbo" | "claude-3" | "custom"
export type AIDocumentType =
  | "property-analysis"
  | "market-report"
  | "client-recommendation"
  | "investment-analysis"
  | "custom"
export type AIAgentRole = "property-analyst" | "market-researcher" | "client-advisor" | "data-processor" | "custom"
export type AIWorkflowType =
  | "property-evaluation"
  | "client-matching"
  | "market-analysis"
  | "investment-recommendation"
  | "custom"
export type AIAnalysisType =
  | "price-prediction"
  | "market-trend"
  | "client-preference"
  | "property-comparison"
  | "custom"

// Interfaces principales
export interface AIDocument {
  id: string
  type: AIDocumentType
  title: string
  content: string
  metadata: Record<string, any>
  createdAt: Date
  updatedAt: Date
  createdBy: string
  relatedEntityId?: string // ID de propiedad, cliente, etc.
  tags: string[]
  status: "draft" | "published" | "archived"
  version: number
}

export interface AIAgent {
  id: string
  name: string
  role: AIAgentRole
  description: string
  capabilities: string[]
  model: AIModelType
  parameters: Record<string, any>
  status: "active" | "inactive" | "training"
  createdAt: Date
  updatedAt: Date
  lastRun?: Date
  successRate?: number
  trainingData?: string[]
}

export interface AIModel {
  id: string
  name: string
  type: AIModelType
  version: string
  description: string
  parameters: Record<string, any>
  trainingStatus: "not-trained" | "training" | "trained" | "failed"
  accuracy?: number
  lastTrainedAt?: Date
  createdAt: Date
  updatedAt: Date
}

export interface AIWorkflow {
  id: string
  name: string
  type: AIWorkflowType
  description: string
  steps: AIWorkflowStep[]
  triggers: AIWorkflowTrigger[]
  status: "active" | "inactive" | "draft"
  createdAt: Date
  updatedAt: Date
  lastRun?: Date
  averageRuntime?: number
  successRate?: number
}

export interface AIWorkflowStep {
  id: string
  name: string
  description: string
  agentId: string
  parameters: Record<string, any>
  order: number
  dependsOn: string[] // IDs de pasos anteriores
  timeout: number // en milisegundos
  retryCount: number
  status?: "pending" | "running" | "completed" | "failed"
}

export interface AIWorkflowTrigger {
  id: string
  type: "schedule" | "event" | "manual"
  schedule?: string // Cron expression
  eventType?: string
  eventFilter?: Record<string, any>
  enabled: boolean
}

export interface AIAnalysis {
  id: string
  type: AIAnalysisType
  title: string
  description: string
  data: Record<string, any>
  results: Record<string, any>
  visualizations: AIVisualization[]
  insights: AIInsight[]
  createdAt: Date
  updatedAt: Date
  createdBy: string
  status: "pending" | "processing" | "completed" | "failed"
  relatedEntityId?: string
  modelId: string
}

export interface AIVisualization {
  id: string
  type: "chart" | "graph" | "map" | "table"
  title: string
  description: string
  config: Record<string, any>
  data: any[]
}

export interface AIInsight {
  id: string
  title: string
  description: string
  importance: "low" | "medium" | "high" | "critical"
  confidence: number // 0-1
  tags: string[]
  relatedInsights: string[] // IDs de otros insights relacionados
}

// Interfaces para solicitudes y respuestas
export interface AIDocumentRequest {
  type: AIDocumentType
  title: string
  content?: string
  metadata?: Record<string, any>
  relatedEntityId?: string
  tags?: string[]
}

export interface AIAgentRequest {
  name: string
  role: AIAgentRole
  description: string
  capabilities?: string[]
  model: AIModelType
  parameters?: Record<string, any>
}

export interface AIAnalysisRequest {
  type: AIAnalysisType
  title: string
  description?: string
  data: Record<string, any>
  relatedEntityId?: string
  modelId: string
}

export interface AIWorkflowRequest {
  name: string
  type: AIWorkflowType
  description?: string
  steps: Omit<AIWorkflowStep, "id">[]
  triggers?: Omit<AIWorkflowTrigger, "id">[]
}

// Interfaces para eventos
export interface AIEvent {
  id: string
  type: string
  timestamp: Date
  data: Record<string, any>
  source: string
}

// Interfaces para resultados
export interface AIResult<T> {
  success: boolean
  data?: T
  error?: string
  timestamp: Date
  processingTime?: number
  metadata?: Record<string, any>
}
