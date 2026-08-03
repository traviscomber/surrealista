"use client"

import { CAMPOSFolderView } from "@/components/campos/campos-folder-view"
import { CAMPOSTagFilterBridge } from "@/components/campos/campos-tag-filter-bridge"

export function CAMPOSDesktopShellV2() {
  return (
    <div className="campos-desktop-shell h-full min-h-0 w-full overflow-hidden">
      <CAMPOSTagFilterBridge />
      <CAMPOSFolderView />

      <style jsx global>{`
        @media (min-width: 1024px) {
          .campos-desktop-shell > div {
            background: #f3f6f8 !important;
          }

          .campos-desktop-shell > div > div:first-child {
            width: 320px !important;
            min-width: 320px !important;
            border-right: 1px solid rgba(15, 23, 42, 0.1) !important;
            background: #ffffff !important;
          }

          .campos-desktop-shell > div > div:first-child > div:first-child {
            padding: 12px !important;
            border-bottom-color: rgba(15, 23, 42, 0.08) !important;
            background: #ffffff !important;
          }

          .campos-desktop-shell > div > div:first-child input {
            height: 38px !important;
            border-radius: 10px !important;
            border-color: rgba(15, 23, 42, 0.14) !important;
            background: #f8fafc !important;
            box-shadow: none !important;
          }

          .campos-desktop-shell > div > div:first-child > div:nth-child(2) > div:first-child {
            display: none !important;
          }

          .campos-desktop-shell > div > div:first-child [class*="bg-gradient-to-b"] {
            padding: 12px !important;
            gap: 10px !important;
            border-bottom-color: rgba(15, 23, 42, 0.08) !important;
            background: #ffffff !important;
          }

          .campos-desktop-shell > div > div:first-child [class*="bg-gradient-to-b"] > div:first-child h2 {
            font-size: 14px !important;
            line-height: 1.25 !important;
            font-weight: 650 !important;
            letter-spacing: -0.01em !important;
          }

          .campos-desktop-shell > div > div:first-child [class*="bg-gradient-to-b"] > div:nth-child(2) {
            display: grid !important;
            grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
            gap: 6px !important;
          }

          .campos-desktop-shell > div > div:first-child [class*="bg-gradient-to-b"] > div:nth-child(2) > div {
            min-height: 54px !important;
            padding: 8px 10px !important;
            border-radius: 10px !important;
            border-color: rgba(15, 23, 42, 0.09) !important;
            background: #f8fafc !important;
            box-shadow: none !important;
          }

          .campos-desktop-shell > div > div:first-child [class*="bg-gradient-to-b"] > div:nth-child(2) > div p:first-child {
            font-size: 9px !important;
            letter-spacing: 0.16em !important;
          }

          .campos-desktop-shell > div > div:first-child [class*="bg-gradient-to-b"] > div:nth-child(2) > div p:nth-child(2) {
            margin-top: 2px !important;
            font-size: 18px !important;
            line-height: 1.1 !important;
          }

          .campos-desktop-shell > div > div:first-child [class*="bg-gradient-to-b"] > div:nth-child(2) > div p:last-child {
            display: none !important;
          }

          .campos-desktop-shell > div > div:first-child [class*="bg-gradient-to-b"] button[class*="w-full"] {
            height: 36px !important;
            border-radius: 10px !important;
            font-size: 12px !important;
            box-shadow: none !important;
          }

          .campos-desktop-shell > div > div:first-child .overflow-y-auto > div.p-4 {
            padding: 8px !important;
          }

          .campos-desktop-shell > div > div:first-child .overflow-y-auto > div.p-4 > div {
            margin-bottom: 2px !important;
          }

          .campos-desktop-shell > div > div:first-child .overflow-y-auto button[class*="justify-start"] {
            min-height: 36px !important;
            height: auto !important;
            padding: 7px 8px !important;
            border-radius: 8px !important;
            font-size: 12px !important;
            font-weight: 500 !important;
          }

          .campos-desktop-shell > div > div:first-child .overflow-y-auto button[class*="justify-start"]:hover {
            background: #f1f5f9 !important;
          }

          .campos-desktop-shell > div > div:first-child .overflow-y-auto button[class*="justify-start"][data-state="active"],
          .campos-desktop-shell > div > div:first-child .overflow-y-auto button[class*="justify-start"].bg-secondary {
            background: #e8eef2 !important;
            color: #0f172a !important;
          }

          .campos-desktop-shell > div > div:first-child .ml-8 {
            margin-left: 18px !important;
            padding-left: 7px !important;
            border-left: 1px solid rgba(15, 23, 42, 0.1) !important;
          }

          .campos-desktop-shell > div > div:first-child [class*="text-[10px]"] {
            max-width: 72px !important;
            overflow: hidden !important;
            text-overflow: ellipsis !important;
            white-space: nowrap !important;
            border-radius: 999px !important;
            background: #f8fafc !important;
          }

          .campos-desktop-shell > div > div:nth-child(2) {
            width: 36px !important;
            min-width: 36px !important;
            border-right: 1px solid rgba(15, 23, 42, 0.08) !important;
            background: #ffffff !important;
          }

          .campos-desktop-shell > div > div:nth-child(3) > div:first-child {
            min-height: 48px !important;
            height: 48px !important;
            padding: 0 16px !important;
            border-bottom: 1px solid rgba(15, 23, 42, 0.09) !important;
            background: rgba(255, 255, 255, 0.98) !important;
          }

          .campos-desktop-shell > div > div:nth-child(3) > div:first-child h1 {
            font-size: 16px !important;
            font-weight: 650 !important;
            letter-spacing: -0.02em !important;
          }

          .campos-desktop-shell
            > div
            > div:nth-child(3)
            > div:nth-child(2):has(> div[class*="transition-[height]"]) {
            display: grid !important;
            grid-template-columns: minmax(0, 1fr) 420px !important;
            grid-template-rows: minmax(0, 1fr) !important;
          }

          .campos-desktop-shell
            > div
            > div:nth-child(3)
            > div:nth-child(2):has(> div[class*="transition-[height]"])
            > div:first-child {
            grid-column: 1 !important;
            grid-row: 1 !important;
            min-width: 0 !important;
            min-height: 0 !important;
          }

          .campos-desktop-shell
            > div
            > div:nth-child(3)
            > div:nth-child(2)
            > div[class*="transition-[height]"] {
            grid-column: 2 !important;
            grid-row: 1 !important;
            width: 420px !important;
            min-width: 420px !important;
            height: 100% !important;
            max-height: none !important;
            border-top: 0 !important;
            border-left: 1px solid rgba(15, 23, 42, 0.1) !important;
            background: #ffffff !important;
          }

          .campos-desktop-shell
            > div
            > div:nth-child(3)
            > div:nth-child(2)
            > div[class*="transition-[height]"]
            > div:first-child {
            min-height: 48px !important;
            height: 48px !important;
            padding: 0 14px !important;
            border-bottom-color: rgba(15, 23, 42, 0.08) !important;
            background: #ffffff !important;
          }

          .campos-desktop-shell [role="tablist"] {
            gap: 3px !important;
            padding: 4px !important;
            border-radius: 10px !important;
            background: #f1f5f9 !important;
          }

          .campos-desktop-shell [role="tab"] {
            min-height: 32px !important;
            padding: 6px 8px !important;
            border-radius: 7px !important;
            font-size: 11px !important;
          }

          .campos-desktop-shell [role="tabpanel"] {
            padding: 12px !important;
          }

          .campos-desktop-shell [role="tabpanel"] > div,
          .campos-desktop-shell [role="tabpanel"] [class*="rounded-3xl"] {
            border-radius: 12px !important;
            box-shadow: none !important;
          }

          .campos-desktop-shell .fixed.bottom-6.right-6 {
            position: absolute !important;
            right: 16px !important;
            bottom: 16px !important;
          }

          .campos-desktop-shell .fixed.bottom-24.right-6 {
            position: absolute !important;
            right: 16px !important;
            bottom: 80px !important;
          }

          .campos-desktop-shell .fixed.bottom-6.right-6 button {
            width: 44px !important;
            height: 44px !important;
            box-shadow: 0 8px 24px rgba(15, 23, 42, 0.18) !important;
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
            grid-template-columns: minmax(0, 1fr) 440px !important;
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
