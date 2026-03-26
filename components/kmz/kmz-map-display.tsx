'use client'

import dynamic from 'next/dynamic'

const KmzMapViewer = dynamic(() => import('./kmz-map-viewer'), {
  ssr: false,
  loading: () => <div className="w-full h-full bg-gray-100 flex items-center justify-center">Cargando mapa...</div>,
})

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

export default function KMZMapDisplay({
  kmzFiles,
  centerCoordinates = [-30.6, -71.5],
  height = '100%',
  enableGeocoding = true,
  selectedKmzId = null,
}: KMZMapDisplayProps) {
  return (
    <div style={{ height }}>
      <KmzMapViewer
        kmzFiles={kmzFiles}
        centerCoordinates={centerCoordinates}
        enableGeocoding={enableGeocoding}
        selectedKmzId={selectedKmzId}
      />
    </div>
  )
}
