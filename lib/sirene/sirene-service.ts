/**
 * Servicio para integración con SIRENE
 */

import type {
  SIRENECompany,
  SIRENEFinancialData,
  SIRENERealEstateCompany,
  SIRENEMarketAnalysis,
  SIRENESearchFilters,
  SIRENEResponse,
} from "./types"

export class SIRENEService {
  private baseUrl: string
  private apiKey: string

  constructor() {
    // Demo credentials for testing
    this.baseUrl = process.env.SIRENE_API_URL || "https://demo.sirene.cl/api/v1"
    this.apiKey = process.env.SIRENE_API_KEY || "demo_sirene_key_2024"
  }

  /**
   * Busca empresa por RUT
   */
  async getCompanyByRUT(rut: string): Promise<SIRENEResponse<SIRENECompany>> {
    try {
      const cleanRUT = this.cleanRUT(rut)

      // Simulación de respuesta real de SIRENE
      // En producción, esto sería una llamada HTTP real
      const mockData: SIRENECompany = {
        rut: cleanRUT,
        razonSocial: "INMOBILIARIA SUR LAGOS LIMITADA",
        nombreFantasia: "Sur Lagos Propiedades",
        giro: "ACTIVIDADES INMOBILIARIAS REALIZADAS CON BIENES PROPIOS O ARRENDADOS",
        fechaConstitucion: "2018-03-15",
        capital: 50000000,
        estado: "ACTIVA",
        tipoSociedad: "SOCIEDAD DE RESPONSABILIDAD LIMITADA",
        direccion: {
          calle: "Avenida Costanera",
          numero: "1250",
          comuna: "Puerto Varas",
          region: "Los Lagos",
          codigoPostal: "5550000",
        },
        representanteLegal: {
          nombre: "CARLOS EDUARDO MARTINEZ SILVA",
          rut: "12345678-9",
          cargo: "GERENTE GENERAL",
        },
        socios: [
          {
            nombre: "CARLOS EDUARDO MARTINEZ SILVA",
            rut: "12345678-9",
            participacion: 60,
            tipoAporte: "DINERO",
          },
          {
            nombre: "MARIA TERESA GONZALEZ LOPEZ",
            rut: "98765432-1",
            participacion: 40,
            tipoAporte: "DINERO",
          },
        ],
        actividadEconomica: [
          {
            codigo: "681000",
            descripcion: "Actividades inmobiliarias realizadas con bienes propios o arrendados",
            categoria: "INMOBILIARIA",
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
        data: {} as SIRENECompany,
        error: error.message,
      }
    }
  }

  /**
   * Obtiene datos financieros de una empresa
   */
  async getFinancialData(rut: string, year?: number): Promise<SIRENEResponse<SIRENEFinancialData[]>> {
    try {
      const cleanRUT = this.cleanRUT(rut)
      const targetYear = year || new Date().getFullYear() - 1

      // Simulación de datos financieros
      const mockData: SIRENEFinancialData[] = [
        {
          rut: cleanRUT,
          ano: targetYear,
          ingresos: 2500000000,
          patrimonio: 800000000,
          activos: 1200000000,
          pasivos: 400000000,
          utilidades: 150000000,
          trabajadores: 25,
          ventasUF: 89285, // Aproximadamente 2.5B pesos
          clasificacionTamano: "MEDIANA",
        },
        {
          rut: cleanRUT,
          ano: targetYear - 1,
          ingresos: 2200000000,
          patrimonio: 750000000,
          activos: 1100000000,
          pasivos: 350000000,
          utilidades: 120000000,
          trabajadores: 22,
          ventasUF: 78571,
          clasificacionTamano: "MEDIANA",
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
   * Busca empresas inmobiliarias por filtros
   */
  async searchRealEstateCompanies(
    filters: SIRENESearchFilters,
    page = 1,
    limit = 20,
  ): Promise<SIRENEResponse<SIRENERealEstateCompany[]>> {
    try {
      // Simulación de búsqueda de empresas inmobiliarias
      const mockData: SIRENERealEstateCompany[] = [
        {
          rut: "76123456-7",
          razonSocial: "INMOBILIARIA PATAGONIA SPA",
          nombreFantasia: "Patagonia Properties",
          giro: "ACTIVIDADES INMOBILIARIAS",
          fechaConstitucion: "2020-01-15",
          capital: 100000000,
          estado: "ACTIVA",
          tipoSociedad: "SOCIEDAD POR ACCIONES",
          direccion: {
            calle: "Costanera del Lago",
            numero: "500",
            comuna: "Puerto Varas",
            region: "Los Lagos",
          },
          representanteLegal: {
            nombre: "ANDREA PATRICIA SILVA ROJAS",
            rut: "15678901-2",
            cargo: "DIRECTORA",
          },
          actividadEconomica: [
            {
              codigo: "681000",
              descripcion: "Actividades inmobiliarias",
              categoria: "INMOBILIARIA",
            },
          ],
          licenciaInmobiliaria: {
            numero: "IM-2020-001",
            fechaVencimiento: "2025-12-31",
            estado: "VIGENTE",
          },
          proyectosActivos: [
            {
              nombre: "Condominio Vista Lagos",
              comuna: "Puerto Varas",
              estado: "EN_CONSTRUCCION",
              unidades: 45,
              valorProyecto: 8500000000,
            },
            {
              nombre: "Parcelas El Bosque",
              comuna: "Frutillar",
              estado: "EN_VENTA",
              unidades: 12,
              valorProyecto: 3200000000,
            },
          ],
          ventasHistoricas: [
            {
              ano: 2023,
              unidadesVendidas: 28,
              montoTotal: 5600000000,
              precioPromedio: 200000000,
            },
            {
              ano: 2022,
              unidadesVendidas: 22,
              montoTotal: 4200000000,
              precioPromedio: 190909091,
            },
          ],
          especializacion: ["CONDOMINIOS", "PARCELAS", "CASAS_PREMIUM"],
        },
        {
          rut: "96234567-8",
          razonSocial: "DESARROLLOS INMOBILIARIOS DEL SUR LTDA",
          nombreFantasia: "Sur Desarrollos",
          giro: "CONSTRUCCION Y VENTA DE INMUEBLES",
          fechaConstitucion: "2015-06-20",
          capital: 200000000,
          estado: "ACTIVA",
          tipoSociedad: "SOCIEDAD DE RESPONSABILIDAD LIMITADA",
          direccion: {
            calle: "Avenida Philippi",
            numero: "1850",
            comuna: "Puerto Varas",
            region: "Los Lagos",
          },
          representanteLegal: {
            nombre: "RODRIGO ALEJANDRO MORALES CASTRO",
            rut: "11223344-5",
            cargo: "GERENTE",
          },
          actividadEconomica: [
            {
              codigo: "681000",
              descripcion: "Actividades inmobiliarias",
              categoria: "INMOBILIARIA",
            },
            {
              codigo: "410000",
              descripcion: "Construcción de edificios",
              categoria: "CONSTRUCCION",
            },
          ],
          licenciaInmobiliaria: {
            numero: "IM-2015-045",
            fechaVencimiento: "2025-06-30",
            estado: "VIGENTE",
          },
          proyectosActivos: [
            {
              nombre: "Torres del Lago",
              comuna: "Puerto Varas",
              estado: "TERMINADO",
              unidades: 80,
              valorProyecto: 16000000000,
            },
          ],
          ventasHistoricas: [
            {
              ano: 2023,
              unidadesVendidas: 35,
              montoTotal: 8750000000,
              precioPromedio: 250000000,
            },
          ],
          especializacion: ["DEPARTAMENTOS", "TORRES", "PROYECTOS_MASIVOS"],
        },
      ]

      return {
        success: true,
        data: mockData,
        pagination: {
          page,
          limit,
          total: 45,
          totalPages: 3,
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
   * Obtiene análisis de mercado por sector
   */
  async getMarketAnalysis(sector = "INMOBILIARIO", region?: string): Promise<SIRENEResponse<SIRENEMarketAnalysis>> {
    try {
      const mockData: SIRENEMarketAnalysis = {
        sector: "INMOBILIARIO",
        empresasActivas: 156,
        empresasNuevas: 12,
        inversionTotal: 45000000000,
        empleosGenerados: 2340,
        crecimientoAnual: 8.5,
        concentracionMercado: {
          top5Empresas: [
            "INMOBILIARIA PATAGONIA SPA",
            "DESARROLLOS DEL SUR LTDA",
            "PROPIEDADES LAGOS SA",
            "CONSTRUCTORA AUSTRAL LTDA",
            "INVERSIONES INMOBILIARIAS SUR SPA",
          ],
          participacionMercado: [22.5, 18.3, 15.7, 12.1, 9.8],
        },
        tendencias: [
          { mes: "2024-01", nuevasEmpresas: 2, inversionMensual: 3200000000 },
          { mes: "2024-02", nuevasEmpresas: 1, inversionMensual: 2800000000 },
          { mes: "2024-03", nuevasEmpresas: 3, inversionMensual: 4100000000 },
          { mes: "2024-04", nuevasEmpresas: 2, inversionMensual: 3600000000 },
          { mes: "2024-05", nuevasEmpresas: 4, inversionMensual: 5200000000 },
        ],
      }

      return {
        success: true,
        data: mockData,
      }
    } catch (error: any) {
      return {
        success: false,
        data: {} as SIRENEMarketAnalysis,
        error: error.message,
      }
    }
  }

  /**
   * Obtiene empresas competidoras en una zona específica
   */
  async getCompetitors(comuna: string, giro?: string): Promise<SIRENEResponse<SIRENECompany[]>> {
    try {
      // Simulación de empresas competidoras
      const mockData: SIRENECompany[] = [
        {
          rut: "76555666-7",
          razonSocial: "INMOBILIARIA COSTA AZUL LTDA",
          nombreFantasia: "Costa Azul Properties",
          giro: "ACTIVIDADES INMOBILIARIAS",
          fechaConstitucion: "2019-08-10",
          capital: 75000000,
          estado: "ACTIVA",
          tipoSociedad: "SOCIEDAD DE RESPONSABILIDAD LIMITADA",
          direccion: {
            calle: "Costanera",
            numero: "890",
            comuna: comuna,
            region: "Los Lagos",
          },
          representanteLegal: {
            nombre: "PATRICIA ELENA VARGAS MUÑOZ",
            rut: "13579246-8",
            cargo: "GERENTE GENERAL",
          },
          actividadEconomica: [
            {
              codigo: "681000",
              descripcion: "Actividades inmobiliarias",
              categoria: "INMOBILIARIA",
            },
          ],
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
   * Limpia formato de RUT
   */
  private cleanRUT(rut: string): string {
    return rut.replace(/[.-]/g, "").toUpperCase()
  }

  /**
   * Valida formato de RUT chileno
   */
  private validateRUT(rut: string): boolean {
    const cleanRUT = this.cleanRUT(rut)
    const rutRegex = /^[0-9]{7,8}[0-9K]$/
    return rutRegex.test(cleanRUT)
  }

  /**
   * Formatea RUT para mostrar
   */
  formatRUT(rut: string): string {
    const cleanRUT = this.cleanRUT(rut)
    if (cleanRUT.length < 8) return rut

    const body = cleanRUT.slice(0, -1)
    const dv = cleanRUT.slice(-1)

    return `${body.replace(/\B(?=(\d{3})+(?!\d))/g, ".")}-${dv}`
  }
}

// Instancia singleton del servicio
export const sireneService = new SIRENEService()
