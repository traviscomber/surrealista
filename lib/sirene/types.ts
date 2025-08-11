/**
 * Tipos de datos para la integración con SIRENE
 */

export interface SIRENECompany {
  rut: string
  razonSocial: string
  nombreFantasia?: string
  giro: string
  fechaConstitucion: string
  capital: number
  estado: "ACTIVA" | "INACTIVA" | "SUSPENDIDA" | "DISUELTA"
  tipoSociedad: string
  direccion: {
    calle: string
    numero: string
    comuna: string
    region: string
    codigoPostal?: string
  }
  representanteLegal: {
    nombre: string
    rut: string
    cargo: string
  }
  socios?: {
    nombre: string
    rut: string
    participacion: number
    tipoAporte: string
  }[]
  actividadEconomica: {
    codigo: string
    descripcion: string
    categoria: string
  }[]
}

export interface SIRENEFinancialData {
  rut: string
  ano: number
  ingresos: number
  patrimonio: number
  activos: number
  pasivos: number
  utilidades: number
  trabajadores: number
  ventasUF: number
  clasificacionTamano: "MICRO" | "PEQUENA" | "MEDIANA" | "GRANDE"
}

export interface SIRENERealEstateCompany extends SIRENECompany {
  licenciaInmobiliaria?: {
    numero: string
    fechaVencimiento: string
    estado: "VIGENTE" | "VENCIDA" | "SUSPENDIDA"
  }
  proyectosActivos: {
    nombre: string
    comuna: string
    estado: string
    unidades: number
    valorProyecto: number
  }[]
  ventasHistoricas: {
    ano: number
    unidadesVendidas: number
    montoTotal: number
    precioPromedio: number
  }[]
  especializacion: string[]
}

export interface SIRENEMarketAnalysis {
  sector: string
  empresasActivas: number
  empresasNuevas: number
  inversionTotal: number
  empleosGenerados: number
  crecimientoAnual: number
  concentracionMercado: {
    top5Empresas: string[]
    participacionMercado: number[]
  }
  tendencias: {
    mes: string
    nuevasEmpresas: number
    inversionMensual: number
  }[]
}

export interface SIRENESearchFilters {
  giro?: string
  comuna?: string
  region?: string
  tamanoEmpresa?: "MICRO" | "PEQUENA" | "MEDIANA" | "GRANDE"
  estado?: "ACTIVA" | "INACTIVA" | "SUSPENDIDA" | "DISUELTA"
  fechaConstitucionDesde?: string
  fechaConstitucionHasta?: string
  capitalMinimo?: number
  capitalMaximo?: number
}

export interface SIRENEResponse<T> {
  success: boolean
  data: T
  pagination?: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
  error?: string
}
