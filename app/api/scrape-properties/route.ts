import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

export async function POST(request: Request) {
  try {
    // Initialize Supabase client at runtime
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    const { urls } = await request.json()

    if (!urls || !Array.isArray(urls) || urls.length === 0) {
      return NextResponse.json({ error: "Invalid URLs provided" }, { status: 400 })
    }

    // Process a batch of URLs (limit to 10 for performance)
    const urlsToProcess = urls.slice(0, 10)
    const results = []
    const errors = []

    for (const url of urlsToProcess) {
      try {
        // In a real implementation, this would:
        // 1. Fetch the HTML from the URL
        // 2. Use a library like cheerio to parse the HTML
        // 3. Extract property data from the parsed HTML
        // 4. Insert the data into the database

        // For now, we'll simulate this process

        // Extract property ID or slug from URL
        const urlParts = url.split("/")
        const slug = urlParts[urlParts.length - 2] || urlParts[urlParts.length - 1]

        // Generate simulated property data
        const property = {
          title: `Propiedad en ${slug.replace(/-/g, " ").replace(/^\w/, (c) => c.toUpperCase())}`,
          description: `Esta hermosa propiedad ubicada en ${slug.replace(/-/g, " ")} ofrece una experiencia única en el sur de Chile.`,
          price: Math.floor(Math.random() * 500000000) + 100000000,
          location: slug.includes("lago") ? "Orilla de Lago" : "Sur de Chile",
          address: `Camino ${slug.replace(/-/g, " ")} km ${Math.floor(Math.random() * 20) + 1}`,
          city: getRandomCity(),
          region: "Los Lagos",
          bedrooms: Math.floor(Math.random() * 5) + 1,
          bathrooms: Math.floor(Math.random() * 4) + 1,
          area: Math.floor(Math.random() * 200) + 80,
          land_area: Math.floor(Math.random() * 10000) + 500,
          property_type: getRandomPropertyType(),
          status: "available",
          featured: Math.random() > 0.7,
          images: [
            { url: `/placeholder.svg?key=${slug}-main`, is_main: true },
            { url: `/placeholder.svg?key=${slug}-2`, is_main: false },
            { url: `/placeholder.svg?key=${slug}-3`, is_main: false },
          ],
        }

        // In a real implementation, you would insert the property into the database here

        results.push({
          url,
          property,
          success: true,
        })
      } catch (error: any) {
        errors.push({
          url,
          error: error.message || "Failed to scrape property",
          success: false,
        })
      }
    }

    return NextResponse.json({
      processed: urlsToProcess.length,
      successful: results.length,
      failed: errors.length,
      results,
      errors,
    })
  } catch (error: any) {
    console.error("Error processing URLs:", error)
    return NextResponse.json({ error: error.message || "Failed to process URLs" }, { status: 500 })
  }
}

// Helper functions
function getRandomCity() {
  const cities = ["Puerto Varas", "Puerto Montt", "Frutillar", "Osorno", "Valdivia", "Pucón"]
  return cities[Math.floor(Math.random() * cities.length)]
}

function getRandomPropertyType() {
  const types = ["house", "apartment", "land", "rural", "commercial"]
  return types[Math.floor(Math.random() * types.length)]
}
