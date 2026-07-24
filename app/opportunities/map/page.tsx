import type { Metadata } from 'next'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Map View | Real Estate Portal',
  description: 'Interactive map view of opportunities',
}

export default function MapPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Map Explorer</h1>
        <p className="text-muted-foreground mt-2">Visualize opportunities on an interactive map</p>
      </div>

      <Card className="p-12 border-dashed flex flex-col items-center justify-center min-h-96">
        <div className="text-center space-y-4">
          <h3 className="text-xl font-semibold">Map Coming Soon</h3>
          <p className="text-muted-foreground">Interactive map visualization of all opportunities</p>
          <p className="text-sm text-muted-foreground">Features will include clustering, filtering by region, and property details on hover</p>
          <Link href="/opportunities">
            <Button variant="outline">Back to Feed</Button>
          </Link>
        </div>
      </Card>
    </div>
  )
}
