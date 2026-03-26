'use client'

interface KMZFile {
  id: string
  name: string
  region?: string
  [key: string]: any
}

interface KMZMapDisplayProps {
  kmzFiles: KMZFile[]
  centerCoordinates?: [number, number]
  height?: string
  enableGeocoding?: boolean
  selectedKmzId?: string
  onKmzSelect?: (kmzId: string) => void
}

export function KMZMapDisplay({
  kmzFiles,
  centerCoordinates = [-23.6345, -46.6191],
  height = "100%",
  enableGeocoding = true,
  selectedKmzId,
  onKmzSelect
}: KMZMapDisplayProps) {
  
  // Filter KMZ files - if selectedKmzId is set, show only that KMZ
  const displayedKmzFiles = selectedKmzId
    ? kmzFiles.filter(kmz => kmz.id === selectedKmzId)
    : kmzFiles

  return (
    <div style={{ height, width: '100%' }} className="bg-gray-100 flex items-center justify-center">
      <div className="text-center">
        <p className="text-gray-600 mb-2">
          {selectedKmzId 
            ? `Mostrando 1 KMZ seleccionado` 
            : `Mostrando ${displayedKmzFiles.length} archivos KMZ`}
        </p>
        <p className="text-sm text-gray-500">
          Mapa con{selectedKmzId ? ' KMZ seleccionado' : ' detalles de ubicaciones'}
        </p>
      </div>
    </div>
  )
}
