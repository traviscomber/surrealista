'use client'

import { useState } from 'react'
import Image from 'next/image'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Brain, Zap, TrendingUp, Shield, AlertCircle } from 'lucide-react'

export default function DocsIA() {
  const [expandedSection, setExpandedSection] = useState<string>('algoritmo')

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-6xl mx-auto px-4 py-12">
        <h1 className="text-4xl font-bold text-foreground mb-2">Documentación IA</h1>
        <p className="text-lg text-slate-400 mb-8">Algoritmos, modelos y capacidades de inteligencia artificial</p>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-8">
          <button
            onClick={() => setExpandedSection('algoritmo')}
            className={`p-3 rounded-lg transition-colors text-left ${expandedSection === 'algoritmo' ? 'bg-emerald-900/40 border border-emerald-700/50' : 'bg-slate-900/50 border border-slate-700/50 hover:bg-slate-900/70'}`}
          >
            <div className="flex items-center gap-2">
              <Brain className="h-4 w-4" />
              <span className="text-sm font-medium">Algoritmo</span>
            </div>
          </button>

          <button
            onClick={() => setExpandedSection('nlp')}
            className={`p-3 rounded-lg transition-colors text-left ${expandedSection === 'nlp' ? 'bg-emerald-900/40 border border-emerald-700/50' : 'bg-slate-900/50 border border-slate-700/50 hover:bg-slate-900/70'}`}
          >
            <div className="flex items-center gap-2">
              <Zap className="h-4 w-4" />
              <span className="text-sm font-medium">NLP</span>
            </div>
          </button>

          <button
            onClick={() => setExpandedSection('predictivo')}
            className={`p-3 rounded-lg transition-colors text-left ${expandedSection === 'predictivo' ? 'bg-emerald-900/40 border border-emerald-700/50' : 'bg-slate-900/50 border border-slate-700/50 hover:bg-slate-900/70'}`}
          >
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              <span className="text-sm font-medium">Predictivo</span>
            </div>
          </button>

          <button
            onClick={() => setExpandedSection('limitaciones')}
            className={`p-3 rounded-lg transition-colors text-left ${expandedSection === 'limitaciones' ? 'bg-emerald-900/40 border border-emerald-700/50' : 'bg-slate-900/50 border border-slate-700/50 hover:bg-slate-900/70'}`}
          >
            <div className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4" />
              <span className="text-sm font-medium">Limitaciones</span>
            </div>
          </button>
        </div>

        {expandedSection === 'algoritmo' && (
          <Card className="bg-slate-900/50 border-slate-700/50 mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Brain className="h-5 w-5 text-blue-400" />
                Algoritmo de Valuación
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-slate-800/50 p-4 rounded-lg font-mono text-sm text-emerald-400">
                PRECIO = (SII × 0.40 + BD × 0.35 + Internet × 0.25) × Condition × Features
              </div>
              <div className="space-y-2 text-slate-300 text-sm">
                <p><strong>SII (40%)</strong>: Avalúos fiscales del Servicio de Impuestos Internos</p>
                <p><strong>BD (35%)</strong>: Base de datos de propiedades verificadas</p>
                <p><strong>Internet (25%)</strong>: Datos de mercado vigente</p>
              </div>
            </CardContent>
          </Card>
        )}

        {expandedSection === 'nlp' && (
          <Card className="bg-slate-900/50 border-slate-700/50 mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5 text-purple-400" />
                Procesamiento de Lenguaje Natural
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-slate-300 text-sm">Reconocimiento de 8+ tipos de intenciones: búsqueda geográfica, análisis comparativo, tendencias, oportunidades y más.</p>
            </CardContent>
          </Card>
        )}

        {expandedSection === 'predictivo' && (
          <Card className="bg-slate-900/50 border-slate-700/50 mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-blue-400" />
                Análisis Predictivo
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-slate-300 text-sm">
                <li>✓ Predicción de demanda a 6-12 meses</li>
                <li>✓ Tendencias de mercado regional</li>
                <li>✓ Oportunidades de revalorización</li>
              </ul>
            </CardContent>
          </Card>
        )}

        {expandedSection === 'limitaciones' && (
          <Card className="bg-slate-900/50 border-slate-700/50 mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-orange-400" />
                Limitaciones
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-slate-300 text-sm">
                <li>⚠ Mercados especializados: ±20-30%</li>
                <li>⚠ Para créditos: solicitar tasación oficial</li>
              </ul>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
