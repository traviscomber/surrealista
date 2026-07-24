export const dynamic = 'force-dynamic'

import type { Metadata } from 'next'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Pipeline | Real Estate Portal',
  description: 'Kanban board view of opportunity pipeline',
}

export default function PipelinePage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Deal Pipeline</h1>
        <p className="text-muted-foreground mt-2">Manage opportunities through your sales pipeline</p>
      </div>

      <Card className="p-12 border-dashed flex flex-col items-center justify-center min-h-96">
        <div className="text-center space-y-4">
          <h3 className="text-xl font-semibold">Pipeline Coming Soon</h3>
          <p className="text-muted-foreground">Kanban board view with drag-and-drop stage management</p>
          <p className="text-sm text-muted-foreground">Track deals through lead, prospect, negotiation, contract, and closing stages</p>
          <Link href="/opportunities">
            <Button variant="outline">Back to Feed</Button>
          </Link>
        </div>
      </Card>
    </div>
  )
}
