"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { supabase } from "@/lib/supabase/client"

interface PropertyData {
  title: string
  description: string | null
  price: number | null
  location: string | null
  address: string | null
  city: string | null
  region: string | null
  bedrooms: number | null
  bathrooms: number | null
  area: number | null
  land_area: number | null
  property_type: string | null
  status: string
  featured: boolean
  images: { url: string; is_main: boolean }[]
}

export default function AdvancedPropertyImporter() {
  const [urls, setUrls] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isScraping, setIsScraping] = useState(false)
  const [progress, setProgress] = useState(0)
  const [results, setResults] = useState<{ success: number; failed: number }>({ success: 0, failed: 0 })
  const [error, setError] = useState<string | null>(null)
  const [scrapedProperties, setScrapedProperties] = useState<PropertyData[]>([])

  const fetchCSV = async () => {
    setIsLoading(true)
    setError(null)

    try {
      const csvUrl =
        "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/yourgpt_extracted_links-u5ZFbAvZWK93DxAnMMB6TIwYGEOItO.csv"
      const response = await fetch(csvUrl)

      if (!response.ok) {
        throw new Error(`Failed to fetch CSV: ${response.status} ${response.statusText}`)
      }

      const csvText = await response.text()

      // Parse CSV (assuming simple format with header row)
      const lines = csvText.split("\n").filter((line) => line.trim())
      const header = lines[0]
      const dataRows = lines.slice(1)

      // Extract URLs (assuming URL is the only column or first column)
      const extractedUrls = dataRows
        .map((row) => {
          // Handle both quoted and unquoted values
          const match = row.match(/^"([^"]+)"$/) || row.match(/^([^,]+)/)
          return match ? match[1].trim() : row.trim()
        })
        .filter((url) => url.startsWith("https://"))

      setUrls(extractedUrls)
    } catch (err: any) {
      console.error("Error fetching CSV:", err)
      setError(err.message || "Failed to fetch property URLs")
    } finally {
      setIsLoading(false)
    }
  }

  const scrapeProperties = async () => {
    if (urls.length === 0) {
      setError("No URLs to scrape. Please fetch URLs first.")
      return
    }

    setIsScraping(true)
    setProgress(0)
    setResults({ success: 0, failed: 0 })
    setScrapedProperties([])
    setError(null)

    const properties: PropertyData[] = []
    let successCount = 0
    let failedCount = 0

    // Process URLs in batches to avoid overwhelming the server
    const batchSize = 10
    const totalBatches = Math.ceil(urls.length / batchSize)

    for (let i = 0; i < urls.length; i += batchSize) {
      const batch = urls.slice(i, i + batchSize)

      try {
        // Call the server-side API to process this batch
        const response = await fetch("/api/scrape-properties", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ urls: batch }),
        })

        if (!response.ok) {
          throw new Error(`API error: ${response.status} ${response.statusText}`)
        }

        const data = await response.json()

        // Process successful results
        if (data.results && Array.isArray(data.results)) {
          data.results.forEach((result: any) => {
            if (result.success && result.property) {
              properties.push(result.property)
              successCount++
            } else {
              failedCount++
            }
          })
        }

        // Process errors
        if (data.errors && Array.isArray(data.errors)) {
          failedCount += data.errors.length
        }
      } catch (err: any) {
        console.error("Error processing batch:", err)
        failedCount += batch.length
      }

      // Update progress
      const currentProgress = Math.min(100, Math.round(((i + batch.length) / urls.length) * 100))
      setProgress(currentProgress)
      setResults({ success: successCount, failed: failedCount })

      // Small delay to allow UI to update
      await new Promise((resolve) => setTimeout(resolve, 100))
    }

    setScrapedProperties(properties)
    setIsScraping(false)
  }

  const importToDatabase = async () => {
    if (scrapedProperties.length === 0) {
      setError("No properties to import. Please scrape properties first.")
      return
    }

    setIsLoading(true)
    setError(null)
    let successCount = 0
    let failedCount = 0

    try {
      for (const property of scrapedProperties) {
        try {
          const { images, ...propertyData } = property

          // Insert property
          const { data: propertyResult, error: propertyError } = await supabase
            .from("properties")
            .insert(propertyData)
            .select("id")
            .single()

          if (propertyError) throw propertyError

          // Insert images for this property
          if (propertyResult && images && images.length > 0) {
            const imagesWithPropertyId = images.map((image) => ({
              ...image,
              property_id: propertyResult.id,
            }))

            const { error: imagesError } = await supabase.from("property_images").insert(imagesWithPropertyId)

            if (imagesError) throw imagesError
          }

          successCount++
        } catch (error) {
          console.error("Error importing property:", error)
          failedCount++
        }
      }

      setResults({
        success: successCount,
        failed: failedCount,
      })
    } catch (err: any) {
      console.error("Error importing properties:", err)
      setError(err.message || "Failed to import properties")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Advanced Property Importer</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          <div>
            <Button onClick={fetchCSV} disabled={isLoading || isScraping} className="mb-2">
              {isLoading ? "Fetching URLs..." : "1. Fetch Property URLs"}
            </Button>
            {urls.length > 0 && <p className="text-sm text-gray-600">Found {urls.length} property URLs</p>}
          </div>

          <div>
            <Button onClick={scrapeProperties} disabled={isLoading || isScraping || urls.length === 0} className="mb-2">
              {isScraping ? "Scraping Properties..." : "2. Scrape Property Data"}
            </Button>

            {isScraping && (
              <div className="mt-2">
                <Progress value={progress} className="h-2" />
                <p className="text-sm text-gray-600 mt-1">
                  Progress: {progress}% ({results.success} successful, {results.failed} failed)
                </p>
              </div>
            )}

            {!isScraping && scrapedProperties.length > 0 && (
              <p className="text-sm text-gray-600">Scraped {scrapedProperties.length} properties</p>
            )}
          </div>

          <div>
            <Button
              onClick={importToDatabase}
              disabled={isLoading || isScraping || scrapedProperties.length === 0}
              className="mb-2"
            >
              {isLoading ? "Importing to Database..." : "3. Import to Database"}
            </Button>

            {!isLoading && results.success > 0 && (
              <p className="text-sm text-gray-600">
                Imported {results.success} properties successfully
                {results.failed > 0 ? `, ${results.failed} failed` : ""}
              </p>
            )}
          </div>

          {error && <div className="p-4 bg-red-50 text-red-800 rounded-md">{error}</div>}

          {scrapedProperties.length > 0 && (
            <div>
              <h3 className="font-semibold mb-2">Scraped Properties:</h3>
              <div className="max-h-60 overflow-y-auto border rounded-md p-2 bg-gray-50">
                <ul className="space-y-2">
                  {scrapedProperties.map((property, index) => (
                    <li key={index} className="text-sm border-b pb-2 last:border-0 last:pb-0">
                      <div className="font-medium">{property.title}</div>
                      <div className="text-gray-600">
                        {property.bedrooms} dorm. | {property.bathrooms} baños | {property.area} m²
                      </div>
                      <div className="text-primary font-semibold">${property.price?.toLocaleString("es-CL")}</div>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
