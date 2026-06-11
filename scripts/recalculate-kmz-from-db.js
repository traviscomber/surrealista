/**
 * Recalculate placemarks_count directly from kmz_location_index table
 * Processes ALL 2324 files in batches
 */

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('[v0] Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function recalculatePlacemarksCountBatch() {
  try {
    console.log('[v0] Starting batch DB recalculation for ALL KMZ...');
    
    const batchSize = 500;
    let offset = 0;
    let totalProcessed = 0;
    let totalSuccessful = 0;
    let totalFailed = 0;

    let hasMore = true;

    while (hasMore) {
      console.log(`\n[v0] Processing batch at offset ${offset}...`);

      // Get batch of KMZ files
      const { data: kmzFiles, error: kmzError } = await supabase
        .from('kmz_collection')
        .select('id, file_name')
        .eq('is_active', true)
        .range(offset, offset + batchSize - 1);

      if (kmzError) throw kmzError;

      if (kmzFiles.length === 0) {
        console.log('[v0] No more files to process');
        hasMore = false;
        break;
      }

      console.log(`[v0] Found ${kmzFiles.length} files in this batch`);

      // Process each KMZ in batch
      for (const kmz of kmzFiles) {
        try {
          // Count locations for this KMZ from the index
          const { count, error: countError } = await supabase
            .from('kmz_location_index')
            .select('id', { count: 'exact', head: true })
            .eq('kmz_id', kmz.id);

          if (countError) throw countError;

          const placemarksCount = count || 0;

          // Update the kmz_collection table
          const { error: updateError } = await supabase
            .from('kmz_collection')
            .update({ placemarks_count: placemarksCount })
            .eq('id', kmz.id);

          if (updateError) throw updateError;

          if (placemarksCount > 1) {
            console.log(`[v0] ✅ ${kmz.file_name}: ${placemarksCount} placemarks`);
          }
          totalSuccessful++;

        } catch (error) {
          console.log(`[v0] ❌ ${kmz.file_name}: ${error.message}`);
          totalFailed++;
        }

        // Rate limiting
        await new Promise(resolve => setTimeout(resolve, 5));
      }

      totalProcessed += kmzFiles.length;
      offset += batchSize;

      console.log(`[v0] Batch complete. Total processed so far: ${totalProcessed}`);

      if (kmzFiles.length < batchSize) {
        hasMore = false;
      }
    }

    console.log(`\n[v0] ========== MIGRATION COMPLETE ==========`);
    console.log(`[v0] Total files processed: ${totalProcessed}`);
    console.log(`[v0] Successful: ${totalSuccessful}`);
    console.log(`[v0] Failed: ${totalFailed}`);
    
  } catch (error) {
    console.error('[v0] Fatal error:', error.message);
    process.exit(1);
  }
}

recalculatePlacemarksCountBatch();
