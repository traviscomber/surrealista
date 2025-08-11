/**
 * Tipos para integración con SII (Servicio de Impuestos Internos)
 */

export interface SIIProperty {
  rolAvaluo: string
  comuna: string
  manzana: string
  predio: string
  subPredio?: string
  direccion: {
    calle: string
    numero: string
    block?: string
    departamento?: string
    comuna: string
    region: string
  }
  propietario: {
    rut: string
    nombre: string
    porcentajeDerecho: number
  }[]
  avaluoFiscal: {
    terreno: number
    construccion: number
    total: number
    anoAvaluo: number
  }
  superficies: {
    terreno: number
    construida: number
    util?: number
  }
  caracteristicas: {
    anoConstruction: number
    materialPredominante: string
    estadoConservacion: string
    destinoInmueble: string
    tipoVivienda?: string
  }
  contribuciones: {
    anoVigente: number
    valorAnual: number
    cuotasPagadas: number
    cuotasPendientes: number
    montoMoroso?: number
    exenciones?: string[]
  }
}

export interface SIITransaction {
  fechaInscripcion: string
  fechaEscritura: string
  notaria: string
  fojas: number
  numero: number
  ano: number
  comprador: {
    rut: string
    nombre: string
  }
  vendedor: {
    rut: string
    nombre: string
  }
  montoTransaccion: number
  formaPago: string
  tipoTransaccion: "COMPRAVENTA" | "DONACION" | "HERENCIA" | "ADJUDICACION"
}

export interface SIIContributions {
  rolAvaluo: string
  anoTributario: number
  contribucionesTerritoriales: {
    valorAnual: number
    cuotas: {
      numero: number
      fechaVencimiento: string
      monto: number
      estado: "PAGADA" | "PENDIENTE" | "MOROSA"
      fechaPago?: string
    }[]
  }
  contribucionesBieneRaices: {
    valorAnual: number
    cuotas: {
      numero: number
      fechaVencimiento: string
      monto: number
      estado: "PAGADA" | "PENDIENTE" | "MOROSA"
      fechaPago?: string
    }[]
  }
  totalAnual: number
  totalPagado: number
  totalPendiente: number
  beneficios?: {
    tipo: string
    descripcion: string
    descuento: number
  }[]
}

export interface SIIMarketData {
  comuna: string
  periodo: string
  transacciones: {
    cantidad: number
    montoTotal: number
    precioPromedio: number
    precioM2Promedio: number
  }
  avaluos: {
    promedioTerreno: number
    promedioConstruccion: number
    promedioTotal: number
  }
  tendencias: {
    mes: string
    transacciones: number
    montoPromedio: number
  }[]
}

export interface SIISearchFilters {
  comuna?: string
  calle?: string
  numero?: string
  rolAvaluo?: string
  propietarioRut?: string
  propietarioNombre?: string
  rangoAvaluo?: {
    min: number
    max: number
  }
  anoConstruction?: {
    min: number
    max: number
  }
  superficie?: {
    min: number
    max: number
  }
}

export interface SIIResponse<T> {
  success: boolean
  data: T
  error?: string
  pagination?: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

export interface SIIPropertyValuation {
  rolAvaluo: string
  valorComercial: number
  valorFiscal: number
  factorCorreccion: number
  fechaValoracion: string
  metodologia: string
  comparables: {
    rolAvaluo: string
    direccion: string
    precioVenta: number
    fechaVenta: string
    ajustes: {
      ubicacion: number
      superficie: number
      estado: number
      total: number
    }
  }[]
  observaciones?: string
}
