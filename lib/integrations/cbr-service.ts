/**
 * Servicio para integración con Conservador de Bienes Raíces
 */

export interface CBRProperty {
  rolAvaluo: string
  inscripcionDominio: {
    fojas: number
    numero: number
    ano: number
    conservador: string
    fechaInscripcion: string
  }
  propietarios: Array<{
    rut: string
    nombre: string
    porcentajeDerecho: number
    estadoCivil?: string
    regimen?: string
  }>
  gravamenes: Array<{
    tipo: "HIPOTECA" | "USUFRUCTO" | "SERVIDUMBRE" | "PROHIBICION"
    acreedor?: string
    monto?: number
    fechaInscripcion: string
    vigente: boolean
  }>
  historialDominio: Array<{
    fechaInscripcion: string
    propietarioAnterior: string
    propietarioNuevo: string
    tipoTransferencia: string
    monto?: number
  }>
}

export class CBRService {
  private baseUrl = "https://demo.cbr.cl/api/v1"
  private apiKey = "demo_cbr_key_2024"

  async getPropertyHistory(rolAvaluo: string): Promise<CBRProperty> {
    // Simulación de datos del CBR
    return {
      rolAvaluo,
      inscripcionDominio: {
        fojas: 1250,
        numero: 890,
        ano: 2023,
        conservador: "CONSERVADOR PUERTO VARAS",
        fechaInscripcion: "2023-08-15",
      },
      propietarios: [
        {
          rut: "12345678-9",
          nombre: "CARLOS EDUARDO MARTINEZ SILVA",
          porcentajeDerecho: 60,
          estadoCivil: "CASADO",
          regimen: "SOCIEDAD CONYUGAL",
        },
        {
          rut: "98765432-1",
          nombre: "MARIA TERESA GONZALEZ LOPEZ",
          porcentajeDerecho: 40,
          estadoCivil: "CASADA",
          regimen: "SOCIEDAD CONYUGAL",
        },
      ],
      gravamenes: [
        {
          tipo: "HIPOTECA",
          acreedor: "BANCO DE CHILE",
          monto: 150000000,
          fechaInscripcion: "2023-08-15",
          vigente: true,
        },
      ],
      historialDominio: [
        {
          fechaInscripcion: "2023-08-15",
          propietarioAnterior: "INMOBILIARIA PATAGONIA SPA",
          propietarioNuevo: "CARLOS MARTINEZ Y MARIA GONZALEZ",
          tipoTransferencia: "COMPRAVENTA",
          monto: 280000000,
        },
        {
          fechaInscripcion: "2020-03-15",
          propietarioAnterior: "CONSTRUCTORA DEL SUR LTDA",
          propietarioNuevo: "INMOBILIARIA PATAGONIA SPA",
          tipoTransferencia: "COMPRAVENTA",
          monto: 220000000,
        },
      ],
    }
  }
}

export const cbrService = new CBRService()
