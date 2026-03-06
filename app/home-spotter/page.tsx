import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Heart, MapPin, TrendingUp } from 'lucide-react'
import Link from 'next/link'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
const supabase = createClient(supabaseUrl, supabaseKey)

async function getOpportunitiesWithScores() {
  const { data, error } = await supabase
    .from('opportunities')
    .select('*')
    .order('uf_score', { ascending: false })
    .limit(20)

  if (error) {
    console.error('[v0] Error fetching opportunities:', error)
    return []
  }

  return data || []
}

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

export default async function HomeSpotterFeedPage() {
  const opportunities = await getOpportunitiesWithScores()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Oportunidades de Inversión</h1>
        <p className="text-gray-600 mt-2">
          Descubre las mejores oportunidades inmobiliarias clasificadas por potencial de inversión
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {opportunities.length === 0 ? (
          <Card className="p-8 text-center">
            <p className="text-gray-500">No hay oportunidades disponibles</p>
          </Card>
        ) : (
          opportunities.map((opp: any) => (
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
          ))
        )}
      </div>
    </div>
  )
}
