"use client"

import { CAMPOSDesktopVisualSystem } from "@/components/campos/campos-desktop-visual-system"
import { CAMPOSPremiumPolishSystem } from "@/components/campos/campos-premium-polish-system"
import { CAMPOSContrastControlsSystem } from "@/components/campos/campos-contrast-controls-system"
import { CAMPOSOperationalFinishSystem } from "@/components/campos/campos-operational-finish-system"

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
      <style jsx global>{`
        @media (min-width: 1024px) {
          /*
           * The regional filter belongs to the map workspace. It must stop
           * before the fixed details rail instead of extending below it.
           */
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

          /* Compact three-pane filter into a usable two-row layout on
             narrower desktop workspaces. Results remain available below. */
          .campos-desktop-shell ~ div > div > div.grid {
            grid-template-columns: 190px minmax(0, 1fr) !important;
          }

          .campos-desktop-shell ~ div > div > div.grid > section:nth-child(3) {
            grid-column: 1 / -1 !important;
            min-height: 150px !important;
            max-height: 190px !important;
            border-left: 0 !important;
            border-top: 1px solid var(--sr-line-live) !important;
          }

          /* Map controls use a persistent zone separate from the top filter. */
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

          .campos-desktop-shell ~ div > div > div.grid {
            grid-template-columns: 220px minmax(0, 1fr) 280px !important;
          }

          .campos-desktop-shell ~ div > div > div.grid > section:nth-child(3) {
            grid-column: auto !important;
            min-height: 0 !important;
            max-height: none !important;
            border-left: 1px solid var(--sr-line-live) !important;
            border-top: 0 !important;
          }
        }
      `}</style>
    </>
  )
}
