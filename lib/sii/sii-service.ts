/**
 * Servicio para integración con SII (Servicio de Impuestos Internos)
 */

import type {
  SIIProperty,
  SIITransaction,
  SIIContributions,
  SIIMarketData,
  SIISearchFilters,
  SIIResponse,
  SIIPropertyValuation,
} from "./types"

export class SIIService {
  private baseUrl: string
  private apiKey: string
  private userToken: string

  constructor() {
    // Demo credentials for testing
    this.baseUrl = process.env.SII_API_URL || "https://demo.sii.cl/api/v2"
    this.apiKey = process.env.SII_API_KEY || "demo_sii_key_2024"
    this.userToken = process.env.SII_USER_TOKEN || "demo_user_token_sii"
  }

  /**
   * Busca propiedad por rol de avalúo
   */
  async getPropertyByRol(rolAvaluo: string): Promise<SIIResponse<SIIProperty>> {
    try {
      // Simulación de respuesta real del SII
      const mockData: SIIProperty = {
        rolAvaluo: rolAvaluo,
        comuna: "PUERTO VARAS",
        manzana: "125",
        predio: "8",
        direccion: {
          calle: "COSTANERA DEL LAGO",
          numero: "1250",
          comuna: "PUERTO VARAS",
          region: "LOS LAGOS",
        },
        propietario: [
          {
            rut: "12345678-9",
            nombre: "CARLOS EDUARDO MARTINEZ SILVA",
            porcentajeDerecho: 60,
          },
          {
            rut: "98765432-1",
            nombre: "MARIA TERESA GONZALEZ LOPEZ",
            porcentajeDerecho: 40,
          },
        ],
        avaluoFiscal: {
          terreno: 180000000,
          construccion: 120000000,
          total: 300000000,
          anoAvaluo: 2024,
        },
        superficies: {
          terreno: 1200,
          construida: 280,
          util: 250,
        },
        caracteristicas: {
          anoConstruction: 2018,
          materialPredominante: "HORMIGON ARMADO",
          estadoConservacion: "BUENO",
          destinoInmueble: "CASA HABITACION",
          tipoVivienda: "CASA",
        },
        contribuciones: {
          anoVigente: 2024,
          valorAnual: 1200000,
          cuotasPagadas: 2,
          cuotasPendientes: 2,
          exenciones: ["ADULTO MAYOR"],
        },
      }

      return {
        success: true,
        data: mockData,
      }
    } catch (error: any) {
      return {
        success: false,
        data: {} as SIIProperty,
        error: error.message,
      }
    }
  }

  /**
   * Obtiene historial de transacciones de una propiedad
   */
  async getPropertyTransactions(rolAvaluo: string, years = 5): Promise<SIIResponse<SIITransaction[]>> {
    try {
      const currentYear = new Date().getFullYear()
      const mockData: SIITransaction[] = [
        {
          fechaInscripcion: "2023-08-15",
          fechaEscritura: "2023-08-10",
          notaria: "NOTARIA PUERTO VARAS",
          fojas: 1250,
          numero: 890,
          ano: 2023,
          comprador: {
            rut: "12345678-9",
            nombre: "CARLOS EDUARDO MARTINEZ SILVA",
          },
          vendedor: {
            rut: "11111111-1",
            nombre: "INMOBILIARIA PATAGONIA SPA",
          },
          montoTransaccion: 280000000,
          formaPago: "CREDITO HIPOTECARIO",
          tipoTransaccion: "COMPRAVENTA",
        },
        {
          fechaInscripcion: "2020-03-20",
          fechaEscritura: "2020-03-15",
          notaria: "NOTARIA PUERTO VARAS",
          fojas: 890,
          numero: 445,
          ano: 2020,
          comprador: {
            rut: "11111111-1",
            nombre: "INMOBILIARIA PATAGONIA SPA",
          },
          vendedor: {
            rut: "22222222-2",
            nombre: "CONSTRUCTORA DEL SUR LTDA",
          },
          montoTransaccion: 220000000,
          formaPago: "CONTADO",
          tipoTransaccion: "COMPRAVENTA",
        },
      ]

      return {
        success: true,
        data: mockData,
      }
    } catch (error: any) {
      return {
        success: false,
        data: [],
        error: error.message,
      }
    }
  }

