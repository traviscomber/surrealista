#!/usr/bin/env node

/**
 * Script para procesar TODOS los KMZ files
 * Llama el endpoint de migración múltiples veces hasta que todos estén procesados
 * 
 * Usage: node scripts/migrate-all-kmz.js
 */

const API_URL = process.env.API_URL || 'http://localhost:3000'
const BATCH_SIZE = 100

async function migrateAllKMZ() {
  let offset = 0
  let totalProcessed = 0
  let totalSuccessful = 0
  let totalFailed = 0
  const allErrors = []

  console.log('[v0] Starting KMZ migration for ALL 2324 files...')
  console.log(`[v0] API URL: ${API_URL}`)
  console.log(`[v0] Batch size: ${BATCH_SIZE}`)
  console.log('')

  // Calcular cuántos batches necesitamos
  const totalEstimated = 2324
  const totalBatches = Math.ceil(totalEstimated / BATCH_SIZE)
  console.log(`[v0] Total files: ~${totalEstimated}`)
  console.log(`[v0] Total batches needed: ${totalBatches}`)
  console.log('')

  // Procesar en batches
  for (let batchNum = 0; batchNum < totalBatches; batchNum++) {
    offset = batchNum * BATCH_SIZE

    console.log(`[v0] === BATCH ${batchNum + 1}/${totalBatches} (offset: ${offset}) ===`)

    try {
      const response = await fetch(`${API_URL}/api/admin/kmz/migrate-placemarks-count`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ offset })
      })

      if (!response.ok) {
        throw new Error(`API returned status ${response.status}`)
      }

      const data = await response.json()

      console.log(`[v0] Batch processed: ${data.processed} files`)
      console.log(`[v0] Successful: ${data.successful}, Failed: ${data.failed}`)

      // Mostrar detalles de errores
      if (data.details && data.failed > 0) {
        const errors = data.details.filter(d => d.status === 'error')
        errors.forEach(error => {
          console.log(`[v0]   ❌ ${error.fileName}: ${error.error}`)
          allErrors.push({
            offset,
            fileName: error.fileName,
            error: error.error
          })
        })
      }

      // Mostrar algunos éxitos
      if (data.details && data.successful > 0) {
        const successes = data.details.filter(d => d.status === 'success').slice(0, 3)
        successes.forEach(success => {
          console.log(`[v0]   ✅ ${success.fileName}: ${success.oldCount || '?'} → ${success.newCount}`)
        })
        if (data.successful > 3) {
          console.log(`[v0]   ... and ${data.successful - 3} more`)
        }
      }

      totalProcessed += data.processed
      totalSuccessful += data.successful
      totalFailed += data.failed

      // Si no hay más archivos, salir
      if (data.processed === 0) {
        console.log(`[v0] No more files to process. Stopping.`)
        break
      }

      console.log(`[v0] Cumulative: ${totalProcessed} processed, ${totalSuccessful} successful, ${totalFailed} failed`)
      console.log('')

      // Esperar un segundo entre batches para no sobrecargar el servidor
      await new Promise(resolve => setTimeout(resolve, 1000))
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error)
      console.error(`[v0] ❌ Error processing batch ${batchNum + 1}: ${errorMsg}`)
      console.error(`[v0] Retrying batch...`)

      // Reintentar una vez
      await new Promise(resolve => setTimeout(resolve, 2000))

      try {
        const retryResponse = await fetch(`${API_URL}/api/admin/kmz/migrate-placemarks-count`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ offset })
        })

        if (retryResponse.ok) {
          const retryData = await retryResponse.json()
          totalProcessed += retryData.processed
          totalSuccessful += retryData.successful
          totalFailed += retryData.failed
          console.log(`[v0] ✅ Retry successful for batch ${batchNum + 1}`)
        }
      } catch (retryError) {
        console.error(`[v0] ❌ Retry also failed: ${retryError}`)
      }
    }
  }

  // Resumen final
  console.log('')
  console.log('='.repeat(60))
  console.log('[v0] === MIGRATION COMPLETE ===')
  console.log(`[v0] Total files processed: ${totalProcessed}`)
  console.log(`[v0] Total successful: ${totalSuccessful}`)
  console.log(`[v0] Total failed: ${totalFailed}`)

  if (allErrors.length > 0) {
    console.log('')
    console.log('[v0] Errors encountered:')
    allErrors.forEach(err => {
      console.log(`[v0]   - ${err.fileName}: ${err.error}`)
    })
  }

  console.log('='.repeat(60))
  console.log('')
  console.log(`[v0] Success rate: ${totalSuccessful}/${totalProcessed} (${((totalSuccessful / totalProcessed) * 100).toFixed(1)}%)`)
}

// Ejecutar
migrateAllKMZ().catch(err => {
  console.error('[v0] Fatal error:', err)
  process.exit(1)
})
