import type { CirenCompany, CirenSearchParams, CirenFinancialData, CirenRiskAnalysis } from "./types"

// Expanded demo data with more realistic Chilean companies
const DEMO_COMPANIES: CirenCompany[] = [
  {
    rut: "96.789.123-4",
    razonSocial: "Inmobiliaria Patagonia Properties SpA",
    nombreFantasia: "Patagonia Properties",
    actividadEconomica: "Actividades inmobiliarias realizadas con bienes propios o arrendados",
    fechaConstitucion: "2018-03-15",
    capital: 500000000,
    estado: "Activa",
    region: "Los Lagos",
    comuna: "Puerto Varas",
    direccion: "Av. Vicente Pérez Rosales 1234, Puerto Varas",
    telefono: "+56 65 2234567",
    email: "contacto@patagoniaproperties.cl",
    scoring: 85,
    categoria: "A",
    ultimaActualizacion: "2024-01-15",
  },
  {
    rut: "76.543.210-9",
    razonSocial: "Constructora Volcanes del Sur Ltda",
    nombreFantasia: "Volcanes Sur",
    actividadEconomica: "Construcción de edificios residenciales",
    fechaConstitucion: "2020-07-22",
    capital: 800000000,
    estado: "Activa",
    region: "La Araucanía",
    comuna: "Pucón",
    direccion: "Camino Pucón-Villarrica Km 5, Pucón",
    telefono: "+56 45 2445678",
    email: "info@volcanessur.cl",
    scoring: 92,
    categoria: "A+",
    ultimaActualizacion: "2024-01-20",
  },
  {
    rut: "89.012.345-6",
    razonSocial: "Inmobiliaria Llanquihue Properties SA",
    nombreFantasia: "Llanquihue Properties",
    actividadEconomica: "Actividades inmobiliarias realizadas con bienes propios o arrendados",
    fechaConstitucion: "2019-11-08",
    capital: 350000000,
    estado: "Activa",
    region: "Los Lagos",
    comuna: "Frutillar",
    direccion: "Av. Philippi 567, Frutillar",
    telefono: "+56 65 2421234",
    email: "ventas@llanquihueproperties.cl",
    scoring: 78,
    categoria: "B+",
    ultimaActualizacion: "2024-01-18",
  },
  {
    rut: "65.432.109-8",
    razonSocial: "Desarrollos Inmobiliarios Frutillar Premium SpA",
    nombreFantasia: "Frutillar Premium",
    actividadEconomica: "Promoción inmobiliaria",
    fechaConstitucion: "2021-02-14",
    capital: 1200000000,
    estado: "Activa",
    region: "Los Lagos",
    comuna: "Frutillar",
    direccion: "Costanera Philippi 890, Frutillar",
    telefono: "+56 65 2445789",
    email: "contacto@frutillarpremium.cl",
    scoring: 88,
    categoria: "A",
    ultimaActualizacion: "2024-01-22",
  },
  {
    rut: "54.321.098-7",
    razonSocial: "Inmobiliaria Valdivia Premium Ltda",
    nombreFantasia: "Valdivia Premium",
    actividadEconomica: "Actividades inmobiliarias realizadas con bienes propios o arrendados",
    fechaConstitucion: "2017-09-30",
    capital: 600000000,
    estado: "Activa",
    region: "Los Ríos",
    comuna: "Valdivia",
    direccion: "Av. Ramón Picarte 1456, Valdivia",
    telefono: "+56 63 2234890",
    email: "info@valdiviapremium.cl",
    scoring: 82,
    categoria: "A-",
    ultimaActualizacion: "2024-01-19",
  },
  {
    rut: "43.210.987-6",
    razonSocial: "Constructora Sur Desarrollos SA",
    nombreFantasia: "Sur Desarrollos",
    actividadEconomica: "Construcción de edificios no residenciales",
    fechaConstitucion: "2016-05-12",
    capital: 900000000,
    estado: "Activa",
    region: "Los Lagos",
    comuna: "Osorno",
    direccion: "Av. Bernardo O'Higgins 2345, Osorno",
    telefono: "+56 64 2567890",
    email: "proyectos@surdesarrollos.cl",
    scoring: 90,
    categoria: "A+",
    ultimaActualizacion: "2024-01-21",
  },
  {
    rut: "32.109.876-5",
    razonSocial: "Inmobiliaria Pucón Aventura SpA",
    nombreFantasia: "Pucón Aventura",
    actividadEconomica: "Actividades inmobiliarias realizadas con bienes propios o arrendados",
    fechaConstitucion: "2022-01-10",
    capital: 400000000,
    estado: "Activa",
    region: "La Araucanía",
    comuna: "Pucón",
    direccion: "Av. Bernardo O'Higgins 789, Pucón",
    telefono: "+56 45 2443210",
    email: "ventas@puconaventura.cl",
    scoring: 75,
    categoria: "B+",
    ultimaActualizacion: "2024-01-17",
  },
  {
    rut: "21.098.765-4",
    razonSocial: "Constructora Lago Azul Ltda",
    nombreFantasia: "Lago Azul",
    actividadEconomica: "Construcción de edificios residenciales",
    fechaConstitucion: "2019-08-25",
    capital: 700000000,
    estado: "Activa",
    region: "Los Lagos",
    comuna: "Puerto Varas",
    direccion: "Costanera del Lago 456, Puerto Varas",
    telefono: "+56 65 2234567",
    email: "construccion@lagoazul.cl",
    scoring: 86,
    categoria: "A",
    ultimaActualizacion: "2024-01-16",
  },
  {
    rut: "10.987.654-3",
    razonSocial: "Desarrollos Andes Patagonia SA",
    nombreFantasia: "Andes Patagonia",
    actividadEconomica: "Promoción inmobiliaria",
    fechaConstitucion: "2020-12-03",
    capital: 1500000000,
    estado: "Activa",
    region: "Los Lagos",
    comuna: "Puerto Montt",
    direccion: "Av. Angelmó 1234, Puerto Montt",
    telefono: "+56 65 2567891",
    email: "desarrollo@andespatagonia.cl",
    scoring: 94,
    categoria: "A+",
    ultimaActualizacion: "2024-01-23",
  },
  {
    rut: "98.765.432-1",
    razonSocial: "Constructora Volcán SpA",
    nombreFantasia: "Volcán Construcciones",
    actividadEconomica: "Construcción de edificios residenciales",
    fechaConstitucion: "2018-06-18",
    capital: 650000000,
    estado: "Activa",
    region: "La Araucanía",
    comuna: "Temuco",
    direccion: "Av. Alemania 2890, Temuco",
    telefono: "+56 45 2789012",
    email: "obras@volcanconstrucciones.cl",
    scoring: 83,
    categoria: "A-",
    ultimaActualizacion: "2024-01-14",
  },
  {
    rut: "87.654.321-0",
    razonSocial: "Inmobiliaria Crisis Desarrollos Ltda",
    nombreFantasia: "Crisis Desarrollos",
    actividadEconomica: "Actividades inmobiliarias realizadas con bienes propios o arrendados",
    fechaConstitucion: "2015-04-20",
    capital: 200000000,
    estado: "Inactiva",
    region: "Los Lagos",
    comuna: "Castro",
    direccion: "Calle Esmeralda 123, Castro",
    telefono: "+56 65 2123456",
    email: "contacto@crisisdesarrollos.cl",
    scoring: 45,
    categoria: "D",
    ultimaActualizacion: "2024-01-10",
  },
  {
    rut: "76.543.210-K",
    razonSocial: "Constructora en Liquidación SA",
    nombreFantasia: "Constructora Liquidación",
    actividadEconomica: "Construcción de edificios residenciales",
    fechaConstitucion: "2016-11-15",
    capital: 300000000,
    estado: "En Liquidación",
    region: "Los Ríos",
    comuna: "La Unión",
    direccion: "Av. Fuentes 567, La Unión",
    telefono: "+56 63 2345678",
    email: "liquidacion@constructoraliquidacion.cl",
    scoring: 25,
    categoria: "E",
    ultimaActualizacion: "2024-01-05",
  },
]

