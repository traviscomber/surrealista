import type { Metadata } from "next"
import { CAMPOSDesktopShellV2 } from "@/components/campos/campos-desktop-shell-v2"
import { CAMPOSUniversalTagFilter } from "@/components/campos/campos-universal-tag-filter"
import { CAMPOSUnifiedVisualSystem } from "@/components/campos/campos-unified-visual-system"
import { CAMPOSMapVisualBehavior } from "@/components/campos/campos-map-visual-behavior"
import { CAMPOSTagFilterBridge } from "@/components/campos/campos-tag-filter-bridge"
import { CAMPOSDetailPanelBehavior } from "@/components/campos/campos-detail-panel-behavior"
import { CAMPOSDetailPanelRedesign } from "@/components/campos/campos-detail-panel-redesign"
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
      <CAMPOSTagFilterBridge />
      <CAMPOSDetailPanelBehavior />
      <CAMPOSDesktopShellV2 />
      <CAMPOSUniversalTagFilter />
      <CAMPOSUnifiedVisualSystem />
      <CAMPOSDetailPanelRedesign />
    </div>
  )
}
