/**
 * Módulo para el análisis de datos con IA
 * Este archivo exporta todas las funcionalidades relacionadas con análisis
 */

export * from "./analysis-service"
export * from "./data-visualization"
export * from "./insight-generator"

// Tipos específicos de análisis
export enum AnalysisCategory {
  PROPERTY = "property",
  MARKET = "market",
  CLIENT = "client",
  FINANCIAL = "financial",
  PREDICTIVE = "predictive",
  OTHER = "other",
}

// Constantes
export const ANALYSIS_MODELS_PATH = "/models/analysis"
export const MAX_ANALYSIS_DATA_SIZE = 50 * 1024 * 1024 // 50MB