// Company name generators for random data
const COMPANY_PREFIXES = [
  "Inmobiliaria",
  "Constructora",
  "Desarrollos",
  "Inversiones",
  "Propiedades",
  "Edificaciones",
  "Proyectos",
  "Habitacional",
  "Residencial",
  "Comercial",
]

const COMPANY_SUFFIXES = [
  "del Sur",
  "Patagonia",
  "Andina",
  "Lagos",
  "Volcanes",
  "Bosques",
  "Ríos",
  "Premium",
  "Elite",
  "Austral",
  "Cordillera",
  "Majestic",
  "Imperial",
  "Real",
]

const REGIONS = ["Los Lagos", "Los Ríos", "La Araucanía", "Biobío", "Maule", "O'Higgins"]

const COMUNAS_BY_REGION: Record<string, string[]> = {
  "Los Lagos": ["Puerto Varas", "Puerto Montt", "Osorno", "Frutillar", "Castro", "Ancud"],
  "Los Ríos": ["Valdivia", "La Unión", "Río Bueno", "Panguipulli"],
  "La Araucanía": ["Temuco", "Pucón", "Villarrica", "Angol", "Victoria"],
  Biobío: ["Concepción", "Talcahuano", "Chillán", "Los Ángeles"],
  Maule: ["Talca", "Curicó", "Linares", "Constitución"],
  "O'Higgins": ["Rancagua", "San Fernando", "Pichilemu", "Santa Cruz"],
}

