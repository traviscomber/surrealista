'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

export function SalesHeatmap() {
  // Mock data - Densidad de ventas por región
  const regionsData = [
    { region: 'Santiago Centro', sales: 45, color: 'bg-red-600' },
    { region: 'Las Condes', sales: 38, color: 'bg-orange-500' },
    { region: 'Providencia', sales: 32, color: 'bg-orange-400' },
    { region: 'Vitacura', sales: 28, color: 'bg-amber-400' },
    { region: 'La Florida', sales: 22, color: 'bg-yellow-300' },
    { region: 'Ñuñoa', sales: 18, color: 'bg-yellow-200' },
    { region: 'Recoleta', sales: 12, color: 'bg-blue-300' },
    { region: 'Puente Alto', sales: 8, color: 'bg-blue-200' },
  ]

  const getIntensity = (value: number, max: number) => {
    const intensity = (value / max) * 100
    if (intensity >= 80) return 'rgba(220, 38, 38, 0.8)'
    if (intensity >= 60) return 'rgba(249, 115, 22, 0.8)'
    if (intensity >= 40) return 'rgba(250, 204, 21, 0.8)'
    if (intensity >= 20) return 'rgba(96, 165, 250, 0.8)'
    return 'rgba(147, 197, 253, 0.6)'
  }

  const maxSales = Math.max(...regionsData.map((r) => r.sales))

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Heatmap de Densidad de Ventas</span>
            <Badge variant="secondary">Actualizado en tiempo real</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {regionsData.map((item) => {
              const intensity = (item.sales / maxSales) * 100
              return (
                <div
                  key={item.region}
                  className="p-4 rounded-lg border-2 transition-all hover:shadow-lg cursor-pointer"
                  style={{
                    backgroundColor: getIntensity(item.sales, maxSales),
                    borderColor: 'rgba(200, 200, 200, 0.3)',
                  }}
                >
                  <div className="text-white font-semibold text-sm">{item.region}</div>
                  <div className="text-white text-2xl font-bold mt-2">{item.sales}</div>
                  <div className="text-white text-xs mt-2 opacity-90">ventas en 30 días</div>
                  <div className="mt-3 bg-white bg-opacity-20 rounded h-2">
                    <div
                      className="bg-white h-2 rounded"
                      style={{ width: `${intensity}%` }}
                    ></div>
                  </div>
                </div>
              )
            })}
          </div>

          <div className="mt-8 p-4 bg-gray-50 rounded-lg">
            <h3 className="font-semibold mb-4">Leyenda de Intensidad</h3>
            <div className="grid grid-cols-5 gap-3">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded bg-red-600"></div>
                <span className="text-xs">Muy Alto (80%+)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded bg-orange-500"></div>
                <span className="text-xs">Alto (60-80%)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded bg-yellow-300"></div>
                <span className="text-xs">Medio (40-60%)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded bg-blue-300"></div>
                <span className="text-xs">Bajo (20-40%)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded bg-blue-200"></div>
                <span className="text-xs">Muy Bajo (&lt;20%)</span>
              </div>
            </div>
          </div>

          <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
              <div className="text-2xl font-bold text-blue-600">{regionsData.reduce((sum, r) => sum + r.sales, 0)}</div>
              <div className="text-sm text-blue-600 mt-1">Ventas Totales (30 días)</div>
            </div>
            <div className="p-4 bg-green-50 rounded-lg border border-green-200">
              <div className="text-2xl font-bold text-green-600">{maxSales}</div>
              <div className="text-sm text-green-600 mt-1">Región con Mayor Actividad</div>
            </div>
            <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
              <div className="text-2xl font-bold text-purple-600">{regionsData.length}</div>
              <div className="text-sm text-purple-600 mt-1">Regiones Monitoreadas</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
