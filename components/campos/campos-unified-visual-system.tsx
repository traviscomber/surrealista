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
    </>
  )
}
