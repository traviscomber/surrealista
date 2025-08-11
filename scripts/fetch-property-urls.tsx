"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default function FetchPropertyUrls() {
  const [urls, setUrls] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

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

  return (
    <Card>
      <CardHeader>
        <CardTitle>Fetch Property URLs</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="mb-4">
          <p>Fetch property URLs from the provided CSV file. This will load all URLs from:</p>
          <p className="text-sm text-gray-500 mt-1 break-all">
            https://hebbkx1anhila5yf.public.blob.vercel-storage.com/yourgpt_extracted_links-u5ZFbAvZWK93DxAnMMB6TIwYGEOItO.csv
          </p>
        </div>

        <Button onClick={fetchCSV} disabled={isLoading} className="mb-4">
          {isLoading ? "Fetching URLs..." : "Fetch Property URLs"}
        </Button>

        {error && <div className="p-4 mb-4 bg-red-50 text-red-800 rounded-md">{error}</div>}

        {urls.length > 0 && (
          <div>
            <h3 className="font-semibold mb-2">Found {urls.length} property URLs:</h3>
            <div className="max-h-60 overflow-y-auto border rounded-md p-2 bg-gray-50">
              <ul className="space-y-1">
                {urls.map((url, index) => (
                  <li key={index} className="text-sm truncate">
                    {url}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
