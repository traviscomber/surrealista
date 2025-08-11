import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Activity, BarChart3, Bell, FileText, MessageSquare } from "lucide-react"

export default function Loading() {
  return (
    <div className="container mx-auto p-6 space-y-8">
      {/* Header Skeleton */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <Activity className="h-8 w-8 text-blue-600" />
            <Skeleton className="h-8 w-64" />
          </div>
          <Skeleton className="h-4 w-96" />
        </div>
      </div>

      {/* Tabs Skeleton */}
      <div className="space-y-6">
        <div className="grid w-full grid-cols-4 gap-2 p-1 bg-muted rounded-lg">
          <div className="flex items-center justify-center gap-2 p-2">
            <BarChart3 className="h-4 w-4" />
            <Skeleton className="h-4 w-24" />
          </div>
          <div className="flex items-center justify-center gap-2 p-2">
            <Bell className="h-4 w-4" />
            <Skeleton className="h-4 w-32" />
          </div>
          <div className="flex items-center justify-center gap-2 p-2">
            <FileText className="h-4 w-4" />
            <Skeleton className="h-4 w-28" />
          </div>
          <div className="flex items-center justify-center gap-2 p-2">
            <MessageSquare className="h-4 w-4" />
            <Skeleton className="h-4 w-24" />
          </div>
        </div>

        {/* Content Skeleton */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Skeleton className="h-5 w-5" />
              <Skeleton className="h-6 w-48" />
            </div>
            <Skeleton className="h-4 w-72" />
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Stats Cards Skeleton */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <Card key={i}>
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <Skeleton className="h-4 w-20" />
                      <Skeleton className="h-4 w-4" />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <Skeleton className="h-8 w-16 mb-2" />
                    <Skeleton className="h-3 w-24" />
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Chart Skeleton */}
            <Card>
              <CardHeader>
                <Skeleton className="h-6 w-32" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-64 w-full" />
              </CardContent>
            </Card>

            {/* Table Skeleton */}
            <Card>
              <CardHeader>
                <Skeleton className="h-6 w-40" />
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <div key={i} className="flex items-center space-x-4">
                      <Skeleton className="h-4 w-4" />
                      <Skeleton className="h-4 w-32" />
                      <Skeleton className="h-4 w-20" />
                      <Skeleton className="h-4 w-16" />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
