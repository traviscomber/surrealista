interface ConnectionStatus {
  name: string
  status: "connected" | "disconnected" | "error"
  lastSync: string
  recordCount: number
  description: string
  icon: any
  color: string
}

interface MarketData {
  averagePrice: number
  transactions: number
  growth: number
  avgSaleTime: number
  regions: Array<{
    name: string
    properties: number
    avgPrice: number
    change: number
  }>
}

interface EconomicData {
  uf: number
  utm: number
  usd: number
  eur: number
  tpm: number
  mortgage: number
  commercial: number
  consumer: number
  inflation: number
  gdp: number
  unemployment: number
  imacec: number
}

class DataSourcesService {
  async getConnectionsStatus(): Promise<ConnectionStatus[]> {
    await new Promise((resolve) => setTimeout(resolve, 1000))

    const now = new Date()
    const randomMinutes = () => Math.floor(Math.random() * 60)

    return [
      {
        name: "Banco Central Chile",
        status: "connected",
        lastSync: new Date(now.getTime() - randomMinutes() * 60000).toISOString(),
        recordCount: 15420 + Math.floor(Math.random() * 100),
        description: "Indicadores económicos oficiales, UF, UTM, tasas de interés",
        icon: "Globe",
        color: "blue",
      },
      {
        name: "SII Chile",
        status: "connected",
        lastSync: new Date(now.getTime() - (2 * 60 + randomMinutes()) * 60000).toISOString(),
        recordCount: 89340 + Math.floor(Math.random() * 500),
        description: "Datos fiscales, avalúos, contribuciones y transacciones",
        icon: "Database",
        color: "green",
      },
      {
        name: "CIREN",
        status: "connected",
        lastSync: new Date(now.getTime() - (4 * 60 + randomMinutes()) * 60000).toISOString(),
        recordCount: 12580 + Math.floor(Math.random() * 200),
        description: "Centro de Información de Riesgos Empresariales - Análisis de riesgo con IA",
        icon: "Shield",
        color: "purple",
      },
      {
        name: "OpenStreetMap",
        status: "connected",
        lastSync: new Date(now.getTime() - (1 * 60 + randomMinutes()) * 60000).toISOString(),
        recordCount: 245680 + Math.floor(Math.random() * 1000),
        description: "Datos geográficos, amenidades y puntos de interés",
        icon: "MapPin",
        color: "orange",
      },
      {
        name: "Portal Inmobiliario",
        status: Math.random() > 0.3 ? "connected" : "disconnected",
        lastSync: new Date(now.getTime() - (24 * 60 + randomMinutes()) * 60000).toISOString(),
        recordCount: 45230 + Math.floor(Math.random() * 300),
        description: "Listados de propiedades y precios de mercado",
        icon: "Building2",
        color: "red",
      },
      {
        name: "INE Chile",
        status: Math.random() > 0.7 ? "connected" : "error",
        lastSync: new Date(now.getTime() - (48 * 60 + randomMinutes()) * 60000).toISOString(),
        recordCount: Math.random() > 0.7 ? Math.floor(Math.random() * 1000) : 0,
        description: "Estadísticas demográficas y censos",
        icon: "BarChart3",
        color: "gray",
      },
    ]
  }

  async getMarketData(): Promise<MarketData> {
    // Simular datos del mercado inmobiliario
    await new Promise((resolve) => setTimeout(resolve, 800))

    return {
      averagePrice: 3250,
      transactions: 1240,
      growth: 8.5,
      avgSaleTime: 85,
      regions: [
        {
          name: "Los Lagos",
          properties: 1580,
          avgPrice: 2890,
          change: 12.3,
        },
        {
          name: "La Araucanía",
          properties: 980,
          avgPrice: 2450,
          change: 9.8,
        },
        {
          name: "Los Ríos",
          properties: 720,
          avgPrice: 2680,
          change: 7.2,
        },
        {
          name: "Metropolitana",
          properties: 4250,
          avgPrice: 4120,
          change: 5.1,
        },
        {
          name: "Valparaíso",
          properties: 2180,
          avgPrice: 3580,
          change: 3.8,
        },
      ],
    }
  }

