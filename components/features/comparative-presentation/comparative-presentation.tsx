'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Download, FileText, Plus, Trash2, Eye } from 'lucide-react'

interface Property {
  id: string
  title: string
  location: string
  hectares: number
  price: number
  features: {
    water: boolean
    road: boolean
    electricity: boolean
    house: boolean
  }
  description: string
}

export function ComparativePresentation() {
  const [selectedProperties, setSelectedProperties] = useState<string[]>([])
  const [properties] = useState<Property[]>([
    {
      id: '1',
      title: 'Fundo Los Boldos',
      location: 'Curicó, Región del Maule',
      hectares: 32,
      price: 7200,
      features: { water: true, road: true, electricity: true, house: true },
      description: 'Campo forestal con riego permanente de canal',
    },
    {
      id: '2',
      title: 'Parcela San José',
      location: 'Linares, Región del Maule',
      hectares: 45,
      price: 7950,
      features: { water: true, road: true, electricity: true, house: false },
      description: 'Terreno agrícola con acceso a camino público',
    },
    {
      id: '3',
      title: 'Hacienda El Roble',
      location: 'Talca, Región del Maule',
      hectares: 28,
      price: 6800,
      features: { water: false, road: true, electricity: true, house: true },
      description: 'Propiedad con vivienda principal e infraestructura completa',
    },
  ])

  const toggleProperty = (id: string) => {
    setSelectedProperties((prev) =>
      prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]
    )
  }

  const selectedData = properties.filter((p) => selectedProperties.includes(p.id))

  const generateComparison = () => {
    if (selectedData.length === 0) return

    const comparisonHTML = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>Comparativa de Propiedades - Sur Realista</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 20px; background: #f5f5f5; }
          .header { text-align: center; margin-bottom: 30px; }
          .logo { font-size: 28px; font-weight: bold; color: #2563eb; }
          .comparison-table { width: 100%; border-collapse: collapse; background: white; margin-bottom: 30px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
          .comparison-table td { padding: 15px; border-bottom: 1px solid #e5e7eb; }
          .comparison-table th { background: #2563eb; color: white; padding: 15px; text-align: left; }
          .property-name { font-weight: bold; font-size: 16px; color: #1e40af; }
          .feature-yes { color: #16a34a; font-weight: bold; }
          .feature-no { color: #dc2626; }
          .price-cell { font-size: 18px; font-weight: bold; color: #2563eb; }
          .price-per-ha { font-size: 12px; color: #666; }
          .recommendation { background: #dbeafe; padding: 15px; border-left: 4px solid #2563eb; margin-top: 20px; }
          .footer { text-align: center; margin-top: 30px; font-size: 12px; color: #666; }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="logo">Sur Realista</div>
          <h1>Análisis Comparativo de Propiedades</h1>
          <p>Fecha: ${new Date().toLocaleDateString('es-CL')}</p>
        </div>

        <table class="comparison-table">
          <thead>
            <tr>
              <th>Propiedad</th>
              ${selectedData.map((p) => `<th>${p.title}</th>`).join('')}
            </tr>
          </thead>
          <tbody>
            <tr>
              <td><strong>Ubicación</strong></td>
              ${selectedData.map((p) => `<td>${p.location}</td>`).join('')}
            </tr>
            <tr>
              <td><strong>Hectáreas</strong></td>
              ${selectedData.map((p) => `<td>${p.hectares} ha</td>`).join('')}
            </tr>
            <tr>
              <td><strong>Precio Total</strong></td>
              ${selectedData.map((p) => `<td class="price-cell">UF ${p.price.toLocaleString()}</td>`).join('')}
            </tr>
            <tr>
              <td><strong>Precio/Hectárea</strong></td>
              ${selectedData.map((p) => `<td class="price-cell">${(p.price / p.hectares).toFixed(0)} UF/ha</td>`).join('')}
            </tr>
            <tr>
              <td><strong>Acceso a Agua</strong></td>
              ${selectedData.map((p) => `<td class="${p.features.water ? 'feature-yes' : 'feature-no'}">${p.features.water ? '✓ Sí' : '✗ No'}</td>`).join('')}
            </tr>
            <tr>
              <td><strong>Acceso a Camino</strong></td>
              ${selectedData.map((p) => `<td class="${p.features.road ? 'feature-yes' : 'feature-no'}">${p.features.road ? '✓ Sí' : '✗ No'}</td>`).join('')}
            </tr>
            <tr>
              <td><strong>Electricidad</strong></td>
              ${selectedData.map((p) => `<td class="${p.features.electricity ? 'feature-yes' : 'feature-no'}">${p.features.electricity ? '✓ Sí' : '✗ No'}</td>`).join('')}
            </tr>
            <tr>
              <td><strong>Vivienda</strong></td>
              ${selectedData.map((p) => `<td class="${p.features.house ? 'feature-yes' : 'feature-no'}">${p.features.house ? '✓ Sí' : '✗ No'}</td>`).join('')}
            </tr>
            <tr>
              <td><strong>Descripción</strong></td>
              ${selectedData.map((p) => `<td>${p.description}</td>`).join('')}
            </tr>
          </tbody>
        </table>

        <div class="recommendation">
          <h3>Análisis y Recomendación</h3>
          ${selectedData.length >= 2
            ? `
            <p><strong>Mejor Relación Precio/Hectárea:</strong> 
            ${selectedData.reduce((min, p) => (p.price / p.hectares < min.price / min.hectares ? p : min)).title} 
            (${(selectedData.reduce((min, p) => (p.price / p.hectares < min.price / min.hectares ? p : min)).price / selectedData.reduce((min, p) => (p.price / p.hectares < min.price / min.hectares ? p : min)).hectares).toFixed(0)} UF/ha)
            </p>
            <p><strong>Mejor Infraestructura:</strong> 
            ${selectedData.reduce((max, p) => (Object.values(p.features).filter(Boolean).length > Object.values(max.features).filter(Boolean).length ? p : max)).title}
            </p>
            `
            : '<p>Selecciona al menos 2 propiedades para análisis comparativo.</p>'
          }
        </div>

        <div class="footer">
          <p>Este documento es confidencial y preparado por Sur Realista para propósitos informativos.</p>
          <p>Para más información, contacta a tu asesor inmobiliario.</p>
        </div>
      </body>
      </html>
    `

    const blob = new Blob([comparisonHTML], { type: 'text/html' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `comparativa-propiedades-${Date.now()}.html`
    a.click()
    window.URL.revokeObjectURL(url)
  }

  return (
    <div className="space-y-6 p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-slate-900">Presentaciones Comparativas</h1>
        <p className="text-slate-600 mt-2">Compara hasta 3 propiedades lado a lado</p>
      </div>

      {/* Property Selection */}
      <Card>
        <CardHeader>
          <CardTitle>Selecciona Propiedades a Comparar</CardTitle>
          <CardDescription>Elige 2 o 3 propiedades para generar análisis comparativo</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {properties.map((property) => (
              <div
                key={property.id}
                className="flex items-start gap-3 p-4 border rounded-lg hover:bg-slate-50 cursor-pointer"
                onClick={() => toggleProperty(property.id)}
              >
                <Checkbox
                  checked={selectedProperties.includes(property.id)}
                  onCheckedChange={() => toggleProperty(property.id)}
                  disabled={selectedProperties.length >= 3 && !selectedProperties.includes(property.id)}
                />
                <div className="flex-1">
                  <p className="font-semibold text-slate-900">{property.title}</p>
                  <p className="text-sm text-slate-600">{property.location}</p>
                  <div className="mt-2 flex gap-2 flex-wrap">
                    <Badge variant="outline">{property.hectares} ha</Badge>
                    <Badge variant="outline">UF {property.price.toLocaleString()}</Badge>
                    <Badge variant="outline">{(property.price / property.hectares).toFixed(0)} UF/ha</Badge>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-blue-600">UF {property.price.toLocaleString()}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Comparison Preview */}
      {selectedData.length >= 2 && (
        <Card className="border-blue-200 bg-blue-50">
          <CardHeader>
            <CardTitle>Previsualización Comparativa</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b-2 border-blue-300">
                    <th className="text-left py-2 px-2">Característica</th>
                    {selectedData.map((p) => (
                      <th key={p.id} className="text-center py-2 px-2">
                        {p.title}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b">
                    <td className="py-2 px-2 font-semibold">Ubicación</td>
                    {selectedData.map((p) => (
                      <td key={p.id} className="text-center py-2 px-2 text-xs">
                        {p.location}
                      </td>
                    ))}
                  </tr>
                  <tr className="border-b">
                    <td className="py-2 px-2 font-semibold">Hectáreas</td>
                    {selectedData.map((p) => (
                      <td key={p.id} className="text-center py-2 px-2">
                        {p.hectares}
                      </td>
                    ))}
                  </tr>
                  <tr className="border-b">
                    <td className="py-2 px-2 font-semibold">Precio Total</td>
                    {selectedData.map((p) => (
                      <td key={p.id} className="text-center py-2 px-2 font-bold text-blue-600">
                        UF {p.price.toLocaleString()}
                      </td>
                    ))}
                  </tr>
                  <tr className="border-b">
                    <td className="py-2 px-2 font-semibold">Precio/ha</td>
                    {selectedData.map((p) => (
                      <td key={p.id} className="text-center py-2 px-2 font-bold">
                        {(p.price / p.hectares).toFixed(0)} UF/ha
                      </td>
                    ))}
                  </tr>
                  <tr className="border-b bg-blue-100">
                    <td className="py-2 px-2 font-semibold">Agua</td>
                    {selectedData.map((p) => (
                      <td key={p.id} className="text-center py-2 px-2">
                        <span className={p.features.water ? 'text-green-600 font-bold' : 'text-red-600'}>
                          {p.features.water ? '✓' : '✗'}
                        </span>
                      </td>
                    ))}
                  </tr>
                  <tr className="border-b">
                    <td className="py-2 px-2 font-semibold">Camino</td>
                    {selectedData.map((p) => (
                      <td key={p.id} className="text-center py-2 px-2">
                        <span className={p.features.road ? 'text-green-600 font-bold' : 'text-red-600'}>
                          {p.features.road ? '✓' : '✗'}
                        </span>
                      </td>
                    ))}
                  </tr>
                  <tr className="border-b bg-blue-100">
                    <td className="py-2 px-2 font-semibold">Electricidad</td>
                    {selectedData.map((p) => (
                      <td key={p.id} className="text-center py-2 px-2">
                        <span className={p.features.electricity ? 'text-green-600 font-bold' : 'text-red-600'}>
                          {p.features.electricity ? '✓' : '✗'}
                        </span>
                      </td>
                    ))}
                  </tr>
                  <tr className="border-b">
                    <td className="py-2 px-2 font-semibold">Vivienda</td>
                    {selectedData.map((p) => (
                      <td key={p.id} className="text-center py-2 px-2">
                        <span className={p.features.house ? 'text-green-600 font-bold' : 'text-red-600'}>
                          {p.features.house ? '✓' : '✗'}
                        </span>
                      </td>
                    ))}
                  </tr>
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Action Buttons */}
      <div className="flex gap-2">
        <Button
          onClick={generateComparison}
          disabled={selectedData.length < 2}
          className="bg-blue-600 hover:bg-blue-700"
        >
          <Download className="w-4 h-4 mr-2" />
          Descargar Comparativa
        </Button>
        {selectedProperties.length > 0 && (
          <Button
            variant="outline"
            onClick={() => setSelectedProperties([])}
          >
            Limpiar Selección
          </Button>
        )}
      </div>
    </div>
  )
}
