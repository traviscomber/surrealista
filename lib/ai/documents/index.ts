/**
 * Módulo para la gestión de documentos generados por IA
 * Este archivo exporta todas las funcionalidades relacionadas con documentos
 */

export * from "./document-service"
export * from "./document-templates"
export * from "./document-utils"

// Tipos específicos de documentos
export enum DocumentCategory {
  PROPERTY = "property",
  MARKET = "market",
  CLIENT = "client",
  INVESTMENT = "investment",
  LEGAL = "legal",
  OTHER = "other",
}

// Constantes
export const DOCUMENT_TEMPLATES_PATH = "/templates/documents"
export const MAX_DOCUMENT_SIZE = 10 * 1024 * 1024 // 10MB
