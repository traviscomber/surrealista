'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { BookOpen, Zap, HelpCircle, Award } from 'lucide-react'

export default function DocsUsuario() {
  const [expandedGuide, setExpandedGuide] = useState<string>('cotizador')

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-5xl mx-auto px-4 py-12">
        <h1 className="text-4xl font-bold text-foreground mb-2">Guía del Usuario</h1>
        <p className="text-lg text-slate-400 mb-8">Tutoriales y solución de problemas</p>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-8">
          <button
            onClick={() => setExpandedGuide('cotizador')}
            className={`p-3 rounded-lg transition-colors text-left ${expandedGuide === 'cotizador' ? 'bg-emerald-900/40 border border-emerald-700/50' : 'bg-slate-900/50 border border-slate-700/50 hover:bg-slate-900/70'}`}
          >
            <BookOpen className="h-4 w-4" />
            <span className="text-sm font-medium block mt-1">Cotizador</span>
          </button>

          <button
            onClick={() => setExpandedGuide('asistente')}
            className={`p-3 rounded-lg transition-colors text-left ${expandedGuide === 'asistente' ? 'bg-emerald-900/40 border border-emerald-700/50' : 'bg-slate-900/50 border border-slate-700/50 hover:bg-slate-900/70'}`}
          >
            <Zap className="h-4 w-4" />
            <span className="text-sm font-medium block mt-1">Asistente IA</span>
          </button>

          <button
            onClick={() => setExpandedGuide('faq')}
            className={`p-3 rounded-lg transition-colors text-left ${expandedGuide === 'faq' ? 'bg-emerald-900/40 border border-emerald-700/50' : 'bg-slate-900/50 border border-slate-700/50 hover:bg-slate-900/70'}`}
          >
            <HelpCircle className="h-4 w-4" />
            <span className="text-sm font-medium block mt-1">FAQ</span>
          </button>

          <button
            onClick={() => setExpandedGuide('tips')}
            className={`p-3 rounded-lg transition-colors text-left ${expandedGuide === 'tips' ? 'bg-emerald-900/40 border border-emerald-700/50' : 'bg-slate-900/50 border border-slate-700/50 hover:bg-slate-900/70'}`}
          >
            <Award className="h-4 w-4" />
            <span className="text-sm font-medium block mt-1">Tips</span>
          </button>
        </div>

        {expandedGuide === 'cotizador' && (
          <Card className="bg-slate-900/50 border-slate-700/50 mb-8">
            <CardHeader>
              <CardTitle>Cotizar una Propiedad en 5 Minutos</CardTitle>
            </CardHeader>
            <CardContent>
              <ol className="space-y-2 text-sm">
                <li className="text-slate-300"><strong className="text-emerald-400">1.</strong> Ve a Herramientas → Cotizador</li>
                <li className="text-slate-300"><strong className="text-emerald-400">2.</strong> Selecciona tipo, región, área</li>
                <li className="text-slate-300"><strong className="text-emerald-400">3.</strong> Ingresa condición y características</li>
                <li className="text-slate-300"><strong className="text-emerald-400">4.</strong> Click en "Obtener Valuación"</li>
                <li className="text-slate-300"><strong className="text-emerald-400">5.</strong> Revisa tu valuación con confianza</li>
              </ol>
            </CardContent>
          </Card>
        )}

        {expandedGuide === 'asistente' && (
          <Card className="bg-slate-900/50 border-slate-700/50 mb-8">
            <CardHeader>
              <CardTitle>Usar el Asistente IA</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <ol className="space-y-2 text-sm">
                <li className="text-slate-300"><strong className="text-emerald-400">1.</strong> Ve a Herramientas → Asistente IA</li>
                <li className="text-slate-300"><strong className="text-emerald-400">2.</strong> Haz tu pregunta en lenguaje natural</li>
                <li className="text-slate-300"><strong className="text-emerald-400">3.</strong> Recibe respuesta basada en datos</li>
              </ol>
              <div className="border-t border-slate-700 pt-3 mt-3">
                <p className="text-xs text-slate-400 mb-2">Ejemplos:</p>
                <ul className="space-y-1 text-xs text-slate-400">
                  <li>• "¿Archivos en Valdivia?"</li>
                  <li>• "¿Cómo está el mercado?"</li>
                  <li>• "¿Dónde invertir?"</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        )}

        {expandedGuide === 'faq' && (
          <Card className="bg-slate-900/50 border-slate-700/50 mb-8">
            <CardHeader>
              <CardTitle>Preguntas Frecuentes</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <p className="font-semibold text-sm text-slate-200 mb-1">¿Qué tan preciso es?</p>
                <p className="text-xs text-slate-400">Con múltiples comparables: ±5-10%. Para crédito: tasación oficial.</p>
              </div>
              <div>
                <p className="font-semibold text-sm text-slate-200 mb-1">¿De dónde vienen los datos?</p>
                <p className="text-xs text-slate-400">SII (40%), Base de datos (35%), Mercado (25%).</p>
              </div>
              <div>
                <p className="font-semibold text-sm text-slate-200 mb-1">¿Es seguro?</p>
                <p className="text-xs text-slate-400">Sí. HTTPS, encriptación y backups automáticos.</p>
              </div>
            </CardContent>
          </Card>
        )}

        {expandedGuide === 'tips' && (
          <Card className="bg-slate-900/50 border-slate-700/50 mb-8">
            <CardHeader>
              <CardTitle>Consejos de Expertos</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="bg-emerald-900/20 p-3 rounded text-xs">
                <p className="font-semibold text-emerald-400 mb-1">Tip 1: Usa todas las características</p>
                <p className="text-slate-300">Agrega piscina, terraza, garage para mayor precisión.</p>
              </div>
              <div className="bg-blue-900/20 p-3 rounded text-xs">
                <p className="font-semibold text-blue-400 mb-1">Tip 2: Compara con mercado vigente</p>
                <p className="text-slate-300">Valida la valuación con portales inmobiliarios.</p>
              </div>
              <div className="bg-purple-900/20 p-3 rounded text-xs">
                <p className="font-semibold text-purple-400 mb-1">Tip 3: Para créditos</p>
                <p className="text-slate-300">Obtén tasación oficial además de esta valuación.</p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