let demoCompanies: CirenCompany[] = [...DEMO_COMPANIES]

export class CirenService {
  private _apiKey: string
  private _baseUrl: string

  constructor() {
    this._apiKey = ""
    this._baseUrl = ""
  }

  get apiKey() {
    return this._apiKey
  }

  async searchCompanies(params: CirenSearchParams): Promise<CirenCompany[]> {
    return this.searchDemoCompanies(params)
  }

  private searchDemoCompanies(params: CirenSearchParams): CirenCompany[] {
    let results = demoCompanies

    if (params.rut) {
      results = results.filter((company) => company.rut.toLowerCase().includes(params.rut!.toLowerCase()))
    }

    if (params.razonSocial) {
      results = results.filter(
        (company) =>
          company.razonSocial.toLowerCase().includes(params.razonSocial!.toLowerCase()) ||
          company.nombreFantasia?.toLowerCase().includes(params.razonSocial!.toLowerCase()),
      )
    }

    if (params.region) {
      results = results.filter((company) => company.region.toLowerCase().includes(params.region!.toLowerCase()))
    }

    if (params.actividadEconomica) {
      results = results.filter((company) =>
        company.actividadEconomica.toLowerCase().includes(params.actividadEconomica!.toLowerCase()),
      )
    }

    return results.slice(0, params.limit || 10)
  }

  async getCompanyDetails(rut: string): Promise<CirenCompany | null> {
    return demoCompanies.find((company) => company.rut === rut) || null
  }

  async getFinancialData(rut: string): Promise<CirenFinancialData | null> {
    return this.generateDemoFinancialData(rut)
  }

  async getRiskAnalysis(rut: string): Promise<CirenRiskAnalysis | null> {
    return this.generateDemoRiskAnalysis(rut)
  }

