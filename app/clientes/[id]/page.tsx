import { Client360View } from "@/components/crm/client-360-view"
import { getClientById } from "@/app/actions/clients"

interface ClientPageProps {
  params: Promise<{
    id: string
  }>
}

function getOptionalString(row: Record<string, unknown>, key: string): string {
  const value = row[key]
  return typeof value === "string" ? value : ""
}

export default async function ClientDetailPage({ params }: ClientPageProps) {
  const { id } = await params
  const clientResult = await getClientById(id)

  if (!clientResult.success || !clientResult.data || typeof clientResult.data !== "object") {
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

  const clientData = clientResult.data as Record<string, unknown>
  const firstName = getOptionalString(clientData, "first_name")
  const lastName = getOptionalString(clientData, "last_name")
  const secondLastName = getOptionalString(clientData, "second_last_name")
  const companyName = getOptionalString(clientData, "company_name")
  const fullName = [firstName, lastName, secondLastName].filter(Boolean).join(" ") || companyName || "Cliente"
  const dataId = clientData.id

  const client = {
    id: typeof dataId === "string" ? dataId : id,
    name: fullName,
    email: getOptionalString(clientData, "email"),
    phone: getOptionalString(clientData, "phone") || getOptionalString(clientData, "mobile"),
    status: getOptionalString(clientData, "status") || "new",
    pipeline_status: getOptionalString(clientData, "client_type") || "prospect",
    type: getOptionalString(clientData, "client_type") || "buyer",
  }

  return (
    <div className="min-h-screen bg-background p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        <Client360View clientId={id} client={client} />
      </div>
    </div>
  )
}
