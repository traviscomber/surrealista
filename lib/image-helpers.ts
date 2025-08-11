// Sample property images
const sampleImages = [
  "/images/property-sample-1.png",
  "/images/property-sample-2.png",
  "/images/property-sample-3.png",
  "/images/property-sample-4.png",
  "/images/property-sample-5.png",
  "/images/property-sample-6.png",
]

/**
 * Get a sample property image based on an ID or number
 * @param id - Property ID or number to use for selecting an image
 * @returns URL to a sample property image
 */
export function getSamplePropertyImage(id: string | number): string {
  // Convert string IDs to numbers if needed
  let numericId: number
  if (typeof id === "string") {
    // Extract numeric part if it's a string like "sample-1"
    const match = id.match(/\d+/)
    numericId = match ? Number.parseInt(match[0], 10) : 0

    // If no numeric part found, use string hash
    if (!match) {
      numericId = id.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0)
    }
  } else {
    numericId = id
  }

  // Use modulo to get an index within the array bounds
  const index = numericId % sampleImages.length
  return sampleImages[index]
}

/**
 * Generate a placeholder image URL with a custom query
 * @param query - Description of the image to generate
 * @returns URL to a placeholder image
 */
export function getPlaceholderImage(query: string): string {
  return `/placeholder.svg?height=600&width=800&query=${encodeURIComponent(query)}`
}