  // Demo data management methods
  generateRandomCompanies(count = 5): CirenCompany[] {
    const newCompanies: CirenCompany[] = []

    for (let i = 0; i < count; i++) {
      const prefix = COMPANY_PREFIXES[Math.floor(Math.random() * COMPANY_PREFIXES.length)]
      const suffix = COMPANY_SUFFIXES[Math.floor(Math.random() * COMPANY_SUFFIXES.length)]
      const region = REGIONS[Math.floor(Math.random() * REGIONS.length)]
      const comunas = COMUNAS_BY_REGION[region]
      const comuna = comunas[Math.floor(Math.random() * comunas.length)]

      const rut = this.generateRandomRut()
      const razonSocial = `${prefix} ${suffix} ${Math.random() > 0.5 ? "SpA" : "Ltda"}`
      const nombreFantasia = `${suffix} ${prefix.split(" ")[0]}`

      const company: CirenCompany = {
        rut,
        razonSocial,
        nombreFantasia,
        actividadEconomica:
          Math.random() > 0.5
            ? "Actividades inmobiliarias realizadas con bienes propios o arrendados"
            : "Construcción de edificios residenciales",
        fechaConstitucion: this.generateRandomDate(),
        capital: Math.floor(Math.random() * 900000000) + 100000000,
        estado: Math.random() > 0.1 ? "Activa" : Math.random() > 0.5 ? "Inactiva" : "En Liquidación",
        region,
        comuna,
        direccion: `${this.generateRandomAddress()}, ${comuna}`,
        telefono: this.generateRandomPhone(region),
        email: `contacto@${nombreFantasia.toLowerCase().replace(/\s+/g, "")}.cl`,
        scoring: Math.floor(Math.random() * 75) + 25,
        categoria: this.generateCategory(Math.floor(Math.random() * 75) + 25),
        ultimaActualizacion: new Date().toISOString().split("T")[0],
      }

      newCompanies.push(company)
    }

    return newCompanies
  }

  addRandomCompaniesToDemo(count = 5): CirenCompany[] {
    const newCompanies = this.generateRandomCompanies(count)
    demoCompanies = [...demoCompanies, ...newCompanies]
    return newCompanies
  }

  addCompanyToDemo(company: Omit<CirenCompany, "ultimaActualizacion">): CirenCompany {
    const newCompany: CirenCompany = {
      ...company,
      ultimaActualizacion: new Date().toISOString().split("T")[0],
    }
    demoCompanies.push(newCompany)
    return newCompany
  }

  getAllDemoCompanies(): CirenCompany[] {
    return [...demoCompanies]
  }

  getDemoStats() {
    const total = demoCompanies.length
    const active = demoCompanies.filter((c) => c.estado === "Activa").length
    const inmobiliarias = demoCompanies.filter(
      (c) =>
        c.razonSocial.toLowerCase().includes("inmobiliaria") ||
        c.actividadEconomica.toLowerCase().includes("inmobiliaria"),
    ).length

    return { total, active, inmobiliarias }
  }

  loadBaseDemoData(): void {
    demoCompanies = [...DEMO_COMPANIES]
  }

  clearDemoData(): void {
    demoCompanies = []
  }

  exportDemoData(): string {
    return JSON.stringify(demoCompanies, null, 2)
  }

  private generateRandomRut(): string {
    const num = Math.floor(Math.random() * 90000000) + 10000000
    const dv = this.calculateRutDV(num)
    return `${num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".")}-${dv}`
  }

  private calculateRutDV(rut: number): string {
    let sum = 0
    let multiplier = 2

    while (rut > 0) {
      sum += (rut % 10) * multiplier
      rut = Math.floor(rut / 10)
      multiplier = multiplier === 7 ? 2 : multiplier + 1
    }

    const remainder = sum % 11
    const dv = 11 - remainder

    if (dv === 11) return "0"
    if (dv === 10) return "K"
    return dv.toString()
  }

