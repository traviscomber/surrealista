import type { Metadata } from 'next'
import { OpportunitiesFeed } from '@/components/portal/opportunities-feed'

export const metadata: Metadata = {
  title: 'Opportunities Feed | Real Estate Portal',
  description: 'Browse all available real estate investment opportunities',
}

export default function OpportunitiesPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Opportunities Feed</h1>
        <p className="text-muted-foreground mt-2">Discover and track real estate investment opportunities</p>
      </div>
      <OpportunitiesFeed />
    </div>
  )
}
