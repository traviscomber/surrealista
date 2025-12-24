"use client"

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { KMZNeighborhoodAnalyzer } from "@/components/kmz/kmz-neighborhood-analyzer"
import { MapPin } from "lucide-react"

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
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <div className="p-2 bg-emerald-100 rounded-lg">
              <MapPin className="h-5 w-5 text-emerald-600" />
            </div>
            Análisis de Vecindario {kmz?.file_name && `- ${kmz.file_name}`}
          </DialogTitle>
          <DialogDescription>
            Identifica roles vecinos, accesos, distancias y obtén información de fuentes gubernamentales chilenas
          </DialogDescription>
        </DialogHeader>
        <div className="max-h-[calc(90vh-120px)] overflow-y-auto">
          {kmz && <KMZNeighborhoodAnalyzer kmzFile={kmz} />}
        </div>
      </DialogContent>
    </Dialog>
  )
}
