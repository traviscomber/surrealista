export async function indexAllKMZLocations(): Promise<never> {
  throw new Error(
    "Legacy KMZ mass indexing is retired. Use the canonical kmz_collection/kmz_placemarks processing pipeline instead.",
  )
}
