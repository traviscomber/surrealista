"use client"

export function CAMPOSDetailPolishSystem() {
  return (
    <style jsx global>{`
      @media (min-width: 1024px) {
        /* Detail rail: compact editorial hierarchy. */
        .campos-desktop-shell
          > div
          > div:nth-child(3)
          > div:nth-child(2)
          > div[class*="transition-[height]"] {
          color: var(--sr-ink-live) !important;
        }

        .campos-desktop-shell
          > div
          > div:nth-child(3)
          > div:nth-child(2)
          > div[class*="transition-[height]"]
          > div:first-child {
          min-height: 46px !important;
          height: 46px !important;
          padding-inline: 14px !important;
        }

        .campos-desktop-shell
          > div
          > div:nth-child(3)
          > div:nth-child(2)
          > div[class*="transition-[height]"]
          > div:first-child
          :is(h1, h2, h3, p) {
          margin: 0 !important;
          font-size: 12px !important;
          line-height: 1.25 !important;
          font-weight: 650 !important;
          letter-spacing: 0 !important;
        }

        .campos-desktop-shell [role="tabpanel"] {
          padding: 14px !important;
          font-size: 13px !important;
          line-height: 1.5 !important;
        }

        .campos-desktop-shell [role="tabpanel"] :is(h1, h2) {
          margin: 0 !important;
          font-size: 19px !important;
          line-height: 1.2 !important;
          font-weight: 650 !important;
          letter-spacing: -0.025em !important;
          color: var(--sr-ink-live) !important;
        }

        .campos-desktop-shell [role="tabpanel"] h3 {
          margin: 0 !important;
          font-size: 14px !important;
          line-height: 1.3 !important;
          font-weight: 650 !important;
          letter-spacing: -0.01em !important;
          color: var(--sr-ink-live) !important;
        }

        .campos-desktop-shell [role="tabpanel"] :is([class*="text-4xl"], [class*="text-5xl"]) {
          font-size: 26px !important;
          line-height: 1.05 !important;
          font-weight: 650 !important;
          letter-spacing: -0.035em !important;
        }

        .campos-desktop-shell [role="tabpanel"] [class*="text-3xl"] {
          font-size: 22px !important;
          line-height: 1.1 !important;
          font-weight: 650 !important;
          letter-spacing: -0.03em !important;
        }

        .campos-desktop-shell [role="tabpanel"] [class*="text-2xl"] {
          font-size: 18px !important;
          line-height: 1.2 !important;
          font-weight: 650 !important;
          letter-spacing: -0.02em !important;
        }

        .campos-desktop-shell [role="tabpanel"] [class*="text-xl"] {
          font-size: 16px !important;
          line-height: 1.25 !important;
          font-weight: 650 !important;
        }

        .campos-desktop-shell [role="tabpanel"] [class*="text-lg"] {
          font-size: 14px !important;
          line-height: 1.35 !important;
          font-weight: 600 !important;
        }

        .campos-desktop-shell [role="tabpanel"] :is(p, li, dd, label, textarea, input) {
          font-size: 12.5px !important;
          line-height: 1.5 !important;
        }

        .campos-desktop-shell [role="tabpanel"] [class*="uppercase"] {
          font-size: 9px !important;
          line-height: 1.2 !important;
          font-weight: 700 !important;
          letter-spacing: 0.13em !important;
          color: var(--sr-ink-muted-live) !important;
        }

        .campos-desktop-shell [role="tabpanel"] [class*="font-mono"] {
          font-size: 12px !important;
          letter-spacing: 0.01em !important;
          font-variant-numeric: tabular-nums !important;
        }

        .campos-desktop-shell [role="tabpanel"] [class*="p-6"],
        .campos-desktop-shell [role="tabpanel"] [class*="p-8"] {
          padding: 14px !important;
        }

        .campos-desktop-shell [role="tabpanel"] [class*="gap-6"],
        .campos-desktop-shell [role="tabpanel"] [class*="gap-8"] {
          gap: 12px !important;
        }

        .campos-desktop-shell [role="tabpanel"] [class*="space-y-6"] > :not([hidden]) ~ :not([hidden]),
        .campos-desktop-shell [role="tabpanel"] [class*="space-y-8"] > :not([hidden]) ~ :not([hidden]) {
          margin-top: 12px !important;
        }

        .campos-desktop-shell [role="tabpanel"] :is(button, a[class*="inline-flex"]) {
          min-height: 32px !important;
          font-size: 11px !important;
          font-weight: 600 !important;
        }

        /* Tabs: one compact, horizontally scrollable control. */
        .campos-desktop-shell [role="tablist"] {
          display: flex !important;
          grid-template-columns: none !important;
          width: 100% !important;
          min-width: 0 !important;
          gap: 2px !important;
          padding: 3px !important;
          overflow-x: auto !important;
          overflow-y: hidden !important;
          scrollbar-width: none !important;
          border-radius: 8px !important;
        }

        .campos-desktop-shell [role="tablist"]::-webkit-scrollbar {
          display: none !important;
        }

        .campos-desktop-shell [role="tab"] {
          flex: 0 0 auto !important;
          width: auto !important;
          min-width: max-content !important;
          height: 30px !important;
          padding: 0 9px !important;
          border: 1px solid transparent !important;
          border-radius: 6px !important;
          font-size: 10.5px !important;
          line-height: 1 !important;
          font-weight: 600 !important;
          white-space: nowrap !important;
          overflow: visible !important;
          text-overflow: clip !important;
        }

        .campos-desktop-shell [role="tab"][data-state="active"],
        .campos-desktop-shell [role="tab"][aria-selected="true"] {
          background: var(--sr-panel-live) !important;
          color: var(--sr-brand-strong-live) !important;
          border-color: var(--sr-line-live) !important;
          box-shadow: inset 0 -2px 0 var(--sr-brand-live) !important;
        }

        .campos-desktop-shell [role="tab"]:hover:not([data-state="active"]) {
          background: color-mix(in srgb, var(--sr-panel-muted-live) 58%, transparent) !important;
          color: var(--sr-ink-live) !important;
        }
      }
    `}</style>
  )
}
