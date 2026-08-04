"use client"

import { CAMPOSDesktopVisualSystem } from "@/components/campos/campos-desktop-visual-system"
import { CAMPOSPremiumPolishSystem } from "@/components/campos/campos-premium-polish-system"
import { CAMPOSContrastControlsSystem } from "@/components/campos/campos-contrast-controls-system"
import { CAMPOSOperationalFinishSystem } from "@/components/campos/campos-operational-finish-system"
import { CAMPOSDetailPolishSystem } from "@/components/campos/campos-detail-polish-system"

/**
 * Single ordered entrypoint for the CAMPOS desktop visual system.
 *
 * Keep the cascade order centralized here while the legacy style layers are
 * progressively merged into fewer files. Route components must import only
 * this component so contrast and theme behavior cannot change because of an
 * accidental import reorder.
 */
export function CAMPOSUnifiedVisualSystem() {
  return (
    <>
      <CAMPOSDesktopVisualSystem />
      <CAMPOSPremiumPolishSystem />
      <CAMPOSContrastControlsSystem />
      <CAMPOSOperationalFinishSystem />
      <CAMPOSDetailPolishSystem />
      <style jsx global>{`
        @media (min-width: 1024px) {
          /* The filter belongs to the map workspace and stops before details. */
          .campos-desktop-shell ~ div {
            left: 350px !important;
            right: 414px !important;
            width: auto !important;
            max-width: none !important;
            z-index: 620 !important;
          }

          .campos-desktop-shell ~ div > div {
            width: 100% !important;
            max-width: none !important;
          }

          .campos-desktop-shell .leaflet-top.leaflet-right {
            top: auto !important;
            right: 12px !important;
            bottom: 42px !important;
            display: flex !important;
            flex-direction: column !important;
            align-items: flex-end !important;
            gap: 8px !important;
          }

          .campos-desktop-shell .leaflet-top.leaflet-right .leaflet-control {
            margin: 0 !important;
          }
        }

        @media (min-width: 1600px) {
          .campos-desktop-shell ~ div {
            left: 366px !important;
            right: 434px !important;
          }
        }
      `}</style>
    </>
  )
}
