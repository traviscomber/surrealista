"use client"

import React from "react"
import { Checkbox } from "@/components/ui/checkbox"
import { Folder, FolderOpen, ChevronRight, ChevronDown, Loader2 } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"

interface RegionFolderItemProps {
  name: string
  fileCount?: number
  isSelected?: boolean
  isOpen?: boolean
  isLoading?: boolean
  loadingProgress?: number
  onToggleSelect: (region: string) => void
  onToggleOpen: () => void
}

export function RegionFolderItem({
  name,
  fileCount = 0,
  isSelected = false,
  isOpen = false,
  isLoading = false,
  loadingProgress = 0,
  onToggleSelect,
  onToggleOpen,
}: RegionFolderItemProps) {
  return (
    <div className="flex items-center gap-2 py-2 px-3 hover:bg-muted rounded-lg transition-colors group">
      <div className="flex items-center gap-2 flex-1">
        <Checkbox
          checked={isSelected}
          onCheckedChange={() => onToggleSelect(name)}
          className="mt-0.5"
        />

        <Button
          variant="ghost"
          size="sm"
          onClick={onToggleOpen}
          className="p-0 h-6 w-6"
        >
          {isOpen ? (
            <ChevronDown className="h-4 w-4" />
          ) : (
            <ChevronRight className="h-4 w-4" />
          )}
        </Button>

        {isSelected && isLoading ? (
          <Loader2 className="h-4 w-4 animate-spin text-emerald-600" />
        ) : isSelected ? (
          <FolderOpen className="h-4 w-4 text-emerald-600" />
        ) : (
          <Folder className="h-4 w-4 text-muted-foreground" />
        )}

        <span className="text-sm font-medium flex-1">{name}</span>

        {isSelected && isLoading && loadingProgress > 0 && (
          <Badge variant="outline" className="text-xs">
            {loadingProgress}%
          </Badge>
        )}

        <Badge variant={isSelected ? "default" : "secondary"} className="text-xs">
          {fileCount} archivo{fileCount !== 1 ? "s" : ""}
        </Badge>
      </div>
    </div>
  )
}
