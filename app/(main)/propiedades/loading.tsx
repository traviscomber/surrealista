"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

export default function PropertiesLoading() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50">
      {/* Hero Section Skeleton */}
      <div className="relative bg-gradient-to-r from-blue-600 to-purple-600 text-white py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center space-y-6">
            <Skeleton className="h-12 w-3/4 mx-auto bg-white/20" />
            <Skeleton className="h-6 w-1/2 mx-auto bg-white/20" />
            <div className="max-w-2xl mx-auto">
              <Skeleton className="h-12 w-full bg-white/20 rounded-lg" />
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Filters Sidebar Skeleton */}
          <div className="lg:w-1/4">
            <Card className="sticky top-4">
              <CardContent className="p-6 space-y-6">
                <Skeleton className="h-6 w-24" />
                
                {/* Filter Groups */}
                {[1, 2, 3, 4].map((group) => (
                  <div key={group} className="space-y-3">
                    <Skeleton className="h-5 w-32" />
                    <div className="space-y-2">
                      {[1, 2, 3].map((item) => (
                        <div key={item} className="flex items-center space-x-2">
                          <Skeleton className="h-4 w-4" />
                          <Skeleton className="h-4 w-20" />
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          {/* Properties Grid Skeleton */}
          <div className="lg:w-3/4">
            <div className="flex justify-between items-center mb-6">
              <Skeleton className="h-6 w-48" />
              <div className="flex gap-2">
                <Skeleton className="h-10 w-10" />
                <Skeleton className="h-10 w-10" />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map((item) => (
                <Card key={item} className="overflow-hidden">
                  <Skeleton className="h-48 w-full" />
                  <CardContent className="p-4 space-y-3">
                    <Skeleton className="h-6 w-3/4" />
                    <Skeleton className="h-4 w-1/2" />
                    <Skeleton className="h-5 w-24" />
                    <div className="flex justify-between items-center">
                      <Skeleton className="h-4 w-16" />
                      <Skeleton className="h-8 w-20" />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
