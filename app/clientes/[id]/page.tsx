import { Client360View } from '@/components/crm/client-360-view'
import { getClientById } from '@/app/actions/clients'

interface ClientPageProps {
  params: Promise<{
    id: string
  }>
}

export default async function ClientDetailPage({ params }: ClientPageProps) {
  const { id } = await params

  // Obtener el cliente de la BD
  const clientResult = await getClientById(id)
  
  // Si no existe el cliente, mostrar error
  if (!clientResult.success || !clientResult.data) {
    return (
      <div className="min-h-screen bg-background p-4 md:p-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center py-12">
            <h1 className="text-2xl font-bold text-red-600">Cliente no encontrado</h1>
            <p className="text-gray-600 mt-2">El cliente solicitado no existe o fue eliminado.</p>
          </div>
        </div>
      </div>
    )
  }

  const clientData = clientResult.data
  
  // Construir el nombre completo a partir de los campos de la BD
  const nameparts = [clientData.first_name, clientData.last_name, clientData.second_last_name].filter(Boolean)
  const fullName = nameparts.length > 0 ? nameparts.join(' ') : clientData.company_name || 'Cliente'

  // Transformar los datos de la BD al formato esperado por el componente
  const client = {
    id: clientData.id,
    name: fullName,
    email: clientData.email || '',
    phone: clientData.phone || clientData.mobile || '',
    status: clientData.status || 'new',
    pipeline_status: clientData.client_type || 'prospect',
    type: clientData.client_type || 'buyer',
    company_name: clientData.company_name || '',
    // Campos adicionales de la BD
    rut: clientData.rut,
    mobile: clientData.mobile,
    position: clientData.position,
    address: clientData.address,
    city: clientData.city,
    region: clientData.region,
    notes: clientData.notes,
  }

  return (
    <div className="min-h-screen bg-background p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        <Client360View clientId={id} client={client} />
      </div>
    </div>
  )
}
