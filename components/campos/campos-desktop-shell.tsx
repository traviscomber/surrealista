"use client"

import { CAMPOSFolderView } from "@/components/campos/campos-folder-view"

export function CAMPOSDesktopShell() {
  return (
    <div className="campos-desktop-shell h-full min-h-0 w-full overflow-hidden">
      <CAMPOSFolderView />

      <style jsx global>{`
        @media (min-width: 1024px) {
          .campos-desktop-shell > div {
            background: #f8fafc;
          }

          /* Left operating rail: compact enough to preserve the map. */
          .campos-desktop-shell > div > div:first-child {
            width: 320px !important;
            min-width: 320px !important;
            border-right-color: rgba(148, 163, 184, 0.28) !important;
            background: rgba(255, 255, 255, 0.98) !important;
          }

          .campos-desktop-shell > div > div:first-child > div:first-child {
            padding: 12px !important;
          }

          .campos-desktop-shell > div > div:nth-child(2) {
            width: 40px;
            min-width: 40px;
            border-right-color: rgba(148, 163, 184, 0.22) !important;
            background: #ffffff !important;
          }

          /* Main CAMPOS header becomes a quiet utility bar. */
          .campos-desktop-shell > div > div:nth-child(3) > div:first-child {
            min-height: 52px;
            padding: 0 18px !important;
            border-bottom-color: rgba(148, 163, 184, 0.24) !important;
            background: rgba(255, 255, 255, 0.96) !important;
          }

          .campos-desktop-shell > div > div:nth-child(3) > div:first-child h1 {
            font-size: 18px !important;
            line-height: 1.2 !important;
            font-weight: 650 !important;
            letter-spacing: -0.02em;
          }

          /* When a field is selected, turn the former bottom drawer into a right rail. */
          .campos-desktop-shell
            > div
            > div:nth-child(3)
            > div:nth-child(2):has(> div[class*="transition-[height]"]) {
            display: grid !important;
            grid-template-columns: minmax(0, 1fr) 420px;
            grid-template-rows: minmax(0, 1fr);
            align-items: stretch;
          }

          .campos-desktop-shell
            > div
            > div:nth-child(3)
            > div:nth-child(2):has(> div[class*="transition-[height]"])
            > div:first-child {
            grid-column: 1;
            grid-row: 1;
            min-width: 0;
            min-height: 0;
          }

          .campos-desktop-shell
            > div
            > div:nth-child(3)
            > div:nth-child(2)
            > div[class*="transition-[height]"] {
            grid-column: 2;
            grid-row: 1;
            width: 420px !important;
            min-width: 420px !important;
            height: 100% !important;
            max-height: none !important;
            border-top: 0 !important;
            border-left: 1px solid rgba(148, 163, 184, 0.28) !important;
            background: #ffffff !important;
          }

          .campos-desktop-shell
            > div
            > div:nth-child(3)
            > div:nth-child(2)
            > div[class*="transition-[height]"]
            > div:first-child {
            min-height: 52px;
            height: 52px !important;
            padding: 0 16px !important;
            background: #ffffff;
          }

          /* Keep floating actions inside the map, not against the browser edge. */
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

        @media (min-width: 1600px) {
          .campos-desktop-shell > div > div:first-child {
            width: 340px !important;
            min-width: 340px !important;
          }

          .campos-desktop-shell
            > div
            > div:nth-child(3)
            > div:nth-child(2):has(> div[class*="transition-[height]"]) {
            grid-template-columns: minmax(0, 1fr) 440px;
          }

          .campos-desktop-shell
            > div
            > div:nth-child(3)
            > div:nth-child(2)
            > div[class*="transition-[height]"] {
            width: 440px !important;
            min-width: 440px !important;
          }
        }
      `}</style>
    </div>
  )
}
