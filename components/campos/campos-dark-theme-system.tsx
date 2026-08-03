"use client"

export function CAMPOSDarkThemeSystem() {
  return (
    <style jsx global>{`
      @media (min-width: 1024px) {
        .dark .campos-desktop-shell {
          --campos-bg: #141a17;
          --campos-panel: #1d2521;
          --campos-panel-subtle: #27302c;
          --campos-panel-muted: #333c38;
          --campos-text: #f3f1ea;
          --campos-text-soft: #cbc8bf;
          --campos-text-muted: #aba89f;
          --campos-accent: #8db79e;
          --campos-accent-strong: #a7cbb5;
          --campos-accent-soft: #34483d;
          --campos-border: #46524c;
          --campos-border-strong: #68756f;
          color: var(--campos-text) !important;
        }

        .dark .campos-desktop-shell,
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

        .dark .campos-desktop-shell > div > div:first-child [class*="grid-cols-2"] > div,
        .dark .campos-desktop-shell [class*="bg-muted"],
        .dark .campos-desktop-shell [class*="bg-slate-50"],
        .dark .campos-desktop-shell [class*="bg-slate-100"] {
          background: var(--campos-panel-subtle) !important;
          color: var(--campos-text) !important;
          border-color: var(--campos-border) !important;
        }

        .dark .campos-desktop-shell input,
        .dark .campos-desktop-shell textarea,
        .dark .campos-desktop-shell select {
          background: var(--campos-panel-subtle) !important;
          color: var(--campos-text) !important;
          border-color: var(--campos-border-strong) !important;
          box-shadow: none !important;
        }

        .dark .campos-desktop-shell input::placeholder,
        .dark .campos-desktop-shell textarea::placeholder {
          color: var(--campos-text-muted) !important;
          opacity: 1 !important;
        }

        .dark .campos-desktop-shell button:not([class*="bg-orange"]):not([class*="bg-amber"]):not([class*="bg-green"]):not([class*="bg-red"]),
        .dark .campos-desktop-shell [role="button"] {
          color: var(--campos-text-soft) !important;
          border-color: var(--campos-border) !important;
        }

        .dark .campos-desktop-shell button:hover:not(:disabled),
        .dark .campos-desktop-shell [role="button"]:hover {
          background: var(--campos-panel-subtle) !important;
          color: var(--campos-text) !important;
        }

        .dark .campos-desktop-shell button[class*="bg-secondary"],
        .dark .campos-desktop-shell button[data-state="active"],
        .dark .campos-desktop-shell [aria-selected="true"] {
          background: var(--campos-accent-soft) !important;
          color: var(--campos-accent-strong) !important;
          border-color: var(--campos-accent) !important;
        }

        .dark .campos-desktop-shell [class*="text-slate-9"],
        .dark .campos-desktop-shell [class*="text-slate-8"],
        .dark .campos-desktop-shell [class*="text-foreground"] {
          color: var(--campos-text) !important;
        }

        .dark .campos-desktop-shell [class*="text-slate-7"],
        .dark .campos-desktop-shell [class*="text-slate-6"],
        .dark .campos-desktop-shell [class*="text-muted"] {
          color: var(--campos-text-soft) !important;
        }

        .dark .campos-desktop-shell [class*="text-slate-5"],
        .dark .campos-desktop-shell [class*="text-slate-4"] {
          color: var(--campos-text-muted) !important;
        }

        .dark .campos-desktop-shell [role="tablist"] {
          background: var(--campos-panel-subtle) !important;
          border: 1px solid var(--campos-border) !important;
        }

        .dark .campos-desktop-shell [role="tab"] {
          color: var(--campos-text-soft) !important;
          background: transparent !important;
        }

        .dark .campos-desktop-shell [role="tab"][data-state="active"],
        .dark .campos-desktop-shell [role="tab"][aria-selected="true"] {
          color: var(--campos-accent-strong) !important;
          background: var(--campos-accent-soft) !important;
          box-shadow: inset 0 0 0 1px var(--campos-accent) !important;
        }

        .dark .campos-desktop-shell [class*="border-slate"],
        .dark .campos-desktop-shell [class*="border-border"] {
          border-color: var(--campos-border) !important;
        }

        .dark .campos-desktop-shell ~ div > div {
          background: rgba(29, 37, 33, 0.98) !important;
          color: var(--campos-text) !important;
          border-color: var(--campos-border) !important;
          box-shadow: 0 18px 42px rgba(8, 13, 10, 0.38) !important;
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
          color: var(--campos-text-soft) !important;
          border-color: var(--campos-border) !important;
        }

        .dark .campos-desktop-shell ~ div button:hover:not(:disabled) {
          background: var(--campos-panel-subtle) !important;
          color: var(--campos-text) !important;
        }

        .dark .campos-desktop-shell ~ div button[class*="bg-slate-900"] {
          background: var(--campos-accent) !important;
          color: #17211c !important;
          border-color: var(--campos-accent) !important;
        }

        .dark .campos-desktop-shell ~ div input {
          background: var(--campos-panel-subtle) !important;
          color: var(--campos-text) !important;
          border-color: var(--campos-border-strong) !important;
        }

        .dark .campos-desktop-shell .leaflet-container {
          background: #18201c !important;
        }

        .dark .campos-desktop-shell .leaflet-tile-pane {
          filter: none !important;
        }

        .dark .campos-desktop-shell [class*="absolute left-3 top-3"] button,
        .dark .campos-desktop-shell .leaflet-bar a,
        .dark .campos-desktop-shell .leaflet-control-layers,
        .dark .campos-desktop-shell .leaflet-control-layers-expanded {
          background: rgba(29, 37, 33, 0.96) !important;
          color: var(--campos-text) !important;
          border-color: var(--campos-border-strong) !important;
          box-shadow: 0 8px 20px rgba(8, 13, 10, 0.28) !important;
        }

        .dark .campos-desktop-shell .leaflet-bar a:hover,
        .dark .campos-desktop-shell .leaflet-control-layers:hover {
          background: var(--campos-panel-subtle) !important;
          color: var(--campos-accent-strong) !important;
        }

        .dark .campos-desktop-shell .leaflet-control-attribution {
          background: rgba(20, 26, 23, 0.88) !important;
          color: var(--campos-text-muted) !important;
        }

        .dark .campos-desktop-shell .leaflet-control-attribution a {
          color: var(--campos-accent-strong) !important;
        }

        .dark .campos-desktop-shell .leaflet-popup-content-wrapper,
        .dark .campos-desktop-shell .leaflet-popup-tip,
        .dark .kmz-property-popup .leaflet-popup-content-wrapper,
        .dark .kmz-property-popup .leaflet-popup-tip {
          background: var(--campos-panel) !important;
          color: var(--campos-text) !important;
          border-color: var(--campos-border-strong) !important;
        }

        .dark .campos-desktop-shell .leaflet-popup-close-button,
        .dark .kmz-property-popup .leaflet-popup-close-button {
          color: var(--campos-text-soft) !important;
          background: var(--campos-panel-subtle) !important;
        }

        .dark .campos-desktop-shell .leaflet-popup-close-button:hover,
        .dark .kmz-property-popup .leaflet-popup-close-button:hover {
          color: var(--campos-accent-strong) !important;
          background: var(--campos-accent-soft) !important;
        }

        .dark .campos-desktop-shell [class*="bg-background/95"],
        .dark .campos-desktop-shell [class*="bg-background/30"] {
          background: rgba(29, 37, 33, 0.96) !important;
          color: var(--campos-text) !important;
          border-color: var(--campos-border-strong) !important;
        }
      }
    `}</style>
  )
}
