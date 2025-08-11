import { NextResponse } from "next/server"
import { analyzeSIISIRENEData, generateMarketReport } from "@/lib/ai/integrations/sii-sirene-analyzer"

export async function POST(request: Request) {
  try {
    const { rolAvaluo, comuna, propertyData } = await request.json()

    if (!rolAvaluo) {
      return NextResponse.json({ error: "Rol de avalúo es requerido" }, { status: 400 })
    }

    // En una implementación real, aquí se harían las consultas a las APIs del SII y SIRENE
    // Por ahora, simulamos los datos
    const siiData = {
      avaluoFiscal: 285000000,
      contribuciones: 2850000,
      superficieConstruida: 180,
      superficieTerreno: 500,
      anoConstruction: 2018,
      comuna: comuna || "Puerto Varas",
      rolAvaluo,
      destinoInmueble: "Habitacional",
      transacciones: [
        { fecha: "2024-01-15", precio: 310000000, tipo: "venta" },
        { fecha: "2024-03-22", precio: 295000000, tipo: "venta" },
        { fecha: "2024-05-10", precio: 320000000, tipo: "venta" },
      ],
    }

    const sireneData = {
      empresasInmobiliarias: [
        { nombre: "Inmobiliaria Sur", rut: "12345678-9", ventasAnuales: 50, proyectosActivos: 3 },
        { nombre: "Propiedades Lagos", rut: "87654321-0", ventasAnuales: 35, proyectosActivos: 2 },
      ],
      permisosConstruction: [
        { comuna: "Puerto Varas", cantidad: 15, metrosCuadrados: 12000, valorProyecto: 8500000000 },
      ],
      inversionSector: [{ ano: 2024, montoTotal: 25000000000, proyectos: 45 }],
    }

    // Analizar con IA
    const analysis = await analyzeSIISIRENEData(siiData, sireneData, propertyData)

    // Generar reporte
    const report = await generateMarketReport(siiData, sireneData, propertyData)

    return NextResponse.json({
      success: true,
      data: {
        siiData,
        sireneData,
        analysis,
        report,
      },
    })
  } catch (error: any) {
    console.error("Error in SII integration:", error)
    return NextResponse.json({ error: error.message || "Error al procesar datos SII/SIRENE" }, { status: 500 })
  }
}
