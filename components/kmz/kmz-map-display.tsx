'use client'

import dynamic from 'next/dynamic'
import { useMemo } from 'react'

interface KMZFile {
  id?: string
  dbId?: number
  name: string
  location?: [number, number]
  placemarks_count?: number
}

interface KMZMapDisplayProps {
  kmzFiles: KMZFile[]
  centerCoordinates?: [number, number]
  height?: string
  enableGeocoding?: boolean
  selectedKmzId?: string | null
}

// Lazy load the viewer to avoid SSR issues
const KmzMapViewer = dynamic(() => import('./kmz-map-viewer'), { ssr: false })

export function KMZMapDisplay({
  kmzFiles,
  centerCoordinates,
  height = '100%',
  enableGeocoding = true,
  selectedKmzId = null,
}: KMZMapDisplayProps) {
  // Filter KMZ files based on selectedKmzId
  const filteredKmzFiles = useMemo(() => {
    if (!selectedKmzId) {
      return kmzFiles
    }
    return kmzFiles.filter((file) => {
      const fileId = (file.dbId || file.id)?.toString()
      return fileId === selectedKmzId.toString()
    })
  }, [kmzFiles, selectedKmzId])

  return (
    <div style={{ height, width: '100%' }}>
      <KmzMapViewer
        kmzFiles={filteredKmzFiles}
        centerCoordinates={centerCoordinates}
        enableGeocoding={enableGeocoding}
      />
    </div>
  )
}
