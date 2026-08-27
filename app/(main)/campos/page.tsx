import type { Metadata } from "next"
import { CAMPOSDesktopShellV2 } from "@/components/campos/campos-desktop-shell-v2"
import { CAMPOSUniversalTagFilter } from "@/components/campos/campos-universal-tag-filter"
import { CAMPOSUnifiedVisualSystem } from "@/components/campos/campos-unified-visual-system"
import { CAMPOSMapVisualBehavior } from "@/components/campos/campos-map-visual-behavior"
import { CAMPOSTagFilterBridge } from "@/components/campos/campos-tag-filter-bridge"
import { CAMPOSDetailPanelSafeRedesign } from "@/components/campos/campos-detail-panel-safe-redesign"
import { LeafletPopupBehavior } from "@/components/kmz/leaflet-popup-behavior"

export const metadata: Metadata = {
  title: "Campos",
  description: "Vista principal de Sur Realista Intelligence para explorar el inventario territorial en mapa, filtrar por región y tags, y revisar vecinos, propietarios y detalle operativo.",
}

export default function CAMPOSPage() {
  return (
    <div className="fixed inset-x-0 bottom-0 top-16 min-h-0 overflow-hidden bg-background">
      <LeafletPopupBehavior />
      <CAMPOSMapVisualBehavior />
      <CAMPOSTagFilterBridge />
      <CAMPOSDesktopShellV2 />
      <CAMPOSUniversalTagFilter />
      <CAMPOSUnifiedVisualSystem />
      <CAMPOSDetailPanelSafeRedesign />
    </div>
  )
}
