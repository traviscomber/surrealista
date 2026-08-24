/**
 * Módulo para utilidades y plantillas de documentos generados por IA.
 */

export * from "./document-templates"
export * from "./document-utils"

export enum DocumentCategory {
  PROPERTY = "property",
  MARKET = "market",
  CLIENT = "client",
  INVESTMENT = "investment",
  LEGAL = "legal",
  OTHER = "other",
}

export const DOCUMENT_TEMPLATES_PATH = "/templates/documents"
export const MAX_DOCUMENT_SIZE = 10 * 1024 * 1024
