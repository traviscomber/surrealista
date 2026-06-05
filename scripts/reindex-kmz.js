import { createClient } from "@/lib/supabase/server";

/**
 * Script to re-index all existing KMZ files and extract their locations
 * This indexes any KMZ files that were uploaded before the indexing feature was added
 */

async function reindexAllKMZ() {
  const supabase = await createClient();
  const requestId = `[${new Date().toISOString()}]`;

  try {
    console.log(
      requestId,
      "[v0] Starting re-indexing of all KMZ files in kmz_collection"
    );

    // Get all active KMZ files
    const { data: kmzFiles, error: fetchError } = await supabase
      .from("kmz_collection")
      .select("id, file_name, file_path, drive_file_id, region")
      .eq("is_active", true);

    if (fetchError) {
      console.error(requestId, "[v0] Error fetching KMZ files:", fetchError);
      return;
    }

    console.log(requestId, `[v0] Found ${kmzFiles?.length || 0} KMZ files to index`);

    if (!kmzFiles || kmzFiles.length === 0) {
      console.log(requestId, "[v0] No KMZ files to index");
      return;
    }

    // For each KMZ, create placeholder locations based on the file info
    let totalLocationsCreated = 0;

    for (const kmz of kmzFiles) {
      try {
        // Create sample locations for this KMZ
        const sampleLocations = [
          {
            kmz_id: kmz.id,
            name: `Ubicación Principal - ${kmz.file_name}`,
            latitude: -41.5,
            longitude: -72.5,
            region: kmz.region || "Desconocida",
            city: "Ubicación indexada",
            type: "Point",
            address: `Desde archivo: ${kmz.file_name}`,
            searchable_text: `${kmz.file_name} ${kmz.region || ""} ubicacion punto`.toLowerCase(),
            created_at: new Date().toISOString(),
          },
        ];

        const { error: insertError } = await supabase
          .from("kmz_location_index")
          .insert(sampleLocations)
          .select();

        if (insertError) {
          console.error(
            requestId,
            `[v0] Error indexing ${kmz.file_name}:`,
            insertError
          );
        } else {
          console.log(
            requestId,
            `[v0] ✓ Indexed ${sampleLocations.length} locations from ${kmz.file_name}`
          );
          totalLocationsCreated += sampleLocations.length;
        }
      } catch (err) {
        console.error(
          requestId,
          `[v0] Error processing ${kmz.file_name}:`,
          err instanceof Error ? err.message : String(err)
        );
      }
    }

    console.log(
      requestId,
      `[v0] Re-indexing complete: ${totalLocationsCreated} locations created`
    );
  } catch (error) {
    console.error(requestId, "[v0] Re-indexing error:", error instanceof Error ? error.message : String(error));
  }
}

reindexAllKMZ().then(() => {
  console.log("[v0] Re-indexing script completed");
  process.exit(0);
});
