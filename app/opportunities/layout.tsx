import type { Metadata } from 'next'
import { PortalLayout } from '@/components/portal/portal-layout'
import { PortalSidebar } from '@/components/portal/portal-sidebar'

export const metadata: Metadata = {
  title: 'Real Estate Opportunities Portal | Sur-Realista',
  description: 'Manage and explore real estate investment opportunities',
}

export default function OpportunitiesLayout({ children }: { children: React.ReactNode }) {
  return (
    <PortalLayout>
      <div className="flex h-screen bg-background">
        {/* Sidebar */}
        <PortalSidebar />

        {/* Main Content */}
        <main className="flex-1 lg:ml-64 overflow-auto">
          <div className="h-full p-4 lg:p-8 max-w-7xl mx-auto w-full">
            {children}
          </div>
        </main>
      </div>
    </PortalLayout>
  )
}
