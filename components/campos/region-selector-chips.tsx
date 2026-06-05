"use client"

import React from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { X } from "lucide-react"

interface RegionSelectorChipsProps {
  selectedRegions: Set<string>
  onRemoveRegion: (region: string) => void
  onClearAll: () => void
}

export function RegionSelectorChips({
  selectedRegions,
  onRemoveRegion,
  onClearAll,
}: RegionSelectorChipsProps) {
  if (selectedRegions.size === 0) {
    return null
  }

  return (
    <div className="flex flex-wrap gap-2 items-center p-3 bg-muted rounded-lg">
      <span className="text-sm font-medium text-muted-foreground">
        {selectedRegions.size} región{selectedRegions.size !== 1 ? "es" : ""} seleccionada{selectedRegions.size !== 1 ? "s" : ""}:
      </span>
      {Array.from(selectedRegions).map((region) => (
        <Badge key={region} variant="secondary" className="flex items-center gap-1 pl-2">
          {region}
          <button
            onClick={() => onRemoveRegion(region)}
            className="ml-1 hover:opacity-70 transition-opacity"
            aria-label={`Remover ${region}`}
          >
            <X className="h-3 w-3" />
          </button>
        </Badge>
      ))}
      {selectedRegions.size > 0 && (
        <Button
          variant="ghost"
          size="sm"
          onClick={onClearAll}
          className="ml-auto text-xs"
        >
          Limpiar todas
        </Button>
      )}
    </div>
  )
}
