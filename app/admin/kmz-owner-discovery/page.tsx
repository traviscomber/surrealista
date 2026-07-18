import { KMZOwnerDiscoveryAdmin } from "@/components/kmz/kmz-owner-discovery-admin"

export const dynamic = "force-dynamic"

export default function KMZOwnerDiscoveryPage() {
  return (
    <div className="container mx-auto py-8 px-4">
      <KMZOwnerDiscoveryAdmin />
    </div>
  )
}