  async getEconomicIndicators(): Promise<EconomicData> {
    // Simular datos económicos con pequeñas variaciones para mostrar actualizaciones
    await new Promise((resolve) => setTimeout(resolve, 600))

    // Generar pequeñas variaciones aleatorias para simular datos en tiempo real
    const baseUF = 37290
    const baseUSD = 985
    const variation = () => Math.random() * 20 - 10 // ±10 variación

    return {
      uf: Math.round(baseUF + variation()),
      utm: Math.round(65967 + variation() * 2),
      usd: Math.round(baseUSD + variation()),
      eur: Math.round(1045 + variation()),
      tpm: Number((11.25 + (Math.random() * 0.5 - 0.25)).toFixed(2)),
      mortgage: Number((6.8 + (Math.random() * 0.3 - 0.15)).toFixed(1)),
      commercial: Number((8.5 + (Math.random() * 0.4 - 0.2)).toFixed(1)),
      consumer: Number((24.2 + (Math.random() * 1.0 - 0.5)).toFixed(1)),
      inflation: Number((3.8 + (Math.random() * 0.2 - 0.1)).toFixed(1)),
      gdp: Number((2.1 + (Math.random() * 0.3 - 0.15)).toFixed(1)),
      unemployment: Number((8.9 + (Math.random() * 0.5 - 0.25)).toFixed(1)),
      imacec: Number((1.8 + (Math.random() * 0.4 - 0.2)).toFixed(1)),
    }
  }

  async getRealEstateData(): Promise<MarketData> {
    // Reutilizar los datos de mercado
    return this.getMarketData()
  }

  async refreshConnection(connectionName: string): Promise<boolean> {
    // Simular refresh de conexión
    await new Promise((resolve) => setTimeout(resolve, 2000))
    return true
  }

  async testConnection(connectionName: string): Promise<boolean> {
    // Simular test de conexión
    await new Promise((resolve) => setTimeout(resolve, 1500))
    return Math.random() > 0.2 // 80% success rate
  }

  async getApiDocumentation(apiName: string): Promise<string> {
    const docs = {
      "Banco Central Chile": "https://si3.bcentral.cl/siete/secure/cuadros/home.aspx",
      "SII Chile": "https://www.sii.cl/servicios_online/",
      OpenStreetMap: "https://wiki.openstreetmap.org/wiki/API",
      CIREN: "https://ciren.cl/documentacion",
      "Portal Inmobiliario": "https://www.portalinmobiliario.com/api",
      "INE Chile": "https://www.ine.cl/estadisticas",
    }

    return docs[apiName as keyof typeof docs] || "#"
  }

  async updateCacheSettings(settings: any): Promise<boolean> {
    // Simular actualización de configuración
    await new Promise((resolve) => setTimeout(resolve, 1000))
    return true
  }

  async clearCache(): Promise<boolean> {
    // Simular limpieza de cache
    await new Promise((resolve) => setTimeout(resolve, 1500))
    return true
  }

  async getConnectionHistory(connectionName: string): Promise<
    Array<{
      timestamp: string
      status: string
      message: string
    }>
  > {
    // Simular historial de conexión
    await new Promise((resolve) => setTimeout(resolve, 800))

    return [
      {
        timestamp: new Date().toISOString(),
        status: "success",
        message: "Conexión exitosa - 1,240 registros actualizados",
      },
      {
        timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
        status: "success",
        message: "Sincronización automática completada",
      },
      {
        timestamp: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(),
        status: "warning",
        message: "Respuesta lenta del servidor (5.2s)",
      },
      {
        timestamp: new Date(Date.now() - 18 * 60 * 60 * 1000).toISOString(),
        status: "success",
        message: "Conexión exitosa - 980 registros actualizados",
      },
    ]
  }
}

export const dataSourcesService = new DataSourcesService()
