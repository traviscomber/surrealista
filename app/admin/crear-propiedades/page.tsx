import { Suspense } from "react"
import SeedFeaturedProperties from "@/scripts/seed-featured-properties"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Home } from "lucide-react"

function LoadingSkeleton() {
  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center gap-3 mb-6">
        <Home className="h-8 w-8 text-green-600" />
        <div>
          <div className="h-8 bg-gray-200 rounded w-96 animate-pulse" />
          <div className="h-4 bg-gray-200 rounded w-64 mt-2 animate-pulse" />
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <div className="h-5 w-5 bg-gray-200 rounded animate-pulse" />
            <div className="h-6 bg-gray-200 rounded w-48 animate-pulse" />
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="h-32 bg-gray-200 rounded animate-pulse" />
              ))}
            </div>
            <div className="h-10 bg-gray-200 rounded animate-pulse" />
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default function CreatePropertiesPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Suspense fallback={<LoadingSkeleton />}>
        <SeedFeaturedProperties />
      </Suspense>
    </div>
  )
}
