/**
 * Módulo principal para la integración de IA en Sur-Realista
 * Este archivo exporta todas las funcionalidades relacionadas con IA
 */

// Exportar submódulos
export * from "./documents"
export * from "./analysis"
export * from "./agents"
export * from "./models"
export * from "./workflows"

// Exportar tipos
export * from "./types"

// Constantes globales
export const AI_VERSION = "1.0.0"
export const AI_CONFIG = {
  defaultModel: "gpt-4o",
  apiTimeout: 30000, // 30 segundos
  maxTokens: 4000,
  temperature: 0.7,
}

// Funciones de utilidad comunes
export const formatAIResponse = (response: string): string => {
  return response.trim()
}

export const sanitizeInput = (input: string): string => {
  return input.trim().replace(/[<>]/g, "")
}
