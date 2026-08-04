"use client"

export function CAMPOSDetailPanelSafeRedesign() {
  return (
    <style jsx global>{`
      @media (min-width: 1024px) {
        .campos-desktop-shell
          > div
          > div:nth-child(3)
          > div:nth-child(2)
          > div[class*="transition-[height]"] {
          background: var(--campos-surface, #18201c) !important;
          border-left: 1px solid var(--campos-border, rgba(255,255,255,.12)) !important;
          color: var(--campos-text, #f3f1ea) !important;
        }

        .campos-desktop-shell
          > div
          > div:nth-child(3)
          > div:nth-child(2)
          > div[class*="transition-[height]"]
          > div:first-child {
          min-height: 54px !important;
          height: 54px !important;
          padding: 0 14px !important;
          background: var(--campos-surface, #18201c) !important;
          border-bottom: 1px solid var(--campos-border, rgba(255,255,255,.12)) !important;
        }

        .campos-desktop-shell
          > div
          > div:nth-child(3)
          > div:nth-child(2)
          > div[class*="transition-[height]"]
          > div:first-child h2 {
          max-width: 320px !important;
          font-size: 13px !important;
          line-height: 1.25 !important;
          font-weight: 650 !important;
          letter-spacing: -0.01em !important;
          color: var(--campos-text, #f3f1ea) !important;
        }

        .campos-desktop-shell
          > div
          > div:nth-child(3)
          > div:nth-child(2)
          > div[class*="transition-[height]"]
          > div:first-child p {
          display: block !important;
          max-width: 320px !important;
          margin-top: 2px !important;
          font-size: 10px !important;
          line-height: 1.2 !important;
          color: var(--campos-text-muted, #aba89f) !important;
        }

        .campos-desktop-shell
          > div
          > div:nth-child(3)
          > div:nth-child(2)
          > div[class*="transition-[height]"]
          > div:first-child button {
          width: 30px !important;
          height: 30px !important;
          min-width: 30px !important;
          border-radius: 8px !important;
          border: 1px solid var(--campos-border, rgba(255,255,255,.12)) !important;
          background: var(--campos-surface-raised, #232c27) !important;
          color: var(--campos-text, #f3f1ea) !important;
        }

        .campos-desktop-shell [role="tablist"] {
          position: sticky !important;
          top: 0 !important;
          z-index: 12 !important;
          display: flex !important;
          width: 100% !important;
          height: 40px !important;
          min-height: 40px !important;
          gap: 2px !important;
          padding: 0 10px !important;
          overflow-x: auto !important;
          overflow-y: hidden !important;
          border-radius: 0 !important;
          border-bottom: 1px solid var(--campos-border, rgba(255,255,255,.12)) !important;
          background: var(--campos-surface, #18201c) !important;
          box-shadow: none !important;
          pointer-events: auto !important;
        }

        .campos-desktop-shell [role="tab"] {
          position: relative !important;
          z-index: 13 !important;
          display: inline-flex !important;
          flex: 0 0 auto !important;
          align-items: center !important;
          justify-content: center !important;
          height: 40px !important;
          min-height: 40px !important;
          padding: 0 10px !important;
          border: 0 !important;
          border-radius: 0 !important;
          background: transparent !important;
          color: var(--campos-text-muted, #aba89f) !important;
          font-size: 10.5px !important;
          line-height: 1 !important;
          font-weight: 560 !important;
          white-space: nowrap !important;
          cursor: pointer !important;
          pointer-events: auto !important;
          opacity: 1 !important;
        }

        .campos-desktop-shell [role="tab"]:hover {
          color: var(--campos-text, #f3f1ea) !important;
          background: color-mix(in srgb, var(--campos-accent, #8db79e) 10%, transparent) !important;
        }

        .campos-desktop-shell [role="tab"][data-state="active"] {
          color: var(--campos-text, #f3f1ea) !important;
          background: transparent !important;
          box-shadow: inset 0 -2px 0 var(--campos-accent, #8db79e) !important;
        }

        .campos-desktop-shell [role="tab"]:focus-visible {
          outline: 2px solid var(--campos-accent, #8db79e) !important;
          outline-offset: -3px !important;
        }

        .campos-desktop-shell [role="tabpanel"] {
          padding: 12px !important;
          font-size: 12px !important;
          line-height: 1.5 !important;
          color: var(--campos-text-secondary, #cbc8bf) !important;
        }

        .campos-desktop-shell [role="tabpanel"] h2,
        .campos-desktop-shell [role="tabpanel"] h3 {
          font-size: 15px !important;
          line-height: 1.3 !important;
          font-weight: 650 !important;
          letter-spacing: -0.01em !important;
        }

        .campos-desktop-shell [role="tabpanel"] h4 {
          font-size: 13px !important;
          line-height: 1.35 !important;
          font-weight: 620 !important;
        }

        .campos-desktop-shell [role="tabpanel"] p,
        .campos-desktop-shell [role="tabpanel"] label,
        .campos-desktop-shell [role="tabpanel"] span {
          font-size: 11px !important;
        }

        .campos-desktop-shell [role="tabpanel"] .text-3xl,
        .campos-desktop-shell [role="tabpanel"] .text-4xl,
        .campos-desktop-shell [role="tabpanel"] [class*="text-3xl"],
        .campos-desktop-shell [role="tabpanel"] [class*="text-4xl"] {
          font-size: 20px !important;
          line-height: 1.15 !important;
          letter-spacing: -0.025em !important;
        }

        .campos-desktop-shell [role="tabpanel"] .text-2xl,
        .campos-desktop-shell [role="tabpanel"] [class*="text-2xl"] {
          font-size: 16px !important;
          line-height: 1.25 !important;
        }

        .campos-desktop-shell [role="tabpanel"] [class*="rounded-3xl"],
        .campos-desktop-shell [role="tabpanel"] [class*="rounded-2xl"] {
          border-radius: 10px !important;
        }

        .campos-desktop-shell [role="tabpanel"] [class*="p-5"] {
          padding: 12px !important;
        }

        .campos-desktop-shell [role="tabpanel"] [class*="p-4"] {
          padding: 10px !important;
        }

        .campos-desktop-shell [role="tabpanel"] [class*="space-y-6"] > :not([hidden]) ~ :not([hidden]) {
          margin-top: 12px !important;
        }

        .campos-desktop-shell [role="tabpanel"] [class*="space-y-5"] > :not([hidden]) ~ :not([hidden]),
        .campos-desktop-shell [role="tabpanel"] [class*="space-y-4"] > :not([hidden]) ~ :not([hidden]) {
          margin-top: 10px !important;
        }

        .campos-desktop-shell [role="tabpanel"] button {
          min-height: 30px !important;
          font-size: 10.5px !important;
        }

        .campos-desktop-shell [role="tabpanel"] [class*="tracking-[0.24em]"] {
          letter-spacing: 0.12em !important;
        }
      }
    `}</style>
  )
}
