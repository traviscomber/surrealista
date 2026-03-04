'use client'

import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { MapPin, DollarSign, Home, Bookmark, BookmarkX, Eye } from 'lucide-react'
import { getOpportunities, saveOpportunity, getSavedOpportunities } from '@/lib/supabase/opportunities'
import { Opportunity, PaginatedResponse } from '@/lib/types/opportunities'
import { OpportunitiesFiltersBar } from './opportunities-filters-bar'
import { Loader2 } from 'lucide-react'

const STATUS_COLORS: Record<string, string> = {
  draft: 'bg-gray-500',
  active: 'bg-green-500',
  under_review: 'bg-blue-500',
  pending: 'bg-yellow-500',
  closed: 'bg-red-500',
  passed: 'bg-gray-600',
}

const STAGE_COLORS: Record<string, string> = {
  lead: 'bg-purple-500',
  prospect: 'bg-indigo-500',
  negotiation: 'bg-blue-500',
  contract: 'bg-orange-500',
  closing: 'bg-green-500',
}

export function OpportunitiesFeed() {
  const searchParams = useSearchParams()
  const [opportunities, setOpportunities] = useState<Opportunity[]>([])
  const [savedOpportunitiesIds, setSavedOpportunitiesIds] = useState<Set<string>>(new Set())
  const [isLoading, setIsLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)

  useEffect(() => {
    const loadOpportunities = async () => {
      setIsLoading(true)
      try {
        const result: PaginatedResponse<Opportunity> = await getOpportunities({}, page)
        setOpportunities(result.data)
        setTotalPages(result.totalPages)
      } catch (error) {
        console.error('[v0] Error loading opportunities:', error)
      } finally {
        setIsLoading(false)
      }
    }

    loadOpportunities()
  }, [page])

  const handleSaveOpportunity = async (opportunityId: string) => {
    try {
      const { data: { user } } = await (await import('@supabase/supabase-js')).createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL || '',
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
      ).auth.getUser()

      if (!user) return

      await saveOpportunity(opportunityId, user.id)
      setSavedOpportunitiesIds((prev) => new Set([...prev, opportunityId]))
    } catch (error) {
      console.error('[v0] Error saving opportunity:', error)
    }
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value)
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <OpportunitiesFiltersBar />

      <div className="grid gap-4">
        {opportunities.map((opp) => (
          <Card key={opp.id} className="hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-4">
              <div className="flex-1">
                <CardTitle className="text-xl">{opp.title}</CardTitle>
                <div className="flex gap-2 mt-2">
                  <Badge className={STATUS_COLORS[opp.status] || 'bg-gray-500'}>
                    {opp.status}
                  </Badge>
                  <Badge className={STAGE_COLORS[opp.stage] || 'bg-gray-500'}>
                    {opp.stage}
                  </Badge>
                  <Badge variant={opp.priority === 'critical' ? 'destructive' : 'secondary'}>
                    {opp.priority}
                  </Badge>
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleSaveOpportunity(opp.id)}
                  className={savedOpportunitiesIds.has(opp.id) ? 'text-yellow-500' : ''}
                >
                  {savedOpportunitiesIds.has(opp.id) ? (
                    <Bookmark className="h-5 w-5 fill-current" />
                  ) : (
                    <BookmarkX className="h-5 w-5" />
                  )}
                </Button>
              </div>
            </CardHeader>

            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground line-clamp-2">{opp.description}</p>

              {/* Location */}
              <div className="flex items-center gap-2 text-sm">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                <span>{opp.location.address}</span>
                <span className="text-muted-foreground">{opp.location.city}, {opp.location.state}</span>
              </div>

              {/* Property Details */}
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Property Type</span>
                  <p className="font-medium capitalize">{opp.property_details.property_type}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Size</span>
                  <p className="font-medium">{(opp.property_details.size_sqft || 0).toLocaleString()} sqft</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Year Built</span>
                  <p className="font-medium">{opp.property_details.year_built}</p>
                </div>
              </div>

              {/* Financial */}
              <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                <div className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-green-600" />
                  <div>
                    <span className="text-xs text-muted-foreground">Asking Price</span>
                    <p className="font-bold text-lg">{formatCurrency(opp.financial.asking_price)}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Home className="h-4 w-4 text-blue-600" />
                  <div>
                    <span className="text-xs text-muted-foreground">Est. Value</span>
                    <p className="font-bold text-lg">{formatCurrency(opp.financial.estimated_value)}</p>
                  </div>
                </div>
              </div>

              {/* Tags */}
              {opp.tags.length > 0 && (
                <div className="flex gap-2 flex-wrap pt-2">
                  {opp.tags.map((tag) => (
                    <Badge key={tag} variant="outline" className="text-xs">
                      {tag}
                    </Badge>
                  ))}
                </div>
              )}

              {/* Stats */}
              <div className="flex gap-4 text-xs text-muted-foreground pt-2 border-t">
                <div className="flex items-center gap-1">
                  <Eye className="h-3 w-3" />
                  {opp.view_count} views
                </div>
                <div className="flex items-center gap-1">
                  <Bookmark className="h-3 w-3" />
                  {opp.saved_count} saved
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex gap-2 justify-center pt-4">
          <Button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            variant="outline"
          >
            Previous
          </Button>
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">
              Page {page} of {totalPages}
            </span>
          </div>
          <Button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            variant="outline"
          >
            Next
          </Button>
        </div>
      )}
    </div>
  )
}
