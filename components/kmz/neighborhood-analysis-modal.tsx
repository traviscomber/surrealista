"use client"

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { KMZNeighborhoodAnalyzer } from "@/components/kmz/kmz-neighborhood-analyzer"
import { MapPin, Badge } from "lucide-react"
import { useState, useEffect } from "react"
import { kmzStorageService } from "@/lib/kmz/kmz-storage-service"

interface KMZRecord {
  id: string
  file_name: string
  file_path: string
  region?: string
  [key: string]: unknown
}

interface NeighborhoodAnalysisModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  kmz?: KMZRecord | null
}

export function NeighborhoodAnalysisModal({ open, onOpenChange, kmz }: NeighborhoodAnalysisModalProps) {
  const [regionKmzFiles, setRegionKmzFiles] = useState<any[]>([])
  const [loadingRegion, setLoadingRegion] = useState(false)

  // Load region KMZ files when modal opens and region is available
  useEffect(() => {
    if (open && kmz?.region) {
      loadRegionKmzFiles(kmz.region)
    }
  }, [open, kmz?.region])

  const loadRegionKmzFiles = async (region: string) => {
    setLoadingRegion(true)
    try {
      const files = await kmzStorageService.loadKMZByRegion(region)
      setRegionKmzFiles(files)
    } catch (error) {
      console.error("[v0] Error loading region KMZ files:", error)
    } finally {
      setLoadingRegion(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <div className="p-2 bg-emerald-100 rounded-lg">
              <MapPin className="h-5 w-5 text-emerald-600" />
            </div>
            Análisis de Vecindario {kmz?.file_name && `- ${kmz.file_name}`}
            {kmz?.region && <Badge className="ml-2 bg-emerald-100 text-emerald-800">{kmz.region}</Badge>}
          </DialogTitle>
          <DialogDescription>
            Identifica roles vecinos, accesos, distancias y obtén información de fuentes gubernamentales chilenas
          </DialogDescription>
        </DialogHeader>
        <div className="max-h-[calc(90vh-120px)] overflow-y-auto">
          {kmz && (
            <KMZNeighborhoodAnalyzer
              selectedKmz={kmz}
              preloadedRegionFiles={regionKmzFiles}
              isLoadingRegionFiles={loadingRegion}
            />
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
