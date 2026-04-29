import { Client360View } from '@/components/crm/client-360-view'

export default function ClientDetailPage({
  params,
}: {
  params: { id: string }
}) {
  const clientId = params.id

  return (
    <div className="min-h-screen bg-background p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        <Client360View clientId={clientId} />
      </div>
    </div>
  )
}
