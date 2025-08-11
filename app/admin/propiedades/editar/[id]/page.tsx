import { Suspense } from "react"
import { PropertyEditForm } from "@/components/admin/property-edit-form"
import { Skeleton } from "@/components/ui/skeleton"
import { supabase } from "@/lib/supabase/server"

async function getProperty(id: string) {
  const { data, error } = await supabase.from("properties").select("*").eq("id", id).single()

  if (error) {
    throw new Error(`Error al cargar la propiedad: ${error.message}`)
  }

  return data
}

export default async function EditPropertyPage({ params }: { params: { id: string } }) {
  const property = await getProperty(params.id)

  return (
    <div className="container mx-auto px-4 py-8">
      <Suspense fallback={<PropertyEditSkeleton />}>
        <PropertyEditForm property={property} />
      </Suspense>
    </div>
  )
}

function PropertyEditSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <Skeleton className="h-8 w-64" />
        <div className="flex gap-2">
          <Skeleton className="h-10 w-24" />
          <Skeleton className="h-10 w-32" />
        </div>
      </div>

      <Skeleton className="h-[600px] w-full" />
      <Skeleton className="h-[300px] w-full" />
    </div>
  )
}
