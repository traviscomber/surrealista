"use client"

export function CAMPOSOperationalFinishSystem() {
  return (
    <style jsx global>{`
      @media (min-width: 1024px) {
        .campos-desktop-shell {
          --sr-danger-live: #b64e45;
          --sr-warning-live: #a66f2c;
          --sr-success-live: #47705c;
          --sr-info-live: #5c8290;
        }

        .dark .campos-desktop-shell {
          --sr-danger-live: #e28f86;
          --sr-warning-live: #d5aa69;
          --sr-success-live: #8db79e;
          --sr-info-live: #8eb0bc;
        }

        /* Left inventory: stronger hierarchy, quieter metadata. */
        .campos-desktop-shell > div > div:first-child .overflow-y-auto button[class*="justify-start"] {
          position: relative !important;
          gap: 8px !important;
          border: 1px solid transparent !important;
        }

        .campos-desktop-shell > div > div:first-child .overflow-y-auto button[class*="justify-start"]:focus-visible {
          border-color: var(--sr-brand-live) !important;
          outline: none !important;
          box-shadow: 0 0 0 3px color-mix(in srgb, var(--sr-brand-live) 20%, transparent) !important;
        }

        .campos-desktop-shell > div > div:first-child .overflow-y-auto button[class*="justify-start"] p:first-of-type,
        .campos-desktop-shell > div > div:first-child .overflow-y-auto button[class*="justify-start"] span:first-of-type {
          line-height: 1.25 !important;
        }

        .campos-desktop-shell > div > div:first-child .overflow-y-auto button[class*="justify-start"] [class*="text-xs"],
        .campos-desktop-shell > div > div:first-child .overflow-y-auto button[class*="justify-start"] [class*="text-[10px]"] {
          color: var(--sr-ink-muted-live) !important;
        }

        .campos-desktop-shell > div > div:first-child .overflow-y-auto button[class*="justify-start"].bg-secondary,
        .campos-desktop-shell > div > div:first-child .overflow-y-auto button[class*="justify-start"][data-state="active"] {
          border-color: color-mix(in srgb, var(--sr-brand-live) 40%, var(--sr-line-live)) !important;
        }

        .campos-desktop-shell > div > div:first-child [class*="rounded-full"] {
          min-height: 20px !important;
          padding-inline: 7px !important;
          font-size: 10px !important;
          line-height: 18px !important;
        }

        /* Details: turn the right panel into a calm territorial summary. */
        .campos-desktop-shell [role="tabpanel"] {
          padding: 16px !important;
          color: var(--sr-ink-soft-live) !important;
          scrollbar-width: thin !important;
          scrollbar-color: var(--sr-line-strong-live) transparent !important;
        }

        .campos-desktop-shell [role="tabpanel"] > * + * {
          margin-top: 14px !important;
        }

        .campos-desktop-shell [role="tabpanel"] [class*="rounded-xl"],
        .campos-desktop-shell [role="tabpanel"] [class*="rounded-2xl"],
        .campos-desktop-shell [role="tabpanel"] [class*="rounded-3xl"] {
          border-radius: 10px !important;
          box-shadow: none !important;
        }

        .campos-desktop-shell [role="tabpanel"] [class*="border-slate"],
        .campos-desktop-shell [role="tabpanel"] [class*="border-sky"],
        .campos-desktop-shell [role="tabpanel"] [class*="border-amber"],
        .campos-desktop-shell [role="tabpanel"] [class*="border-emerald"],
        .campos-desktop-shell [role="tabpanel"] [class*="border-violet"] {
          border-color: var(--sr-line-live) !important;
        }

        .campos-desktop-shell [role="tabpanel"] [class*="bg-white"],
        .campos-desktop-shell [role="tabpanel"] [class*="bg-slate-50"],
        .campos-desktop-shell [role="tabpanel"] [class*="bg-slate-100"] {
          background: var(--sr-panel-soft-live) !important;
        }

        .campos-desktop-shell [role="tabpanel"] [class*="bg-sky"],
        .campos-desktop-shell [role="tabpanel"] [class*="bg-blue"] {
          background: color-mix(in srgb, var(--sr-info-live) 12%, var(--sr-panel-live)) !important;
        }

        .campos-desktop-shell [role="tabpanel"] [class*="bg-amber"],
        .campos-desktop-shell [role="tabpanel"] [class*="bg-orange"] {
          background: color-mix(in srgb, var(--sr-warning-live) 12%, var(--sr-panel-live)) !important;
        }

        .campos-desktop-shell [role="tabpanel"] [class*="bg-emerald"],
        .campos-desktop-shell [role="tabpanel"] [class*="bg-green"] {
          background: color-mix(in srgb, var(--sr-success-live) 12%, var(--sr-panel-live)) !important;
        }

        .campos-desktop-shell [role="tabpanel"] [class*="bg-violet"] {
          background: color-mix(in srgb, var(--sr-earth-live) 10%, var(--sr-panel-live)) !important;
        }

        .campos-desktop-shell [role="tabpanel"] [class*="text-slate-950"],
        .campos-desktop-shell [role="tabpanel"] [class*="text-slate-900"],
        .campos-desktop-shell [role="tabpanel"] [class*="text-slate-100"] {
          color: var(--sr-ink-live) !important;
        }

        .campos-desktop-shell [role="tabpanel"] [class*="text-slate-800"],
        .campos-desktop-shell [role="tabpanel"] [class*="text-slate-700"],
        .campos-desktop-shell [role="tabpanel"] [class*="text-slate-600"] {
          color: var(--sr-ink-soft-live) !important;
        }

        .campos-desktop-shell [role="tabpanel"] [class*="text-slate-500"],
        .campos-desktop-shell [role="tabpanel"] [class*="text-slate-400"] {
          color: var(--sr-ink-muted-live) !important;
        }

        .campos-desktop-shell [role="tabpanel"] [class*="text-sky"],
        .campos-desktop-shell [role="tabpanel"] [class*="text-blue"] {
          color: var(--sr-info-live) !important;
        }

        .campos-desktop-shell [role="tabpanel"] [class*="text-amber"],
        .campos-desktop-shell [role="tabpanel"] [class*="text-orange"] {
          color: var(--sr-warning-live) !important;
        }

        .campos-desktop-shell [role="tabpanel"] [class*="text-emerald"],
        .campos-desktop-shell [role="tabpanel"] [class*="text-green"] {
          color: var(--sr-success-live) !important;
        }

        .campos-desktop-shell [role="tabpanel"] [class*="text-violet"] {
          color: var(--sr-earth-live) !important;
        }

        .campos-desktop-shell [role="tabpanel"] [class*="uppercase"] {
          font-size: 10px !important;
          font-weight: 700 !important;
          letter-spacing: 0.1em !important;
        }

        .campos-desktop-shell [role="tabpanel"] h2,
        .campos-desktop-shell [role="tabpanel"] h3,
        .campos-desktop-shell [role="tabpanel"] p[class*="text-xl"] {
          letter-spacing: -0.02em !important;
        }

        .campos-desktop-shell [role="tabpanel"] button,
        .campos-desktop-shell [role="tabpanel"] a[class*="inline-flex"] {
          min-height: 34px !important;
        }

        /* Tabs: equal visual weight and no noisy pills. */
        .campos-desktop-shell [role="tablist"] {
          display: grid !important;
          grid-template-columns: repeat(5, minmax(0, 1fr)) !important;
          gap: 2px !important;
          border-radius: 9px !important;
        }

        .campos-desktop-shell [role="tab"] {
          min-width: 0 !important;
          height: 34px !important;
          padding: 0 8px !important;
          border-radius: 7px !important;
          white-space: nowrap !important;
          overflow: hidden !important;
          text-overflow: ellipsis !important;
        }

        .campos-desktop-shell [role="tab"][data-state="active"],
        .campos-desktop-shell [role="tab"][aria-selected="true"] {
          color: var(--sr-ink-live) !important;
          border-color: var(--sr-line-live) !important;
          box-shadow: inset 0 -2px 0 var(--sr-brand-live) !important;
        }

        /* Map controls and popups. */
        .campos-desktop-shell .leaflet-bar,
        .campos-desktop-shell .leaflet-control-layers {
          border: 0 !important;
          border-radius: 9px !important;
          overflow: hidden !important;
        }

        .campos-desktop-shell .leaflet-bar a {
          width: 34px !important;
          height: 34px !important;
          line-height: 34px !important;
          border-bottom-color: var(--sr-line-live) !important;
        }

        .campos-desktop-shell .leaflet-popup-content-wrapper {
          border-radius: 10px !important;
          box-shadow: 0 18px 44px -26px rgba(31, 40, 36, 0.55) !important;
        }

        .campos-desktop-shell .leaflet-popup-content {
          margin: 14px 16px !important;
          min-width: 220px !important;
          font-size: 13px !important;
          line-height: 1.45 !important;
        }

        .campos-desktop-shell .leaflet-interactive {
          transition: stroke-width 120ms ease, stroke-opacity 120ms ease, fill-opacity 120ms ease !important;
        }

        .campos-desktop-shell .leaflet-overlay-pane path:not([stroke-dasharray]) {
          stroke-linejoin: round !important;
          stroke-linecap: round !important;
        }

        .campos-desktop-shell .leaflet-overlay-pane path[stroke-dasharray] {
          fill-opacity: 0.04 !important;
          stroke-opacity: 0.72 !important;
        }

        /* Floating filter surface: compact and subordinate to the map. */
        .campos-desktop-shell ~ div > div {
          max-height: calc(100vh - 116px) !important;
          border-radius: 10px !important;
        }

        .campos-desktop-shell ~ div section {
          border-radius: 8px !important;
        }

        .campos-desktop-shell ~ div [class*="rounded-full"] {
          border-radius: 7px !important;
        }

        /* Empty and loading states. */
        .campos-desktop-shell [class*="animate-spin"] {
          border-color: color-mix(in srgb, var(--sr-brand-live) 28%, transparent) !important;
          border-bottom-color: var(--sr-brand-live) !important;
        }

        .campos-desktop-shell [aria-busy="true"] {
          cursor: progress !important;
        }
      }
    `}</style>
  )
}
