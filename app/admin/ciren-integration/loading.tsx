import { Card, CardContent, CardHeader } from "@/components/ui/card"

export default function Loading() {
  return (
    <div className="container mx-auto py-6">
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <div className="h-8 bg-gray-200 rounded animate-pulse"></div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="h-10 bg-gray-200 rounded animate-pulse"></div>
              <div className="flex gap-2">
                <div className="h-8 w-32 bg-gray-200 rounded animate-pulse"></div>
                <div className="h-8 w-32 bg-gray-200 rounded animate-pulse"></div>
                <div className="h-8 w-32 bg-gray-200 rounded animate-pulse"></div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
