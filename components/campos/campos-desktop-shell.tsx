"use client"

import { CAMPOSFolderViewIntegrated } from "@/components/campos/campos-folder-view-integrated"

export function CAMPOSDesktopShell() {
  return (
    <div className="campos-desktop-shell h-full min-h-0 w-full overflow-hidden">
      <CAMPOSFolderViewIntegrated />

      <style jsx global>{`
        @media (min-width: 1024px) {
          .campos-desktop-shell > div {
            background: #f8fafc;
          }

          .campos-desktop-shell > div > div:first-child {
            border-right-color: rgba(148, 163, 184, 0.28) !important;
            background: rgba(255, 255, 255, 0.98) !important;
          }

          .campos-desktop-shell .fixed.bottom-6.right-6 {
            position: absolute !important;
            right: 18px !important;
            bottom: 18px !important;
          }

          .campos-desktop-shell .fixed.bottom-24.right-6 {
            position: absolute !important;
            right: 18px !important;
            bottom: 86px !important;
          }
        }
      `}</style>
    </div>
  )
}
