import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

export default function CIRENDashboardLoading() {
  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header Skeleton */}
      <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
        <div className="space-y-2">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-4 w-96" />
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-10 w-32" />
          <Skeleton className="h-10 w-24" />
        </div>
      </div>

      {/* Filtros Skeleton */}
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-40" />
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="space-y-2">
                <Skeleton className="h-4 w-16" />
                <Skeleton className="h-10 w-full" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Métricas Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i}>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div className="space-y-2">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-8 w-16" />
                </div>
                <Skeleton className="h-8 w-8 rounded" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Tabs Skeleton */}
      <div className="space-y-6">
        <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg w-fit">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-8 w-32" />
          ))}
        </div>

        {/* Content Skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[1, 2].map((i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-6 w-48" />
              </CardHeader>
              <CardContent className="space-y-3">
                {[1, 2, 3, 4].map((j) => (
                  <div key={j} className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Skeleton className="h-6 w-12" />
                      <Skeleton className="h-4 w-20" />
                    </div>
                    <Skeleton className="h-2 w-20" />
                  </div>
                ))}
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Lista de empresas skeleton */}
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-40" />
            <Skeleton className="h-4 w-64" />
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center space-x-2">
                      <Skeleton className="h-5 w-48" />
                      <Skeleton className="h-5 w-8" />
                      <Skeleton className="h-5 w-16" />
                    </div>
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-4 w-40" />
                  </div>
                  <div className="text-right space-y-1">
                    <Skeleton className="h-5 w-16" />
                    <Skeleton className="h-4 w-20" />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
