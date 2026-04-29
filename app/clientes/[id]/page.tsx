import { Client360View } from '@/components/crm/client-360-view'

interface ClientPageProps {
  params: {
    id: string
  }
}

export default async function ClientDetailPage({ params }: ClientPageProps) {
  // Aquí iría la lógica para obtener el cliente desde la BD
  // Por ahora usamos datos de ejemplo
  const client = {
    id: params.id,
    name: 'Cliente Ejemplo',
    email: 'cliente@example.com',
    phone: '+56 9 1234 5678',
    status: 'hot',
    pipeline_status: 'qualified',
    type: 'buyer',
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto">
        <Client360View clientId={params.id} client={client} />
      </div>
    </div>
  )
}
