import type { Metadata } from 'next'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Saved Opportunities | Real Estate Portal',
  description: 'Your saved and bookmarked opportunities',
}

export default function SavedPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Saved Opportunities</h1>
        <p className="text-muted-foreground mt-2">Your bookmarked and saved opportunities</p>
      </div>

      <Card className="p-12 border-dashed flex flex-col items-center justify-center min-h-96">
        <div className="text-center space-y-4">
          <h3 className="text-xl font-semibold">Saved Opportunities Coming Soon</h3>
          <p className="text-muted-foreground">View and manage your saved opportunities</p>
          <p className="text-sm text-muted-foreground">Use the bookmark icon in the feed to save opportunities for later review</p>
          <Link href="/opportunities">
            <Button variant="outline">Browse Opportunities</Button>
          </Link>
        </div>
      </Card>
    </div>
  )
}