  /**
   * Obtiene estado de contribuciones
   */
  async getContributions(rolAvaluo: string, year?: number): Promise<SIIResponse<SIIContributions>> {
    try {
      const targetYear = year || new Date().getFullYear()

      const mockData: SIIContributions = {
        rolAvaluo: rolAvaluo,
        anoTributario: targetYear,
        contribucionesTerritoriales: {
          valorAnual: 600000,
          cuotas: [
            {
              numero: 1,
              fechaVencimiento: `${targetYear}-04-30`,
              monto: 150000,
              estado: "PAGADA",
              fechaPago: `${targetYear}-04-25`,
            },
            {
              numero: 2,
              fechaVencimiento: `${targetYear}-06-30`,
              monto: 150000,
              estado: "PAGADA",
              fechaPago: `${targetYear}-06-28`,
            },
            {
              numero: 3,
              fechaVencimiento: `${targetYear}-09-30`,
              monto: 150000,
              estado: "PENDIENTE",
            },
            {
              numero: 4,
              fechaVencimiento: `${targetYear}-11-30`,
              monto: 150000,
              estado: "PENDIENTE",
            },
          ],
        },
        contribucionesBieneRaices: {
          valorAnual: 600000,
          cuotas: [
            {
              numero: 1,
              fechaVencimiento: `${targetYear}-04-30`,
              monto: 150000,
              estado: "PAGADA",
              fechaPago: `${targetYear}-04-25`,
            },
            {
              numero: 2,
              fechaVencimiento: `${targetYear}-06-30`,
              monto: 150000,
              estado: "PAGADA",
              fechaPago: `${targetYear}-06-28`,
            },
            {
              numero: 3,
              fechaVencimiento: `${targetYear}-09-30`,
              monto: 150000,
              estado: "PENDIENTE",
            },
            {
              numero: 4,
              fechaVencimiento: `${targetYear}-11-30`,
              monto: 150000,
              estado: "PENDIENTE",
            },
          ],
        },
        totalAnual: 1200000,
        totalPagado: 600000,
        totalPendiente: 600000,
        beneficios: [
          {
            tipo: "ADULTO_MAYOR",
            descripcion: "Descuento por adulto mayor",
            descuento: 0.25,
          },
        ],
      }

      return {
        success: true,
        data: mockData,
      }
    } catch (error: any) {
      return {
        success: false,
        data: {} as SIIContributions,
        error: error.message,
      }
    }
  }

  /**
   * Obtiene datos de mercado por comuna
   */
  async getMarketData(comuna: string, months = 12): Promise<SIIResponse<SIIMarketData>> {
    try {
      const mockData: SIIMarketData = {
        comuna: comuna.toUpperCase(),
        periodo: `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, "0")}`,
        transacciones: {
          cantidad: 145,
          montoTotal: 28500000000,
          precioPromedio: 196551724,
          precioM2Promedio: 1250000,
        },
        avaluos: {
          promedioTerreno: 120000000,
          promedioConstruccion: 80000000,
          promedioTotal: 200000000,
        },
        tendencias: [
          { mes: "2024-01", transacciones: 8, montoPromedio: 185000000 },
          { mes: "2024-02", transacciones: 12, montoPromedio: 192000000 },
          { mes: "2024-03", transacciones: 15, montoPromedio: 198000000 },
          { mes: "2024-04", transacciones: 18, montoPromedio: 205000000 },
          { mes: "2024-05", transacciones: 22, montoPromedio: 210000000 },
          { mes: "2024-06", transacciones: 19, montoPromedio: 208000000 },
          { mes: "2024-07", transacciones: 16, montoPromedio: 195000000 },
          { mes: "2024-08", transacciones: 14, montoPromedio: 188000000 },
          { mes: "2024-09", transacciones: 11, montoPromedio: 182000000 },
          { mes: "2024-10", transacciones: 10, montoPromedio: 180000000 },
        ],
      }

      return {
        success: true,
        data: mockData,
      }
    } catch (error: any) {
      return {
        success: false,
        data: {} as SIIMarketData,
        error: error.message,
      }
    }
  }

