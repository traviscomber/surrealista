"use client"

export function CAMPOSDetailPolishSystem() {
  return (
    <style jsx global>{`
      @media (min-width: 1024px) {
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
          min-height: 44px !important;
          height: 44px !important;
          padding-inline: 14px !important;
          border-bottom: 1px solid var(--sr-line-live) !important;
        }

        .campos-desktop-shell
          > div
          > div:nth-child(3)
          > div:nth-child(2)
          > div[class*="transition-[height]"]
          > div:first-child
          :is(h1, h2, h3, p) {
          margin: 0 !important;
          font-size: 11.5px !important;
          line-height: 1.25 !important;
          font-weight: 650 !important;
          letter-spacing: 0 !important;
        }

        .campos-desktop-shell [role="tabpanel"] {
          padding: 12px 14px 18px !important;
          font-size: 12.5px !important;
          line-height: 1.5 !important;
          background: var(--sr-panel-live) !important;
        }

        .campos-desktop-shell [role="tabpanel"] > * + * {
          margin-top: 10px !important;
        }

        .campos-desktop-shell [role="tabpanel"] :is(h1, h2) {
          margin: 0 !important;
          font-size: 18px !important;
          line-height: 1.2 !important;
          font-weight: 650 !important;
          letter-spacing: -0.025em !important;
          color: var(--sr-ink-live) !important;
        }

        .campos-desktop-shell [role="tabpanel"] h3 {
          margin: 0 !important;
          font-size: 13px !important;
          line-height: 1.3 !important;
          font-weight: 650 !important;
          color: var(--sr-ink-live) !important;
        }

        .campos-desktop-shell [role="tabpanel"] :is([class*="text-4xl"], [class*="text-5xl"]) {
          font-size: 24px !important;
          line-height: 1.05 !important;
          font-weight: 650 !important;
          letter-spacing: -0.035em !important;
        }

        .campos-desktop-shell [role="tabpanel"] [class*="text-3xl"] {
          font-size: 20px !important;
          line-height: 1.1 !important;
          font-weight: 650 !important;
          letter-spacing: -0.03em !important;
        }

        .campos-desktop-shell [role="tabpanel"] [class*="text-2xl"] {
          font-size: 17px !important;
          line-height: 1.2 !important;
          font-weight: 650 !important;
        }

        .campos-desktop-shell [role="tabpanel"] [class*="text-xl"] {
          font-size: 15px !important;
          line-height: 1.25 !important;
          font-weight: 650 !important;
        }

        .campos-desktop-shell [role="tabpanel"] [class*="text-lg"] {
          font-size: 13.5px !important;
          line-height: 1.35 !important;
          font-weight: 600 !important;
        }

        .campos-desktop-shell [role="tabpanel"] :is(p, li, dd, label, textarea, input) {
          font-size: 12px !important;
          line-height: 1.5 !important;
        }

        .campos-desktop-shell [role="tabpanel"] [class*="uppercase"] {
          font-size: 9px !important;
          line-height: 1.2 !important;
          font-weight: 700 !important;
          letter-spacing: 0.12em !important;
          color: var(--sr-ink-muted-live) !important;
        }

        .campos-desktop-shell [role="tabpanel"] [class*="font-mono"] {
          font-size: 11.5px !important;
          font-variant-numeric: tabular-nums !important;
        }

        .campos-desktop-shell [role="tabpanel"] :is([class*="rounded-xl"], [class*="rounded-2xl"], [class*="rounded-3xl"]) {
          border-radius: 8px !important;
          box-shadow: none !important;
        }

        .campos-desktop-shell [role="tabpanel"] [class*="p-6"],
        .campos-desktop-shell [role="tabpanel"] [class*="p-8"] {
          padding: 12px !important;
        }

        .campos-desktop-shell [role="tabpanel"] [class*="gap-6"],
        .campos-desktop-shell [role="tabpanel"] [class*="gap-8"] {
          gap: 10px !important;
        }

        .campos-desktop-shell [role="tabpanel"] [class*="space-y-6"] > :not([hidden]) ~ :not([hidden]),
        .campos-desktop-shell [role="tabpanel"] [class*="space-y-8"] > :not([hidden]) ~ :not([hidden]) {
          margin-top: 10px !important;
        }

        .campos-desktop-shell [role="tabpanel"] :is(button, a[class*="inline-flex"]) {
          min-height: 30px !important;
          font-size: 10.5px !important;
          font-weight: 600 !important;
        }

        /* Reduce nested-card appearance in the summary tab. */
        .campos-desktop-shell [role="tabpanel"][data-state="active"] > div:first-child {
          border-color: transparent !important;
          background: transparent !important;
          box-shadow: none !important;
        }

        .campos-desktop-shell [role="tabpanel"][data-state="active"] > div:first-child > [class*="rounded"] {
          border-color: var(--sr-line-live) !important;
          background: var(--sr-panel-soft-live) !important;
        }

        /* Tabs: one quiet editorial navigation row. */
        .campos-desktop-shell [role="tablist"] {
          display: flex !important;
          grid-template-columns: none !important;
          width: 100% !important;
          min-width: 0 !important;
          gap: 0 !important;
          padding: 0 10px !important;
          overflow-x: auto !important;
          overflow-y: hidden !important;
          scrollbar-width: none !important;
          border: 0 !important;
          border-bottom: 1px solid var(--sr-line-live) !important;
          border-radius: 0 !important;
          background: var(--sr-panel-live) !important;
        }

        .campos-desktop-shell [role="tablist"]::-webkit-scrollbar {
          display: none !important;
        }

        .campos-desktop-shell [role="tab"] {
          position: relative !important;
          flex: 0 0 auto !important;
          width: auto !important;
          min-width: max-content !important;
          height: 36px !important;
          padding: 0 9px !important;
          border: 0 !important;
          border-radius: 0 !important;
          background: transparent !important;
          color: var(--sr-ink-muted-live) !important;
          font-size: 10.5px !important;
          line-height: 1 !important;
          font-weight: 600 !important;
          white-space: nowrap !important;
          box-shadow: none !important;
        }

        .campos-desktop-shell [role="tab"]::after {
          content: "" !important;
          position: absolute !important;
          left: 9px !important;
          right: 9px !important;
          bottom: 0 !important;
          height: 2px !important;
          border-radius: 2px 2px 0 0 !important;
          background: transparent !important;
        }

        .campos-desktop-shell [role="tab"][data-state="active"],
        .campos-desktop-shell [role="tab"][aria-selected="true"] {
          color: var(--sr-brand-strong-live) !important;
          background: transparent !important;
          box-shadow: none !important;
        }

        .campos-desktop-shell [role="tab"][data-state="active"]::after,
        .campos-desktop-shell [role="tab"][aria-selected="true"]::after {
          background: var(--sr-brand-live) !important;
        }

        .campos-desktop-shell [role="tab"]:hover:not([data-state="active"]) {
          color: var(--sr-ink-live) !important;
          background: transparent !important;
        }
      }
    `}</style>
  )
}
