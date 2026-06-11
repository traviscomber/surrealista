#!/usr/bin/env node

/**
 * Migración de placemarks_count para todos los 2324 KMZ files
 * 
 * Estrategia: Recalcular placemarks_count leyendo desde la tabla 
 * kmz_placemarks que ya tiene TODOS los placemarks indexados.
 * 
 * NO descarga archivos - usa los datos que ya están en BD.
 */

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error('[v0] Missing Supabase env vars');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey);

async function migrateAllKMZ() {
  console.log('[v0] Starting KMZ placemarks_count recalculation from indexed data...');
  console.log('[v0] API URL: http://localhost:3000');
  
  // Paso 1: Obtener TODOS los KMZ
  console.log('[v0] Fetching all 2324 KMZ files...');
  const { data: kmzFiles, error: fetchError } = await supabase
    .from('kmz_collection')
    .select('id, file_name')
    .eq('is_active', true)
    .order('created_at', { ascending: false });
  
  if (fetchError) {
    console.error('[v0] Error fetching KMZ files:', fetchError);
    process.exit(1);
  }
  
  console.log(`[v0] Found ${kmzFiles.length} KMZ files to process`);
  
  let successful = 0;
  let failed = 0;
  const updates = [];
  
  // Paso 2: Para cada KMZ, contar placemarks en BD y actualizar
  for (let i = 0; i < kmzFiles.length; i++) {
    const kmz = kmzFiles[i];
    
    // Contar placemarks para este KMZ
    const { count, error: countError } = await supabase
      .from('kmz_placemarks')
      .select('*', { count: 'exact', head: true })
      .eq('kmz_collection_id', kmz.id);
    
    if (countError) {
      console.log(`[v0] ❌ ${kmz.file_name}: Count error`);
      failed++;
      continue;
    }
    
    // Actualizar placemarks_count
    const { error: updateError } = await supabase
      .from('kmz_collection')
      .update({ placemarks_count: count })
      .eq('id', kmz.id);
    
    if (updateError) {
      console.log(`[v0] ❌ ${kmz.file_name}: Update error`);
      failed++;
    } else {
      successful++;
      updates.push({ name: kmz.file_name, count });
      
      // Log cada 50 para mostrar progreso
      if ((i + 1) % 50 === 0) {
        console.log(`[v0] Progress: ${i + 1}/${kmzFiles.length} - Successful: ${successful}`);
      }
    }
  }
  
  console.log(`\n[v0] === MIGRATION COMPLETE ===`);
  console.log(`[v0] Total processed: ${kmzFiles.length}`);
  console.log(`[v0] Successful: ${successful}`);
  console.log(`[v0] Failed: ${failed}`);
  console.log(`[v0] Sample updates: ${updates.slice(0, 3).map(u => `${u.name}: ${u.count} placemarks`).join(', ')}`);
}

migrateAllKMZ().catch(err => {
  console.error('[v0] Migration failed:', err);
  process.exit(1);
});