  /**
   * Busca propiedades por filtros
   */
  async searchProperties(filters: SIISearchFilters, page = 1, limit = 20): Promise<SIIResponse<SIIProperty[]>> {
    try {
      // Simulación de búsqueda de propiedades
      const mockData: SIIProperty[] = [
        {
          rolAvaluo: "125-8-0",
          comuna: "PUERTO VARAS",
          manzana: "125",
          predio: "8",
          direccion: {
            calle: "COSTANERA DEL LAGO",
            numero: "1250",
            comuna: "PUERTO VARAS",
            region: "LOS LAGOS",
          },
          propietario: [
            {
              rut: "12345678-9",
              nombre: "CARLOS EDUARDO MARTINEZ SILVA",
              porcentajeDerecho: 100,
            },
          ],
          avaluoFiscal: {
            terreno: 180000000,
            construccion: 120000000,
            total: 300000000,
            anoAvaluo: 2024,
          },
          superficies: {
            terreno: 1200,
            construida: 280,
          },
          caracteristicas: {
            anoConstruction: 2018,
            materialPredominante: "HORMIGON ARMADO",
            estadoConservacion: "BUENO",
            destinoInmueble: "CASA HABITACION",
          },
          contribuciones: {
            anoVigente: 2024,
            valorAnual: 1200000,
            cuotasPagadas: 2,
            cuotasPendientes: 2,
          },
        },
        {
          rolAvaluo: "126-15-0",
          comuna: "PUERTO VARAS",
          manzana: "126",
          predio: "15",
          direccion: {
            calle: "AVENIDA PHILIPPI",
            numero: "890",
            comuna: "PUERTO VARAS",
            region: "LOS LAGOS",
          },
          propietario: [
            {
              rut: "87654321-0",
              nombre: "ANA MARIA RODRIGUEZ PEREZ",
              porcentajeDerecho: 100,
            },
          ],
          avaluoFiscal: {
            terreno: 150000000,
            construccion: 100000000,
            total: 250000000,
            anoAvaluo: 2024,
          },
          superficies: {
            terreno: 800,
            construida: 220,
          },
          caracteristicas: {
            anoConstruction: 2015,
            materialPredominante: "HORMIGON ARMADO",
            estadoConservacion: "BUENO",
            destinoInmueble: "CASA HABITACION",
          },
          contribuciones: {
            anoVigente: 2024,
            valorAnual: 1000000,
            cuotasPagadas: 4,
            cuotasPendientes: 0,
          },
        },
      ]

      return {
        success: true,
        data: mockData,
        pagination: {
          page,
          limit,
          total: 156,
          totalPages: 8,
        },
      }
    } catch (error: any) {
      return {
        success: false,
        data: [],
        error: error.message,
      }
    }
  }

  /**
   * Obtiene valoración comercial de propiedad
   */
  async getPropertyValuation(rolAvaluo: string): Promise<SIIResponse<SIIPropertyValuation>> {
    try {
      const mockData: SIIPropertyValuation = {
        rolAvaluo: rolAvaluo,
        valorComercial: 350000000,
        valorFiscal: 300000000,
        factorCorreccion: 1.167,
        fechaValoracion: new Date().toISOString().split("T")[0],
        metodologia: "COMPARACION DE MERCADO",
        comparables: [
          {
            rolAvaluo: "125-9-0",
            direccion: "COSTANERA DEL LAGO 1280",
            precioVenta: 340000000,
            fechaVenta: "2024-03-15",
            ajustes: {
              ubicacion: 0.02,
              superficie: -0.05,
              estado: 0.03,
              total: 0.0,
            },
          },
          {
            rolAvaluo: "124-12-0",
            direccion: "COSTANERA DEL LAGO 1180",
            precioVenta: 365000000,
            fechaVenta: "2024-02-20",
            ajustes: {
              ubicacion: -0.03,
              superficie: 0.08,
              estado: -0.02,
              total: 0.03,
            },
          },
        ],
        observaciones:
          "Valoración basada en propiedades similares en la zona con ajustes por ubicación y características específicas.",
      }

      return {
        success: true,
        data: mockData,
      }
    } catch (error: any) {
      return {
        success: false,
        data: {} as SIIPropertyValuation,
        error: error.message,
      }
    }
  }

  /**
   * Formatea rol de avalúo
   */
  formatRol(rol: string): string {
    const parts = rol.split("-")
    if (parts.length === 3) {
      return `${parts[0]}-${parts[1]}-${parts[2]}`
    }
    return rol
  }

  /**
   * Valida formato de rol de avalúo
   */
  validateRol(rol: string): boolean {
    const rolRegex = /^\d{1,4}-\d{1,4}-\d{1,2}$/
    return rolRegex.test(rol)
  }
}

// Instancia singleton del servicio
export const siiService = new SIIService()
