import type { Metadata } from "next"
import { CAMPOSDesktopShellV2 } from "@/components/campos/campos-desktop-shell-v2"
import { CAMPOSRegionalTagFilterSynced } from "@/components/campos/campos-regional-tag-filter-synced"
import { CAMPOSUnifiedVisualSystem } from "@/components/campos/campos-unified-visual-system"
import { CAMPOSMapVisualBehavior } from "@/components/campos/campos-map-visual-behavior"
import { LeafletPopupBehavior } from "@/components/kmz/leaflet-popup-behavior"

export const metadata: Metadata = {
  title: "CAMPOS internos | Sur-Realista",
  description: "Vista interna de carpetas CAMPOS con mapa, filtros y detalle operativo.",
}

export default function CAMPOSPage() {
  return (
    <div className="fixed inset-x-0 bottom-0 top-16 min-h-0 overflow-hidden bg-background">
      <LeafletPopupBehavior />
      <CAMPOSMapVisualBehavior />
      <CAMPOSDesktopShellV2 />
      <CAMPOSRegionalTagFilterSynced />
      <CAMPOSUnifiedVisualSystem />
    </div>
  )
}
