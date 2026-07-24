export const dynamic = 'force-dynamic'

import type { Metadata } from 'next'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Settings | Real Estate Portal',
  description: 'Portal settings and preferences',
}

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground mt-2">Manage your preferences and alerts</p>
      </div>

      <Card className="p-12 border-dashed flex flex-col items-center justify-center min-h-96">
        <div className="text-center space-y-4">
          <h3 className="text-xl font-semibold">Settings Coming Soon</h3>
          <p className="text-muted-foreground">Customize filters, notifications, and preferences</p>
          <p className="text-sm text-muted-foreground">Configure default views, alert thresholds, and email notifications</p>
          <Link href="/opportunities">
            <Button variant="outline">Back to Feed</Button>
          </Link>
        </div>
      </Card>
    </div>
  )
}
