'use client'

import { useState } from 'react'
import { Eye, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'

export function HomeSpotterSaveButton({ opportunity }: { opportunity: any }) {
  const [saving,setSaving] = useState(false)
  const [saved,setSaved] = useState(false)
  const save = async () => {
    setSaving(true)
    try {
      const response = await fetch('/api/cotizador/watchlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          label: opportunity.title,
          estimated_price: opportunity.benchmark?.estimated_value_clp ?? opportunity.price_clp,
          confidence: opportunity.confidence,
          resolved_context: {
            address: opportunity.address || [opportunity.commune, opportunity.region].filter(Boolean).join(', '),
            display_name: opportunity.title,
            city: opportunity.commune,
            region: opportunity.region,
            lat: opportunity.lat,
            lng: opportunity.lng,
            area_sqm: opportunity.area_m2,
          },
        }),
      })
      if (response.ok) setSaved(true)
    } finally { setSaving(false) }
  }
  return <Button onClick={save} disabled={saving || saved}>{saving?<Loader2 className="mr-2 h-4 w-4 animate-spin"/>:<Eye className="mr-2 h-4 w-4"/>}{saved?'En seguimiento':'Seguir oportunidad'}</Button>
}