  private generateRandomDate(): string {
    const start = new Date(2015, 0, 1)
    const end = new Date(2024, 11, 31)
    const date = new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()))
    return date.toISOString().split("T")[0]
  }

  private generateRandomAddress(): string {
    const streets = [
      "Av. Bernardo O'Higgins",
      "Costanera",
      "Av. Vicente Pérez Rosales",
      "Calle Esmeralda",
      "Av. Alemania",
      "Camino Rural",
    ]
    const street = streets[Math.floor(Math.random() * streets.length)]
    const number = Math.floor(Math.random() * 3000) + 100
    return `${street} ${number}`
  }

  private generateRandomPhone(region: string): string {
    const areaCodes: Record<string, string> = {
      "Los Lagos": "65",
      "Los Ríos": "63",
      "La Araucanía": "45",
      Biobío: "41",
      Maule: "71",
      "O'Higgins": "72",
    }
    const areaCode = areaCodes[region] || "65"
    const number = Math.floor(Math.random() * 9000000) + 1000000
    return `+56 ${areaCode} 2${number.toString().substring(0, 6)}`
  }

  private generateCategory(scoring: number): string {
    if (scoring >= 90) return "A+"
    if (scoring >= 80) return "A"
    if (scoring >= 70) return "A-"
    if (scoring >= 60) return "B+"
    if (scoring >= 50) return "B"
    if (scoring >= 40) return "B-"
    if (scoring >= 30) return "C"
    return "D"
  }

  private generateDemoFinancialData(rut: string): CirenFinancialData {
    const company = demoCompanies.find((c) => c.rut === rut)
    const baseRevenue = company ? company.capital * 0.3 : 100000000

    return {
      rut,
      ingresosTotales: Math.floor(baseRevenue + (Math.random() - 0.5) * baseRevenue * 0.4),
      patrimonio: Math.floor(baseRevenue * 1.5 + (Math.random() - 0.5) * baseRevenue * 0.3),
      deudaTotal: Math.floor(baseRevenue * 0.6 + (Math.random() - 0.5) * baseRevenue * 0.4),
      liquidez: Math.random() * 2 + 0.5,
      rentabilidad: (Math.random() - 0.3) * 0.4,
      endeudamiento: Math.random() * 0.8 + 0.1,
      periodo: "2023",
      fechaActualizacion: new Date().toISOString().split("T")[0],
    }
  }

  private generateDemoRiskAnalysis(rut: string): CirenRiskAnalysis {
    const company = demoCompanies.find((c) => c.rut === rut)
    const scoring = company?.scoring || 50

    return {
      rut,
      nivelRiesgo: scoring >= 70 ? "Bajo" : scoring >= 50 ? "Medio" : "Alto",
      probabilidadDefault:
        scoring >= 70 ? Math.random() * 0.05 : scoring >= 50 ? Math.random() * 0.15 + 0.05 : Math.random() * 0.3 + 0.15,
      recomendacion: scoring >= 70 ? "Aprobado" : scoring >= 50 ? "Revisar" : "Rechazar",
      factoresRiesgo: this.generateRiskFactors(scoring),
      fechaAnalisis: new Date().toISOString().split("T")[0],
    }
  }

  private generateRiskFactors(scoring: number): string[] {
    const allFactors = [
      "Historial crediticio positivo",
      "Flujo de caja estable",
      "Diversificación de ingresos",
      "Experiencia en el sector",
      "Ubicación estratégica",
      "Morosidad en pagos",
      "Alta concentración de clientes",
      "Sector económico volátil",
      "Falta de garantías",
      "Problemas de liquidez",
    ]

    const positiveFactors = allFactors.slice(0, 5)
    const negativeFactors = allFactors.slice(5)

    const factors: string[] = []

    if (scoring >= 70) {
      // Mostly positive factors
      factors.push(...positiveFactors.slice(0, 3))
      if (Math.random() > 0.7) factors.push(negativeFactors[Math.floor(Math.random() * negativeFactors.length)])
    } else if (scoring >= 50) {
      // Mixed factors
      factors.push(...positiveFactors.slice(0, 2))
      factors.push(...negativeFactors.slice(0, 2))
    } else {
      // Mostly negative factors
      factors.push(...negativeFactors.slice(0, 3))
      if (Math.random() > 0.7) factors.push(positiveFactors[Math.floor(Math.random() * positiveFactors.length)])
    }

    return factors
  }
}

export const cirenService = new CirenService()
