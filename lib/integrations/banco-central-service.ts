/**
 * Servicio para integración con Banco Central de Chile
 */

export interface BCIndicator {
  codigo: string
  nombre: string
  unidad: string
  fecha: string
  valor: number
}

export interface BCHistoricalData {
  indicator: string
  period: string
  data: Array<{
    fecha: string
    valor: number
  }>
}

export class BancoCentralService {
  private baseUrl = "https://si3.bcentral.cl/SieteRestWS/SieteRestWS.ashx"
  private apiKey = "demo_bc_key_2024"

  async getCurrentIndicators(): Promise<BCIndicator[]> {
    // Simulación de indicadores actuales
    const today = new Date().toISOString().split("T")[0]

    return [
      {
        codigo: "UF",
        nombre: "Unidad de Fomento",
        unidad: "Pesos",
        fecha: today,
        valor: 37284.52,
      },
      {
        codigo: "UTM",
        nombre: "Unidad Tributaria Mensual",
        unidad: "Pesos",
        fecha: today,
        valor: 66777,
      },
      {
        codigo: "TPM",
        nombre: "Tasa de Política Monetaria",
        unidad: "Porcentaje",
        fecha: today,
        valor: 11.25,
      },
      {
        codigo: "DOLAR",
        nombre: "Dólar Observado",
        unidad: "Pesos",
        fecha: today,
        valor: 973.45,
      },
      {
        codigo: "EURO",
        nombre: "Euro",
        unidad: "Pesos",
        fecha: today,
        valor: 1045.23,
      },
    ]
  }

  async getHistoricalUF(months = 12): Promise<BCHistoricalData> {
    // Simulación de datos históricos de UF
    const data = []
    const currentDate = new Date()

    for (let i = months; i >= 0; i--) {
      const date = new Date(currentDate)
      date.setMonth(date.getMonth() - i)

      // Simulación de variación de UF
      const baseValue = 37000
      const variation = Math.sin(i * 0.5) * 500 + Math.random() * 200

      data.push({
        fecha: date.toISOString().split("T")[0],
        valor: baseValue + variation + i * 10, // Tendencia creciente
      })
    }

    return {
      indicator: "UF",
      period: `${months} meses`,
      data,
    }
  }

  async convertToUF(pesoAmount: number): Promise<number> {
    const indicators = await this.getCurrentIndicators()
    const uf = indicators.find((i) => i.codigo === "UF")
    return uf ? Math.round((pesoAmount / uf.valor) * 100) / 100 : 0
  }

  async convertFromUF(ufAmount: number): Promise<number> {
    const indicators = await this.getCurrentIndicators()
    const uf = indicators.find((i) => i.codigo === "UF")
    return uf ? Math.round(ufAmount * uf.valor) : 0
  }
}

export const bancoCentralService = new BancoCentralService()
