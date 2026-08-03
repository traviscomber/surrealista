"use client"

export function CAMPOSPremiumPolishSystem() {
  return (
    <style jsx global>{`
      @media (min-width: 1024px) {
        .campos-desktop-shell {
          --sr-canvas-live: #faf9f6;
          --sr-panel-live: #ffffff;
          --sr-panel-soft-live: #f3f1ec;
          --sr-panel-muted-live: #e9e6df;
          --sr-ink-live: #1f2824;
          --sr-ink-soft-live: #4a5550;
          --sr-ink-muted-live: #6d7772;
          --sr-line-live: #cdd3cf;
          --sr-line-strong-live: #a1aca6;
          --sr-brand-live: #47705c;
          --sr-brand-strong-live: #304f41;
          --sr-brand-soft-live: #cedbd2;
          --sr-water-live: #5c8290;
          --sr-earth-live: #896c52;
        }

        .dark .campos-desktop-shell {
          --sr-canvas-live: #141a17;
          --sr-panel-live: #1d2521;
          --sr-panel-soft-live: #27302c;
          --sr-panel-muted-live: #333c38;
          --sr-ink-live: #f3f1ea;
          --sr-ink-soft-live: #cbc8bf;
          --sr-ink-muted-live: #aba89f;
          --sr-line-live: #46524c;
          --sr-line-strong-live: #68756f;
          --sr-brand-live: #8db79e;
          --sr-brand-strong-live: #b1d0bc;
          --sr-brand-soft-live: #33483d;
          --sr-water-live: #8eb0bc;
          --sr-earth-live: #c3a98f;
        }

        .campos-desktop-shell,
        .campos-desktop-shell button,
        .campos-desktop-shell input,
        .campos-desktop-shell textarea,
        .campos-desktop-shell select {
          font-family: "Helvetica Neue", Inter, Arial, sans-serif !important;
        }

        .campos-desktop-shell > div {
          background: var(--sr-canvas-live) !important;
        }

        .campos-desktop-shell > div > div:first-child,
        .campos-desktop-shell > div > div:nth-child(2),
        .campos-desktop-shell > div > div:nth-child(3) > div:first-child,
        .campos-desktop-shell > div > div:nth-child(3) > div:nth-child(2) > div[class*="transition-[height]"] {
          background: var(--sr-panel-live) !important;
          border-color: var(--sr-line-live) !important;
        }

        .campos-desktop-shell > div > div:first-child {
          box-shadow: 8px 0 28px -28px rgba(31, 40, 36, 0.45) !important;
        }

        .campos-desktop-shell > div > div:first-child > div:first-child {
          padding: 14px 12px 12px !important;
          background: var(--sr-panel-live) !important;
        }

        .campos-desktop-shell > div > div:first-child input {
          height: 40px !important;
          border-radius: 8px !important;
          background: var(--sr-panel-soft-live) !important;
          color: var(--sr-ink-live) !important;
          border: 1px solid var(--sr-line-live) !important;
          font-size: 13px !important;
          transition: border-color 160ms ease, background-color 160ms ease, box-shadow 160ms ease !important;
        }

        .campos-desktop-shell > div > div:first-child input:focus {
          border-color: var(--sr-brand-live) !important;
          box-shadow: 0 0 0 3px color-mix(in srgb, var(--sr-brand-live) 18%, transparent) !important;
        }

        .campos-desktop-shell > div > div:first-child [class*="bg-gradient-to-b"] {
          padding: 14px 12px !important;
          gap: 12px !important;
          background: var(--sr-panel-live) !important;
          border-bottom: 1px solid var(--sr-line-live) !important;
        }

        .campos-desktop-shell > div > div:first-child [class*="bg-gradient-to-b"] > div:first-child h2 {
          font-size: 15px !important;
          line-height: 1.25 !important;
          font-weight: 650 !important;
          letter-spacing: -0.02em !important;
          color: var(--sr-ink-live) !important;
        }

        .campos-desktop-shell > div > div:first-child [class*="bg-gradient-to-b"] > div:nth-child(2) {
          gap: 8px !important;
        }

        .campos-desktop-shell > div > div:first-child [class*="bg-gradient-to-b"] > div:nth-child(2) > div {
          min-height: 58px !important;
          padding: 9px 10px !important;
          border-radius: 8px !important;
          border: 1px solid var(--sr-line-live) !important;
          background: var(--sr-panel-soft-live) !important;
        }

        .campos-desktop-shell > div > div:first-child [class*="bg-gradient-to-b"] > div:nth-child(2) > div p:first-child {
          color: var(--sr-ink-muted-live) !important;
          font-size: 10px !important;
          font-weight: 650 !important;
          letter-spacing: 0.12em !important;
        }

        .campos-desktop-shell > div > div:first-child [class*="bg-gradient-to-b"] > div:nth-child(2) > div p:nth-child(2) {
          color: var(--sr-ink-live) !important;
          font-size: 20px !important;
          font-weight: 600 !important;
          letter-spacing: -0.03em !important;
        }

        .campos-desktop-shell > div > div:first-child [class*="bg-gradient-to-b"] button[class*="w-full"] {
          height: 38px !important;
          border-radius: 8px !important;
          border: 1px solid var(--sr-line-strong-live) !important;
          background: var(--sr-panel-live) !important;
          color: var(--sr-ink-live) !important;
          font-size: 12px !important;
          font-weight: 600 !important;
        }

        .campos-desktop-shell > div > div:first-child [class*="bg-gradient-to-b"] button[class*="w-full"]:hover {
          border-color: var(--sr-brand-live) !important;
          background: var(--sr-brand-soft-live) !important;
          color: var(--sr-brand-strong-live) !important;
        }

        .campos-desktop-shell > div > div:first-child .overflow-y-auto {
          scrollbar-width: thin !important;
          scrollbar-color: var(--sr-line-strong-live) transparent !important;
        }

        .campos-desktop-shell > div > div:first-child .overflow-y-auto > div.p-4 {
          padding: 10px 8px 18px !important;
        }

        .campos-desktop-shell > div > div:first-child .overflow-y-auto button[class*="justify-start"] {
          min-height: 40px !important;
          padding: 8px 9px !important;
          border-radius: 7px !important;
          color: var(--sr-ink-soft-live) !important;
          transition: background-color 140ms ease, color 140ms ease, transform 140ms ease !important;
        }

        .campos-desktop-shell > div > div:first-child .overflow-y-auto button[class*="justify-start"]:hover {
          background: var(--sr-panel-soft-live) !important;
          color: var(--sr-ink-live) !important;
          transform: translateX(1px) !important;
        }

        .campos-desktop-shell > div > div:first-child .overflow-y-auto button[class*="justify-start"].bg-secondary,
        .campos-desktop-shell > div > div:first-child .overflow-y-auto button[class*="justify-start"][data-state="active"] {
          background: var(--sr-brand-soft-live) !important;
          color: var(--sr-brand-strong-live) !important;
          box-shadow: inset 3px 0 0 var(--sr-brand-live) !important;
        }

        .campos-desktop-shell > div > div:first-child .ml-8 {
          margin-left: 18px !important;
          padding-left: 8px !important;
          border-left: 1px solid var(--sr-line-live) !important;
        }

        .campos-desktop-shell > div > div:first-child [class*="rounded-full"] {
          border-width: 1px !important;
          font-weight: 650 !important;
          letter-spacing: 0 !important;
        }

        .campos-desktop-shell > div > div:first-child [class*="bg-orange"],
        .campos-desktop-shell > div > div:first-child [class*="bg-amber"] {
          background: color-mix(in srgb, var(--sr-earth-live) 18%, var(--sr-panel-live)) !important;
          color: var(--sr-earth-live) !important;
          border-color: color-mix(in srgb, var(--sr-earth-live) 45%, transparent) !important;
        }

        .campos-desktop-shell > div > div:first-child [class*="bg-green"] {
          background: color-mix(in srgb, var(--sr-brand-live) 18%, var(--sr-panel-live)) !important;
          color: var(--sr-brand-strong-live) !important;
          border-color: color-mix(in srgb, var(--sr-brand-live) 45%, transparent) !important;
        }

        .campos-desktop-shell > div > div:first-child [class*="bg-blue"],
        .campos-desktop-shell > div > div:first-child [class*="text-blue"] {
          background: color-mix(in srgb, var(--sr-water-live) 16%, var(--sr-panel-live)) !important;
          color: var(--sr-water-live) !important;
          border-color: color-mix(in srgb, var(--sr-water-live) 42%, transparent) !important;
        }

        .campos-desktop-shell > div > div:nth-child(3) > div:first-child {
          padding: 0 16px !important;
          background: color-mix(in srgb, var(--sr-panel-live) 96%, transparent) !important;
          backdrop-filter: blur(10px) !important;
        }

        .campos-desktop-shell > div > div:nth-child(3) > div:first-child h1 {
          color: var(--sr-ink-live) !important;
          font-size: 15px !important;
          font-weight: 650 !important;
          letter-spacing: 0.01em !important;
        }

        .campos-desktop-shell > div > div:nth-child(3) > div:nth-child(2) > div[class*="transition-[height]"] {
          box-shadow: -14px 0 34px -30px rgba(31, 40, 36, 0.5) !important;
        }

        .campos-desktop-shell > div > div:nth-child(3) > div:nth-child(2) > div[class*="transition-[height]"] > div:first-child {
          padding: 0 16px !important;
          border-bottom: 1px solid var(--sr-line-live) !important;
          background: var(--sr-panel-live) !important;
        }

        .campos-desktop-shell [role="tablist"] {
          padding: 3px !important;
          border: 1px solid var(--sr-line-live) !important;
          background: var(--sr-panel-soft-live) !important;
        }

        .campos-desktop-shell [role="tab"] {
          color: var(--sr-ink-muted-live) !important;
          font-size: 11px !important;
          font-weight: 600 !important;
        }

        .campos-desktop-shell [role="tab"][data-state="active"],
        .campos-desktop-shell [role="tab"][aria-selected="true"] {
          color: var(--sr-brand-strong-live) !important;
          background: var(--sr-panel-live) !important;
          box-shadow: 0 2px 8px -6px rgba(31, 40, 36, 0.45), inset 0 0 0 1px var(--sr-line-live) !important;
        }

        .campos-desktop-shell [role="tabpanel"] {
          background: var(--sr-panel-live) !important;
        }

        .campos-desktop-shell [role="tabpanel"] h2,
        .campos-desktop-shell [role="tabpanel"] h3 {
          color: var(--sr-ink-live) !important;
          font-weight: 650 !important;
        }

        .campos-desktop-shell [role="tabpanel"] p,
        .campos-desktop-shell [role="tabpanel"] label,
        .campos-desktop-shell [role="tabpanel"] span {
          text-rendering: optimizeLegibility !important;
        }

        .campos-desktop-shell [role="tabpanel"] [class*="rounded-2xl"],
        .campos-desktop-shell [role="tabpanel"] [class*="rounded-3xl"] {
          border: 1px solid var(--sr-line-live) !important;
          background: var(--sr-panel-soft-live) !important;
        }

        .campos-desktop-shell [class*="absolute left-3 top-3"] button,
        .campos-desktop-shell .leaflet-bar a,
        .campos-desktop-shell .leaflet-control-layers {
          border-color: color-mix(in srgb, var(--sr-line-strong-live) 75%, transparent) !important;
          background: color-mix(in srgb, var(--sr-panel-live) 94%, transparent) !important;
          color: var(--sr-ink-live) !important;
          box-shadow: 0 10px 26px -18px rgba(31, 40, 36, 0.58) !important;
          backdrop-filter: blur(10px) !important;
        }

        .campos-desktop-shell .leaflet-popup-content-wrapper {
          background: var(--sr-panel-live) !important;
          color: var(--sr-ink-live) !important;
          border: 1px solid var(--sr-line-live) !important;
        }

        .campos-desktop-shell .leaflet-popup-tip {
          background: var(--sr-panel-live) !important;
        }

        .campos-desktop-shell ~ div > div {
          border: 1px solid var(--sr-line-live) !important;
          background: color-mix(in srgb, var(--sr-panel-live) 96%, transparent) !important;
          box-shadow: 0 18px 46px -28px rgba(31, 40, 36, 0.5) !important;
          backdrop-filter: blur(14px) !important;
        }

        .campos-desktop-shell ~ div button[class*="bg-slate-900"] {
          background: var(--sr-brand-strong-live) !important;
          color: #ffffff !important;
          border-color: var(--sr-brand-strong-live) !important;
        }

        .dark .campos-desktop-shell ~ div button[class*="bg-slate-900"] {
          background: var(--sr-brand-live) !important;
          color: #142019 !important;
          border-color: var(--sr-brand-live) !important;
        }
      }
    `}</style>
  )
}
