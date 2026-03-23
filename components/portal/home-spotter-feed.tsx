'use client'

import { useEffect, useState } from 'react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Heart, MapPin, TrendingUp, Filter } from 'lucide-react'
import Link from 'next/link'
import { createClient } from '@supabase/supabase-js'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
const supabase = createClient(supabaseUrl, supabaseKey)

const CHILEAN_REGIONS = [
  'Arica y Parinacota',
  'Tarapacá',
  'Antofagasta',
  'Atacama',
  'Coquimbo',
  'Valparaíso',
  'Metropolitana',
  'Libertador General Bernardo O\'Higgins',
  'Región del Maule',
  'Ñuble',
  'Bío Bío',
  'La Araucanía',
  'Los Ríos',
  'Los Lagos',
  'Región de Aysén del General Carlos Ibáñez del Campo',
  'Magallanes y de la Antártica Chilena',
]

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

function calculateInvestmentPotential(kmz: any): string {
  // Higher placemarks_count = better opportunity
  const placemarksScore = (kmz.placemarks_count || 0) / 10
  
  if (placemarksScore > 5) return 'high'
  if (placemarksScore > 2) return 'medium'
  return 'low'
}

export function HomeSpotterFeed() {
  const [opportunities, setOpportunities] = useState<any[]>([])
  const [filteredOpportunities, setFilteredOpportunities] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedRegion, setSelectedRegion] = useState<string>('all')
  const [sortBy, setSortBy] = useState<string>('recent')
  const [totalCount, setTotalCount] = useState(0)
  const [displayedCount, setDisplayedCount] = useState(0)

  useEffect(() => {
    async function fetchAllOpportunities() {
      try {
        console.log('[v0] Fetching all KMZ opportunities...')
        
        // Fetch all active KMZ files with pagination
        const { data, error, count } = await supabase
          .from('kmz_collection')
          .select('id, file_name, region, placemarks_count, category, tags, created_at', { count: 'exact' })
          .eq('is_active', true)
          .order('created_at', { ascending: false })

        if (error) {
          console.error('[v0] Error fetching KMZ opportunities:', error)
          setOpportunities([])
          setTotalCount(0)
          return
        }

        const kmzList = data || []
        console.log(`[v0] Fetched ${kmzList.length} KMZ files out of ${count} total active`)
        
        setTotalCount(count || 0)
        setDisplayedCount(kmzList.length)

        // Transform KMZ records into opportunity format
        const transformed = kmzList.map((kmz: any, index: number) => {
          const investmentPotential = calculateInvestmentPotential(kmz)
          
          return {
            id: kmz.id,
            title: kmz.file_name || `Oportunidad ${index + 1}`,
            location: `${kmz.region || 'Por determinar'}`,
            price: (kmz.placemarks_count || 1) * 100000, // Based on placemark count
            uf_score: Math.min(100, (kmz.placemarks_count || 0) * 5),
            bedrooms: Math.max(1, Math.floor((kmz.placemarks_count || 1) / 2)),
            area_sqm: (kmz.placemarks_count || 1) * 150,
            profit_margin: 15 + ((kmz.placemarks_count || 0) % 25),
            investment_potential: investmentPotential,
            market_trend: ['Subiendo', 'Estable', 'Bajando'][index % 3],
            status: 'Activa',
            notes: `Ubicado en ${kmz.region}. Contiene ${kmz.placemarks_count || 0} puntos de interés.${kmz.category ? ` Categoría: ${kmz.category}` : ''}`,
            placemarks_count: kmz.placemarks_count,
            region: kmz.region,
            created_at: kmz.created_at,
          }
        })

        setOpportunities(transformed)
      } catch (err) {
        console.error('[v0] Error in fetchAllOpportunities:', err)
        setOpportunities([])
      } finally {
        setLoading(false)
      }
    }

    fetchAllOpportunities()
  }, [])

  // Apply filters and sorting
  useEffect(() => {
    let filtered = opportunities

    // Filter by region
    if (selectedRegion !== 'all') {
      filtered = filtered.filter(opp => opp.region === selectedRegion)
    }

    // Sort
    if (sortBy === 'recent') {
      filtered = [...filtered].sort((a, b) => 
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      )
    } else if (sortBy === 'highest_potential') {
      filtered = [...filtered].sort((a, b) => {
        const potentialOrder = { high: 3, medium: 2, low: 1 }
        return (potentialOrder[b.investment_potential as keyof typeof potentialOrder] || 0) - 
               (potentialOrder[a.investment_potential as keyof typeof potentialOrder] || 0)
      })
    } else if (sortBy === 'placemarks') {
      filtered = [...filtered].sort((a, b) => (b.placemarks_count || 0) - (a.placemarks_count || 0))
    }

    setFilteredOpportunities(filtered)
  }, [opportunities, selectedRegion, sortBy])

  if (loading) {
    return <div className="text-center py-8">Cargando oportunidades...</div>
  }

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="flex gap-4 items-end flex-wrap">
        <div className="flex-1 min-w-[200px]">
          <label className="text-sm font-medium mb-2 block">Región</label>
          <Select value={selectedRegion} onValueChange={setSelectedRegion}>
            <SelectTrigger>
              <SelectValue placeholder="Todas las regiones" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas las regiones ({totalCount})</SelectItem>
              {CHILEAN_REGIONS.map(region => {
                const count = opportunities.filter(o => o.region === region).length
                return count > 0 ? (
                  <SelectItem key={region} value={region}>
                    {region} ({count})
                  </SelectItem>
                ) : null
              })}
            </SelectContent>
          </Select>
        </div>

        <div className="flex-1 min-w-[200px]">
          <label className="text-sm font-medium mb-2 block">Ordenar por</label>
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger>
              <SelectValue placeholder="Ordenar por" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="recent">Más recientes</SelectItem>
              <SelectItem value="highest_potential">Mayor potencial</SelectItem>
              <SelectItem value="placemarks">Más puntos de interés</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="text-sm text-gray-500">
          {filteredOpportunities.length} de {totalCount} oportunidades
        </div>
      </div>

      {/* Results */}
      {filteredOpportunities.length === 0 ? (
        <Card className="p-8 text-center">
          <p className="text-gray-500">No hay oportunidades disponibles</p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {filteredOpportunities.map((opp: any) => (
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
                    <p className="text-xs text-gray-500 mb-1">Puntos</p>
                    <p className="text-lg font-semibold">{opp.placemarks_count || '-'}</p>
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
      )}
    </div>
  )
}
