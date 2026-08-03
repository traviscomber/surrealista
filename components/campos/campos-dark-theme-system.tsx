"use client"

export function CAMPOSDarkThemeSystem() {
  return (
    <style jsx global>{`
      @media (min-width: 1024px) {
        .dark .campos-desktop-shell {
          color: #e4e8e7 !important;
          --campos-bg: #090c0c;
          --campos-panel: #0e1212;
          --campos-panel-elevated: #111616;
          --campos-text: #e4e8e7;
          --campos-muted: #a1a9a7;
          --campos-soft: #d0d6d5;
          --campos-accent: #ff4e45;
          --campos-line: #542d2b;
          --campos-border: rgba(84, 45, 43, 0.78);
        }

        .dark .campos-desktop-shell > div,
        .dark .campos-desktop-shell > div > div:nth-child(3),
        .dark .campos-desktop-shell > div > div:nth-child(3) > div:nth-child(2) {
          background: var(--campos-bg) !important;
          color: var(--campos-text) !important;
        }

        .dark .campos-desktop-shell > div > div:first-child,
        .dark .campos-desktop-shell > div > div:nth-child(2),
        .dark .campos-desktop-shell > div > div:nth-child(3) > div:first-child,
        .dark .campos-desktop-shell > div > div:nth-child(3) > div:nth-child(2) > div[class*="transition-[height]"] {
          background: var(--campos-panel) !important;
          color: var(--campos-text) !important;
          border-color: var(--campos-border) !important;
          box-shadow: none !important;
        }

        .dark .campos-desktop-shell > div > div:first-child > div,
        .dark .campos-desktop-shell > div > div:first-child [class*="bg-gradient"],
        .dark .campos-desktop-shell > div > div:first-child [class*="bg-white"],
        .dark .campos-desktop-shell > div > div:first-child [class*="bg-slate"],
        .dark .campos-desktop-shell [role="tabpanel"],
        .dark .campos-desktop-shell [role="tabpanel"] > div,
        .dark .campos-desktop-shell [role="tabpanel"] [class*="bg-white"],
        .dark .campos-desktop-shell [role="tabpanel"] [class*="bg-slate"],
        .dark .campos-desktop-shell [role="tabpanel"] [class*="bg-card"] {
          background: var(--campos-panel) !important;
          color: var(--campos-text) !important;
          border-color: var(--campos-border) !important;
          box-shadow: none !important;
        }

        .dark .campos-desktop-shell input,
        .dark .campos-desktop-shell textarea,
        .dark .campos-desktop-shell select {
          background: var(--campos-panel-elevated) !important;
          color: var(--campos-text) !important;
          border-color: var(--campos-border) !important;
          box-shadow: none !important;
        }

        .dark .campos-desktop-shell input::placeholder,
        .dark .campos-desktop-shell textarea::placeholder {
          color: #727b79 !important;
        }

        .dark .campos-desktop-shell button:not([class*="bg-orange"]):not([class*="bg-amber"]):not([class*="bg-green"]):not([class*="bg-red"]),
        .dark .campos-desktop-shell [role="button"] {
          color: var(--campos-soft) !important;
          border-color: var(--campos-border) !important;
        }

        .dark .campos-desktop-shell button:hover:not(:disabled),
        .dark .campos-desktop-shell [role="button"]:hover {
          background: var(--campos-panel-elevated) !important;
          color: var(--campos-text) !important;
        }

        .dark .campos-desktop-shell button[class*="bg-secondary"],
        .dark .campos-desktop-shell button[data-state="active"],
        .dark .campos-desktop-shell [aria-selected="true"] {
          background: rgba(255, 78, 69, 0.13) !important;
          color: #ffffff !important;
          border-color: rgba(255, 78, 69, 0.52) !important;
        }

        .dark .campos-desktop-shell [class*="text-slate-9"],
        .dark .campos-desktop-shell [class*="text-slate-8"],
        .dark .campos-desktop-shell [class*="text-foreground"] {
          color: var(--campos-text) !important;
        }

        .dark .campos-desktop-shell [class*="text-slate-7"],
        .dark .campos-desktop-shell [class*="text-slate-6"],
        .dark .campos-desktop-shell [class*="text-muted"] {
          color: var(--campos-muted) !important;
        }

        .dark .campos-desktop-shell [class*="text-slate-5"],
        .dark .campos-desktop-shell [class*="text-slate-4"] {
          color: #7f8987 !important;
        }

        .dark .campos-desktop-shell [role="tablist"] {
          background: #090c0c !important;
          border: 1px solid var(--campos-border) !important;
        }

        .dark .campos-desktop-shell [role="tab"] {
          color: var(--campos-muted) !important;
          background: transparent !important;
        }

        .dark .campos-desktop-shell [role="tab"][data-state="active"],
        .dark .campos-desktop-shell [role="tab"][aria-selected="true"] {
          color: #ffffff !important;
          background: rgba(255, 78, 69, 0.16) !important;
          box-shadow: inset 0 0 0 1px rgba(255, 78, 69, 0.45) !important;
        }

        .dark .campos-desktop-shell [class*="border-slate"],
        .dark .campos-desktop-shell [class*="border-border"] {
          border-color: var(--campos-border) !important;
        }

        .dark .campos-desktop-shell [class*="bg-slate-50"],
        .dark .campos-desktop-shell [class*="bg-slate-100"],
        .dark .campos-desktop-shell [class*="bg-muted"] {
          background: var(--campos-panel-elevated) !important;
        }

        .dark .campos-desktop-shell [class*="bg-slate-900"] {
          background: rgba(255, 78, 69, 0.16) !important;
          color: #ffffff !important;
          border-color: rgba(255, 78, 69, 0.45) !important;
        }

        .dark .campos-desktop-shell ~ div > div {
          background: rgba(14, 18, 18, 0.97) !important;
          color: var(--campos-text) !important;
          border-color: var(--campos-border) !important;
          box-shadow: 0 12px 34px rgba(0, 0, 0, 0.42) !important;
          backdrop-filter: blur(12px) !important;
        }

        .dark .campos-desktop-shell ~ div section,
        .dark .campos-desktop-shell ~ div [class*="bg-white"],
        .dark .campos-desktop-shell ~ div [class*="bg-slate"] {
          background: var(--campos-panel) !important;
          color: var(--campos-text) !important;
          border-color: var(--campos-border) !important;
        }

        .dark .campos-desktop-shell ~ div button {
          color: var(--campos-soft) !important;
          border-color: var(--campos-border) !important;
        }

        .dark .campos-desktop-shell ~ div button:hover:not(:disabled) {
          background: var(--campos-panel-elevated) !important;
          color: #ffffff !important;
        }

        .dark .campos-desktop-shell ~ div button[class*="bg-slate-900"] {
          background: #ff4e45 !important;
          color: #090c0c !important;
          border-color: #ff4e45 !important;
        }

        .dark .campos-desktop-shell ~ div input {
          background: var(--campos-panel-elevated) !important;
          color: var(--campos-text) !important;
          border-color: var(--campos-border) !important;
        }

        .dark .campos-desktop-shell .leaflet-container {
          background: #090c0c !important;
        }

        .dark .campos-desktop-shell .leaflet-tile-pane {
          filter: brightness(0.72) saturate(0.72) contrast(1.08);
        }

        .dark .campos-desktop-shell [class*="absolute left-3 top-3"] button,
        .dark .campos-desktop-shell .leaflet-bar a,
        .dark .campos-desktop-shell .leaflet-control-layers,
        .dark .campos-desktop-shell .leaflet-control-layers-expanded {
          background: rgba(14, 18, 18, 0.96) !important;
          color: var(--campos-text) !important;
          border-color: var(--campos-border) !important;
          box-shadow: 0 6px 18px rgba(0, 0, 0, 0.32) !important;
        }

        .dark .campos-desktop-shell .leaflet-bar a:hover,
        .dark .campos-desktop-shell .leaflet-control-layers:hover {
          background: #111616 !important;
          color: #ffffff !important;
        }

        .dark .campos-desktop-shell .leaflet-control-attribution {
          background: rgba(9, 12, 12, 0.82) !important;
          color: #8e9896 !important;
        }

        .dark .campos-desktop-shell .leaflet-control-attribution a {
          color: #d0d6d5 !important;
        }

        .dark .campos-desktop-shell .leaflet-popup-content-wrapper,
        .dark .campos-desktop-shell .leaflet-popup-tip,
        .dark .kmz-property-popup .leaflet-popup-content-wrapper,
        .dark .kmz-property-popup .leaflet-popup-tip {
          background: #0e1212 !important;
          color: #e4e8e7 !important;
          border-color: var(--campos-border) !important;
        }

        .dark .campos-desktop-shell .leaflet-popup-close-button,
        .dark .kmz-property-popup .leaflet-popup-close-button {
          color: #d0d6d5 !important;
          background: rgba(255, 255, 255, 0.06) !important;
        }

        .dark .campos-desktop-shell .leaflet-popup-close-button:hover,
        .dark .kmz-property-popup .leaflet-popup-close-button:hover {
          color: #ffffff !important;
          background: rgba(255, 78, 69, 0.16) !important;
        }

        .dark .campos-desktop-shell [class*="bg-background/95"],
        .dark .campos-desktop-shell [class*="bg-background/30"] {
          background: rgba(14, 18, 18, 0.94) !important;
          color: var(--campos-text) !important;
          border-color: var(--campos-border) !important;
        }

        .dark .campos-desktop-shell [class*="border-amber"] {
          border-color: rgba(255, 78, 69, 0.52) !important;
        }

        .dark .campos-desktop-shell [class*="text-amber"] {
          color: #ff8a84 !important;
        }
      }
    `}</style>
  )
}
