"use client"

export function CAMPOSDesktopVisualSystem() {
  return (
    <style jsx global>{`
      @media (min-width: 1024px) {
        .campos-desktop-shell {
          --campos-left: 304px;
          --campos-rail: 34px;
          --campos-details: 400px;
          --campos-header: 44px;
          color: var(--sr-ink-live, #1f2824);
        }

        .campos-desktop-shell > div > div:first-child {
          width: var(--campos-left) !important;
          min-width: var(--campos-left) !important;
        }

        .campos-desktop-shell > div > div:nth-child(2) {
          width: var(--campos-rail) !important;
          min-width: var(--campos-rail) !important;
        }

        .campos-desktop-shell > div > div:nth-child(3) > div:first-child {
          min-height: var(--campos-header) !important;
          height: var(--campos-header) !important;
          padding: 0 14px !important;
        }

        .campos-desktop-shell > div > div:nth-child(3) > div:first-child h1 {
          font-size: 15px !important;
          line-height: 1 !important;
          font-weight: 650 !important;
        }

        .campos-desktop-shell
          > div
          > div:nth-child(3)
          > div:nth-child(2):has(> div[class*="transition-[height]"]) {
          grid-template-columns: minmax(0, 1fr) var(--campos-details) !important;
        }

        .campos-desktop-shell
          > div
          > div:nth-child(3)
          > div:nth-child(2)
          > div[class*="transition-[height]"] {
          width: var(--campos-details) !important;
          min-width: var(--campos-details) !important;
          background: var(--sr-panel-live, #ffffff) !important;
          color: var(--sr-ink-live, #1f2824) !important;
          border-color: var(--sr-line-live, #cdd3cf) !important;
        }

        .campos-desktop-shell
          > div
          > div:nth-child(3)
          > div:nth-child(2)
          > div[class*="transition-[height]"]
          > div:first-child {
          min-height: 44px !important;
          height: 44px !important;
          padding: 0 12px !important;
        }

        .campos-desktop-shell
          > div
          > div:nth-child(3)
          > div:nth-child(2)
          > div[class*="transition-[height]"]
          > div:first-child h2,
        .campos-desktop-shell
          > div
          > div:nth-child(3)
          > div:nth-child(2)
          > div[class*="transition-[height]"]
          > div:first-child h3 {
          font-size: 13px !important;
          line-height: 1.2 !important;
          font-weight: 650 !important;
        }

        .campos-desktop-shell [role="tablist"] {
          position: sticky !important;
          top: 0 !important;
          z-index: 3 !important;
          min-height: 38px !important;
          padding: 3px !important;
          border-radius: 8px !important;
          background: var(--sr-panel-soft-live, #f3f1ec) !important;
          border-color: var(--sr-line-live, #cdd3cf) !important;
        }

        .campos-desktop-shell [role="tab"] {
          min-height: 30px !important;
          padding: 5px 8px !important;
          border-radius: 6px !important;
          font-size: 10.5px !important;
          font-weight: 600 !important;
        }

        .campos-desktop-shell [role="tabpanel"] {
          padding: 10px 12px 18px !important;
          background: var(--sr-panel-live, #ffffff) !important;
          color: var(--sr-ink-soft-live, #4a5550) !important;
        }

        .campos-desktop-shell [role="tabpanel"] h2,
        .campos-desktop-shell [role="tabpanel"] h3 {
          font-size: 13px !important;
          line-height: 1.3 !important;
          letter-spacing: -0.01em !important;
        }

        .campos-desktop-shell [role="tabpanel"] p,
        .campos-desktop-shell [role="tabpanel"] label {
          line-height: 1.45 !important;
        }

        .campos-desktop-shell [role="tabpanel"] [class*="rounded-2xl"],
        .campos-desktop-shell [role="tabpanel"] [class*="rounded-3xl"] {
          border-radius: 10px !important;
          box-shadow: none !important;
        }

        .campos-desktop-shell [role="tabpanel"] [class*="p-4"] {
          padding: 12px !important;
        }

        .campos-desktop-shell [class*="absolute left-3 top-3"] {
          top: 62px !important;
          left: 12px !important;
          gap: 6px !important;
        }

        .campos-desktop-shell [class*="absolute left-3 top-3"] button {
          height: 32px !important;
          border-radius: 8px !important;
          padding-left: 10px !important;
          padding-right: 10px !important;
          font-size: 11px !important;
          border-color: var(--sr-line-live, #cdd3cf) !important;
          background: color-mix(in srgb, var(--sr-panel-live, #ffffff) 94%, transparent) !important;
          color: var(--sr-ink-live, #1f2824) !important;
          box-shadow: 0 4px 14px color-mix(in srgb, var(--sr-ink-live, #1f2824) 10%, transparent) !important;
          backdrop-filter: blur(8px) !important;
        }

        .campos-desktop-shell .leaflet-top.leaflet-right {
          top: 52px !important;
          right: 10px !important;
        }

        .campos-desktop-shell .leaflet-control-layers,
        .campos-desktop-shell .leaflet-bar {
          border: 1px solid var(--sr-line-live, #cdd3cf) !important;
          border-radius: 8px !important;
          overflow: hidden !important;
          box-shadow: 0 4px 14px color-mix(in srgb, var(--sr-ink-live, #1f2824) 10%, transparent) !important;
        }

        .campos-desktop-shell .leaflet-bar a {
          width: 30px !important;
          height: 30px !important;
          line-height: 30px !important;
          color: var(--sr-ink-live, #1f2824) !important;
          background: color-mix(in srgb, var(--sr-panel-live, #ffffff) 96%, transparent) !important;
        }

        .campos-desktop-shell .leaflet-control-attribution {
          padding: 2px 6px !important;
          font-size: 9px !important;
          color: var(--sr-ink-muted-live, #6d7772) !important;
          background: color-mix(in srgb, var(--sr-panel-live, #ffffff) 82%, transparent) !important;
        }

        .campos-desktop-shell .leaflet-popup-content-wrapper {
          border-radius: 10px !important;
          background: var(--sr-panel-live, #ffffff) !important;
          color: var(--sr-ink-live, #1f2824) !important;
          box-shadow: 0 10px 30px color-mix(in srgb, var(--sr-ink-live, #1f2824) 18%, transparent) !important;
        }

        .campos-desktop-shell .leaflet-popup-tip {
          background: var(--sr-panel-live, #ffffff) !important;
        }

        .campos-desktop-shell .leaflet-popup-content {
          margin: 12px 14px !important;
          min-width: 220px !important;
          font-size: 12px !important;
          line-height: 1.45 !important;
        }

        .campos-desktop-shell ~ div {
          left: calc(var(--campos-left) + var(--campos-rail) + 12px) !important;
          right: 12px !important;
          top: 50px !important;
        }

        .campos-desktop-shell ~ div > div {
          max-width: 1060px !important;
          border-radius: 10px !important;
          background: color-mix(in srgb, var(--sr-panel-live, #ffffff) 96%, transparent) !important;
          border-color: var(--sr-line-live, #cdd3cf) !important;
          box-shadow: 0 8px 24px color-mix(in srgb, var(--sr-ink-live, #1f2824) 13%, transparent) !important;
        }

        .campos-desktop-shell ~ div > div > div:first-child {
          min-height: 40px !important;
          padding-top: 5px !important;
          padding-bottom: 5px !important;
        }

        .campos-desktop-shell ~ div button,
        .campos-desktop-shell ~ div input {
          font-size: 11px !important;
        }
      }

      @media (min-width: 1600px) {
        .campos-desktop-shell {
          --campos-left: 320px;
          --campos-details: 420px;
        }
      }
    `}</style>
  )
}
