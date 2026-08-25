import type { Metadata } from 'next'
import { AppHeader } from '@/components/layout/app-header'
import { CommercialOperationsCenter } from '@/components/admin/commercial-operations-center'
import { WorkspaceHeading } from '@/components/ui/workspace-heading'

export const dynamic = 'force-dynamic'
export const metadata: Metadata = { title: 'Operaciones comerciales | Sur-Realista' }

export default function CommercialOperationsPage() {
  return <><AppHeader/><main className="container mx-auto space-y-8 px-4 py-8 md:py-10"><WorkspaceHeading eyebrow="Centro de operaciones" title="Operaciones comerciales" description="Una cola interna para Juan: qué revisar, qué cambió y qué requiere acción." outcome="Conecta valorizador, watchlist, alertas, inventario y tareas en una sola vista."/><CommercialOperationsCenter/></main></>
}
