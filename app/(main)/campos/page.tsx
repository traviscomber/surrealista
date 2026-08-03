import type { Metadata } from "next"
import { CAMPOSDesktopShellV2 } from "@/components/campos/campos-desktop-shell-v2"
import { CAMPOSRegionalTagFilterV2 } from "@/components/campos/campos-regional-tag-filter-v2"
import { LeafletPopupBehavior } from "@/components/kmz/leaflet-popup-behavior"

export const metadata: Metadata = {
  title: "CAMPOS internos | Sur-Realista",
  description: "Vista interna de carpetas CAMPOS con mapa, filtros y detalle operativo.",
}

export default function CAMPOSPage() {
  return (
    <div className="fixed inset-x-0 bottom-0 top-16 min-h-0 overflow-hidden bg-background">
      <LeafletPopupBehavior />
      <CAMPOSDesktopShellV2 />
      <CAMPOSRegionalTagFilterV2 />
    </div>
  )
}
