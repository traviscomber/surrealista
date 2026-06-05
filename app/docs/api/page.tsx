'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Code2, Database, Send } from 'lucide-react'

export default function DocsAPI() {
  const [expandedEndpoint, setExpandedEndpoint] = useState<string>('cotizador')

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-6xl mx-auto px-4 py-12">
        <h1 className="text-4xl font-bold text-foreground mb-2">API Reference</h1>
        <p className="text-lg text-slate-400 mb-8">Documentación completa de endpoints</p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-8">
          <button
            onClick={() => setExpandedEndpoint('cotizador')}
            className={`p-3 rounded-lg transition-colors text-left ${expandedEndpoint === 'cotizador' ? 'bg-emerald-900/40 border border-emerald-700/50' : 'bg-slate-900/50 border border-slate-700/50 hover:bg-slate-900/70'}`}
          >
            <div className="flex items-center gap-2">
              <Code2 className="h-4 w-4" />
              <span className="text-sm font-medium">/cotizador/valuar</span>
            </div>
          </button>

          <button
            onClick={() => setExpandedEndpoint('asistente')}
            className={`p-3 rounded-lg transition-colors text-left ${expandedEndpoint === 'asistente' ? 'bg-emerald-900/40 border border-emerald-700/50' : 'bg-slate-900/50 border border-slate-700/50 hover:bg-slate-900/70'}`}
          >
            <div className="flex items-center gap-2">
              <Send className="h-4 w-4" />
              <span className="text-sm font-medium">/ai-assistant</span>
            </div>
          </button>

          <button
            onClick={() => setExpandedEndpoint('propiedades')}
            className={`p-3 rounded-lg transition-colors text-left ${expandedEndpoint === 'propiedades' ? 'bg-emerald-900/40 border border-emerald-700/50' : 'bg-slate-900/50 border border-slate-700/50 hover:bg-slate-900/70'}`}
          >
            <div className="flex items-center gap-2">
              <Database className="h-4 w-4" />
              <span className="text-sm font-medium">/properties</span>
            </div>
          </button>
        </div>

        {expandedEndpoint === 'cotizador' && (
          <Card className="bg-slate-900/50 border-slate-700/50 mb-8">
            <CardHeader>
              <CardTitle>POST /api/cotizador/valuar</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-semibold mb-2 text-sm">Request:</h4>
                <pre className="bg-slate-800/50 p-3 rounded text-xs overflow-auto text-slate-300">
{`{
  "property_type": "terreno",
  "region": "Biobío",
  "area_sqm": 5000,
  "condition": "bueno"
}`}
                </pre>
              </div>
              <div>
                <h4 className="font-semibold mb-2 text-sm">Response:</h4>
                <pre className="bg-slate-800/50 p-3 rounded text-xs overflow-auto text-emerald-400">
{`{
  "estimated_price": 42500000,
  "confidence": 85,
  "methodology": "Enfoque Comparativo"
}`}
                </pre>
              </div>
            </CardContent>
          </Card>
        )}

        {expandedEndpoint === 'asistente' && (
          <Card className="bg-slate-900/50 border-slate-700/50 mb-8">
            <CardHeader>
              <CardTitle>POST /api/ai-assistant</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-semibold mb-2 text-sm">Request:</h4>
                <pre className="bg-slate-800/50 p-3 rounded text-xs text-slate-300">
{`{ "message": "¿Qué archivos en Valdivia?" }`}
                </pre>
              </div>
              <div>
                <h4 className="font-semibold mb-2 text-sm">Response:</h4>
                <pre className="bg-slate-800/50 p-3 rounded text-xs overflow-auto text-emerald-400">
{`{
  "response": "Encontré 3 archivos...",
  "type": "region_search"
}`}
                </pre>
              </div>
            </CardContent>
          </Card>
        )}

        {expandedEndpoint === 'propiedades' && (
          <Card className="bg-slate-900/50 border-slate-700/50 mb-8">
            <CardHeader>
              <CardTitle>GET /api/properties</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-slate-300">Obtiene propiedades con filtros por región, ciudad y tipo.</p>
            </CardContent>
          </Card>
        )}

        <Card className="bg-blue-900/30 border-blue-700/50">
          <CardHeader>
            <CardTitle className="text-lg">Códigos de Error</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-1 text-sm text-slate-300">
              <li><strong>200</strong>: Éxito</li>
              <li><strong>400</strong>: Parámetros inválidos</li>
              <li><strong>429</strong>: Rate limit</li>
              <li><strong>500</strong>: Error del servidor</li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
