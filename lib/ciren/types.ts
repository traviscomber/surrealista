/**
 * Tipos para la integración con CIREN
 * Centro de Información de Riesgos Empresariales de Chile
 * https://ciren.cl
 */

export interface CirenCompany {
  rut: string
  razonSocial: string
  nombreFantasia?: string
  actividadEconomica: string
  fechaConstitucion: string
  capital: number
  estado: "Activa" | "Inactiva" | "En Liquidación"
  region: string
  comuna: string
  direccion: string
  telefono?: string
  email?: string
  sitioWeb?: string
  scoring: number
  categoria: string
  ultimaActualizacion: string
}

export type CIRENCompany = CirenCompany

export interface CirenRiskProfile {
  rut: string
  empresa: string
  scoreGeneral: number
  nivelRiesgo: "Bajo" | "Medio" | "Alto" | "Crítico"
  probabilidadDefault: number
  capacidadPago: number
  estabilidadFinanciera: number
  historialPagos: number
  garantias: number
  sectorialRisk: number
  macroeconomicRisk: number
  recomendacion: "Aprobado" | "Condicional" | "Rechazado"
  limiteCredito: number
  plazoRecomendado: number
  condicionesEspeciales: string[]
  alertasActivas: number
  ultimaEvaluacion: string
  proximaRevision: string
  observaciones: string
}

export interface CirenSearchParams {
  rut?: string
  razonSocial?: string
  region?: string
  actividadEconomica?: string
  limit?: number
}

export interface CirenFinancialData {
  rut: string
  ingresosTotales: number
  patrimonio: number
  deudaTotal: number
  liquidez: number
  rentabilidad: number
  endeudamiento: number
  periodo: string
  fechaActualizacion: string
}

export interface CirenRiskAnalysis {
  rut: string
  nivelRiesgo: "Bajo" | "Medio" | "Alto"
  probabilidadDefault: number
  recomendacion: "Aprobado" | "Revisar" | "Rechazar"
  factoresRiesgo: string[]
  fechaAnalisis: string
}

export interface CirenAlert {
  id: string
  tipo: "MOROSIDAD" | "PROTESTO" | "EMBARGO" | "QUIEBRA" | "REORGANIZACION" | "DEMANDA"
  descripcion: string
  monto?: number
  fecha: string
  estado: "ACTIVA" | "RESUELTA" | "EN_PROCESO"
  gravedad: "BAJA" | "MEDIA" | "ALTA" | "CRITICA"
}

export interface CirenPaymentHistory {
  periodo: string
  montoFacturado: number
  montoPagado: number
  diasAtraso: number
  estado: "AL_DIA" | "ATRASO_LEVE" | "ATRASO_GRAVE" | "INCOBRABLE"
}

export interface CirenMarketAnalysis {
  sector: string
  empresasActivas: number
  promedioScore: number
  tendenciaSector: "CRECIMIENTO" | "ESTABLE" | "DECLIVE"
  riesgoSectorial: "BAJO" | "MEDIO" | "ALTO"
  oportunidades: string[]
  amenazas: string[]
}

export interface CirenAIInsight {
  rut: string
  resumenEjecutivo: string
  fortalezas: string[]
  debilidades: string[]
  oportunidades: string[]
  amenazas: string[]
  recomendaciones: string[]
  scoreConfiabilidad: number
  perspectiva: "POSITIVA" | "NEUTRAL" | "NEGATIVA"
  factoresRiesgo: string[]
}

export interface CirenSearchFilters {
  rut?: string
  razonSocial?: string
  giro?: string
  comuna?: string
  region?: string
  scoreMinimo?: number
  scoreMaximo?: string[]
  categoriaRiesgo?: string[]
  estado?: string[]
  capitalMinimo?: number
  capitalMaximo?: number
}

export interface CirenSearchResult {
  empresas: CirenCompany[]
  total: number
  pagina: number
  totalPaginas: number
  filtrosAplicados: CirenSearchFilters
}
