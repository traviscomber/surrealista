import { createClient } from '@supabase/supabase-js'
import JSZip from 'jszip'
import { KMZReader } from '@/lib/kmz/kmz-reader'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(supabaseUrl, serviceRoleKey)

/**
 * Script de migración: Re-procesa todos los KMZ archivos en Supabase Storage
 * con el nuevo parser que extrae placemarks de dentro de Folders.
 * 
 * Actualiza `placemarks_count` en la tabla `kmz_collection` con los valores correctos.
 */
async function reprocessAllKMZFiles() {
  console.log('🔄 Iniciando re-procesamiento de archivos KMZ...')

  try {
    // 1. Obtener todos los KMZ de la tabla kmz_collection
    const { data: kmzFiles, error: fetchError } = await supabase
      .from('kmz_collection')
      .select('id, file_name, file_path')
      .eq('is_active', true)

    if (fetchError) {
      throw new Error(`Error al obtener KMZ: ${fetchError.message}`)
    }

    if (!kmzFiles || kmzFiles.length === 0) {
      console.log('ℹ️  No hay archivos KMZ activos para procesar')
      return
    }

    console.log(`📦 Encontrados ${kmzFiles.length} archivos KMZ`)

    let successCount = 0
    let errorCount = 0

    // 2. Para cada KMZ, descargar y re-parsear
    for (const kmzFile of kmzFiles) {
      try {
        console.log(`\n📄 Procesando: ${kmzFile.file_name}`)

        // Descargar el archivo de Storage
        const { data, error: downloadError } = await supabase
          .storage
          .from('kmz-files')
          .download(kmzFile.file_path)

        if (downloadError) {
          throw new Error(`Error descargando: ${downloadError.message}`)
        }

        // Leer el ZIP
        const kmzZip = new JSZip()
        const unzipped = await kmzZip.loadAsync(data)

        // Encontrar el archivo KML dentro del ZIP
        let kmlContent: string | null = null
        for (const [fileName, file] of Object.entries(unzipped.files)) {
          if (fileName.endsWith('.kml')) {
            kmlContent = await file.async('string')
            break
          }
        }

        if (!kmlContent) {
          throw new Error('No KML file found in ZIP')
        }

        // Re-parsear con el nuevo parser usando KMZReader
        const reader = new KMZReader()
        const kmzData = reader['parseKML'](kmlContent, kmzFile.file_name)

        console.log(
          `✅ Parsed: ${kmzData.placemarks.length} placemarks encontrados`
        )

        // 3. Actualizar placemarks_count en la tabla
        const { error: updateError } = await supabase
          .from('kmz_collection')
          .update({ placemarks_count: kmzData.placemarks.length })
          .eq('id', kmzFile.id)

        if (updateError) {
          throw new Error(`Error actualizando BD: ${updateError.message}`)
        }

        console.log(
          `💾 Actualizado placemarks_count a ${kmzData.placemarks.length}`
        )
        successCount++
      } catch (err) {
        const error = err instanceof Error ? err.message : String(err)
        console.error(`❌ Error procesando ${kmzFile.file_name}: ${error}`)
        errorCount++
      }
    }

    console.log(`\n📊 Resumen:`)
    console.log(`  ✅ Exitosos: ${successCount}`)
    console.log(`  ❌ Errores: ${errorCount}`)
    console.log(`\n✨ Re-procesamiento completado!`)
  } catch (err) {
    const error = err instanceof Error ? err.message : String(err)
    console.error('🚨 Error fatal:', error)
    process.exit(1)
  }
}

// Ejecutar
reprocessAllKMZFiles()
