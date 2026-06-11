import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import JSZip from 'jszip'
import { KMZReader } from '@/lib/kmz/kmz-reader'

export const dynamic = 'force-dynamic'

/**
 * POST /api/admin/kmz/migrate-placemarks-count
 * 
 * Re-procesa todos los archivos KMZ almacenados en Supabase
 * con el nuevo parser que extrae placemarks de dentro de Folders.
 * 
 * Actualiza `placemarks_count` en la tabla `kmz_collection` con los valores correctos.
 */
export async function POST(request: NextRequest) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
    
    const supabase = createClient(supabaseUrl, serviceRoleKey)
    
    // Obtener todos los KMZ de la tabla kmz_collection
    const { data: kmzFiles, error: fetchError } = await supabase
      .from('kmz_collection')
      .select('id, file_name, file_path')
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .limit(100) // Process max 100 files per request to avoid timeout

    if (fetchError) {
      return NextResponse.json(
        { error: `Error fetching KMZ files: ${fetchError.message}` },
        { status: 500 }
      )
    }

    if (!kmzFiles || kmzFiles.length === 0) {
      return NextResponse.json(
        { message: 'No active KMZ files to process', processed: 0 },
        { status: 200 }
      )
    }

    const results: Array<{
      fileName: string
      oldCount: number | null
      newCount: number
      status: 'success' | 'error'
      error?: string
    }> = []

    // Para cada KMZ, descargar y re-parsear
    for (const kmzFile of kmzFiles) {
      try {
        // Obtener el placemarks_count actual
        const { data: current } = await supabase
          .from('kmz_collection')
          .select('placemarks_count')
          .eq('id', kmzFile.id)
          .single()

        const oldCount = current?.placemarks_count || 0

        // Descargar el archivo de Storage
        const { data, error: downloadError } = await supabase
          .storage
          .from('kmz-files')
          .download(kmzFile.file_path)

        if (downloadError) {
          throw new Error(`Download failed: ${downloadError?.message || JSON.stringify(downloadError)}`)
        }
        
        if (!data) {
          throw new Error(`No data returned from storage for file: ${kmzFile.file_path}`)
        }

        // Leer el ZIP
        const kmzZip = new JSZip()
        const unzipped = await kmzZip.loadAsync(data)

        // Encontrar y parsear el KML
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

        // Re-parsear con el nuevo parser
        const reader = new KMZReader()
        const kmzData = (reader as any)['parseKML'](kmlContent, kmzFile.file_name)

        const newCount = kmzData.placemarks.length

        // Actualizar placemarks_count
        const { error: updateError } = await supabase
          .from('kmz_collection')
          .update({ placemarks_count: newCount })
          .eq('id', kmzFile.id)

        if (updateError) {
          throw new Error(`Update failed: ${updateError.message}`)
        }

        results.push({
          fileName: kmzFile.file_name,
          oldCount,
          newCount,
          status: 'success'
        })
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : String(err)
        results.push({
          fileName: kmzFile.file_name,
          oldCount: null,
          newCount: 0,
          status: 'error',
          error: errorMsg
        })
      }
    }

    const successCount = results.filter((r) => r.status === 'success').length
    const errorCount = results.filter((r) => r.status === 'error').length

    return NextResponse.json(
      {
        message: `KMZ migration completed (processed first ${kmzFiles.length} most recent files - call endpoint again to process more)`,
        processed: kmzFiles.length,
        successful: successCount,
        failed: errorCount,
        details: results
      },
      { status: 200 }
    )
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : String(err)
    return NextResponse.json(
      { error: `Migration failed: ${errorMsg}` },
      { status: 500 }
    )
  }
}
