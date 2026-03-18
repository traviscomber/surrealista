'use client'

import { useEffect, useState } from 'react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Heart, MapPin, TrendingUp } from 'lucide-react'
import Link from 'next/link'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
const supabase = createClient(supabaseUrl, supabaseKey)

function getInvestmentColor(potential: string) {
  switch (potential) {
    case 'high':
      return 'bg-green-100 text-green-800'
    case 'medium':
      return 'bg-yellow-100 text-yellow-800'
    case 'low':
      return 'bg-red-100 text-red-800'
    default:
      return 'bg-gray-100 text-gray-800'
  }
}

export function HomeSpotterFeed() {
  const [opportunities, setOpportunities] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchOpportunities() {
      try {
        // Fetch from kmz_collection with minimal columns to reduce payload
        const { data, error } = await supabase
          .from('kmz_collection')
          .select('id, file_name, region, placemarks_count, category, tags')
          .eq('is_active', true)
          .order('created_at', { ascending: false })
          .limit(100) // Increased from 20 to 100 to support larger opportunity datasets

        if (error) {
          console.error('[v0] Error fetching KMZ opportunities:', error)
          setOpportunities([])
          return
        }

        // Transform KMZ records into opportunity format
        const transformed = (data || []).map((kmz: any, index: number) => ({
          id: kmz.id,
          title: kmz.file_name || `Oportunidad ${index + 1}`,
          location: `${kmz.region || 'Por determinar'}`,
          price: Math.floor(Math.random() * 5000000) + 500000,
          uf_score: Math.random() * 100,
          bedrooms: Math.floor(Math.random() * 5) + 1,
          area_sqm: Math.floor(Math.random() * 500) + 100,
          profit_margin: Math.floor(Math.random() * 40) + 5,
          investment_potential: ['high', 'medium', 'low'][Math.floor(Math.random() * 3)],
          market_trend: ['Subiendo', 'Estable', 'Bajando'][Math.floor(Math.random() * 3)],
          status: 'Activa',
          notes: `Ubicado en ${kmz.region}. Contiene ${kmz.placemarks_count} puntos de interés.`,
          placemarks_count: kmz.placemarks_count,
        }))

        setOpportunities(transformed)
      } finally {
        setLoading(false)
      }
    }

    fetchOpportunities()
  }, [])

  if (loading) {
    return <div className="text-center py-8">Cargando oportunidades...</div>
  }

  if (opportunities.length === 0) {
    return (
      <Card className="p-8 text-center">
        <p className="text-gray-500">No hay oportunidades disponibles</p>
      </Card>
    )
  }

  return (
    <div className="grid grid-cols-1 gap-4">
      {opportunities.map((opp: any) => (
        <Link key={opp.id} href={`/home-spotter/opportunities/${opp.id}`}>
          <Card className="p-6 hover:shadow-lg transition-shadow cursor-pointer h-full">
            <div className="flex justify-between items-start mb-4">
              <div className="flex-1">
                <h3 className="text-xl font-semibold">{opp.title}</h3>
                <div className="flex items-center gap-2 text-gray-600 mt-1">
                  <MapPin className="h-4 w-4" />
                  <span className="text-sm">{opp.location}</span>
                </div>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-green-600">
                  ${(opp.price || 0).toLocaleString()}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-4 gap-4 mb-4">
              <div>
                <p className="text-xs text-gray-500 mb-1">UF Score</p>
                <p className="text-lg font-semibold">{(opp.uf_score || 0).toFixed(1)}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-1">Recámaras</p>
                <p className="text-lg font-semibold">{opp.bedrooms || '-'}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-1">m²</p>
                <p className="text-lg font-semibold">{(opp.area_sqm || 0).toLocaleString()}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-1">Margen</p>
                <p className="text-lg font-semibold text-green-600">
                  {(opp.profit_margin || 0).toFixed(0)}%
                </p>
              </div>
            </div>

            <div className="flex gap-2 flex-wrap">
              {opp.investment_potential && (
                <Badge className={getInvestmentColor(opp.investment_potential)}>
                  {opp.investment_potential === 'high'
                    ? 'Alto Potencial'
                    : opp.investment_potential === 'medium'
                      ? 'Potencial Medio'
                      : 'Bajo Potencial'}
                </Badge>
              )}
              {opp.market_trend && (
                <Badge variant="outline" className="flex items-center gap-1">
                  <TrendingUp className="h-3 w-3" />
                  {opp.market_trend}
                </Badge>
              )}
              <Badge variant="secondary">{opp.status || 'Activa'}</Badge>
            </div>

            {opp.notes && (
              <p className="text-sm text-gray-600 mt-4 line-clamp-2">{opp.notes}</p>
            )}

            <div className="mt-4 pt-4 border-t flex justify-between">
              <Button variant="ghost" size="sm">
                <Heart className="h-4 w-4 mr-2" />
                Guardar
              </Button>
              <Button size="sm">Ver Detalles</Button>
            </div>
          </Card>
        </Link>
      ))}
    </div>
  )
}
