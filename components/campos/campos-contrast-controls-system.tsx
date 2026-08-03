"use client"

export function CAMPOSContrastControlsSystem() {
  return (
    <style jsx global>{`
      @media (min-width: 1024px) {
        .campos-desktop-shell {
          --sr-button-primary-bg: #304f41;
          --sr-button-primary-fg: #ffffff;
          --sr-button-primary-hover: #243f34;
          --sr-button-secondary-bg: #ffffff;
          --sr-button-secondary-fg: #304f41;
          --sr-button-secondary-hover: #e7eee9;
          --sr-button-ghost-hover: #f3f1ec;
          --sr-button-disabled-bg: #e9e6df;
          --sr-button-disabled-fg: #7b8580;
          --sr-focus-ring-live: #3b7356;
          --sr-danger-live: #a84438;
          --sr-warning-live: #9a681d;
        }

        .dark .campos-desktop-shell {
          --sr-button-primary-bg: #9bc2aa;
          --sr-button-primary-fg: #142019;
          --sr-button-primary-hover: #b1d0bc;
          --sr-button-secondary-bg: #27302c;
          --sr-button-secondary-fg: #f3f1ea;
          --sr-button-secondary-hover: #333c38;
          --sr-button-ghost-hover: #27302c;
          --sr-button-disabled-bg: #27302c;
          --sr-button-disabled-fg: #858d88;
          --sr-focus-ring-live: #9bc2aa;
          --sr-danger-live: #ef8d82;
          --sr-warning-live: #e1b06c;
        }

        .campos-desktop-shell button,
        .campos-desktop-shell [role="button"] {
          opacity: 1;
          text-shadow: none !important;
          transition: background-color 150ms ease, border-color 150ms ease, color 150ms ease, box-shadow 150ms ease, transform 150ms ease !important;
        }

        .campos-desktop-shell button:focus-visible,
        .campos-desktop-shell [role="button"]:focus-visible,
        .campos-desktop-shell input:focus-visible,
        .campos-desktop-shell select:focus-visible,
        .campos-desktop-shell textarea:focus-visible {
          outline: 2px solid var(--sr-focus-ring-live) !important;
          outline-offset: 2px !important;
          box-shadow: 0 0 0 4px color-mix(in srgb, var(--sr-focus-ring-live) 20%, transparent) !important;
        }

        .campos-desktop-shell button:disabled,
        .campos-desktop-shell [role="button"][aria-disabled="true"] {
          background: var(--sr-button-disabled-bg) !important;
          color: var(--sr-button-disabled-fg) !important;
          border-color: var(--sr-line-live) !important;
          opacity: 0.72 !important;
          cursor: not-allowed !important;
          box-shadow: none !important;
          transform: none !important;
        }

        .campos-desktop-shell button[class*="bg-primary"],
        .campos-desktop-shell button[class*="bg-slate-900"],
        .campos-desktop-shell button[class*="bg-foreground"],
        .campos-desktop-shell button[data-variant="primary"],
        .campos-desktop-shell ~ div button[class*="bg-slate-900"] {
          background: var(--sr-button-primary-bg) !important;
          color: var(--sr-button-primary-fg) !important;
          border: 1px solid var(--sr-button-primary-bg) !important;
          box-shadow: none !important;
        }

        .campos-desktop-shell button[class*="bg-primary"]:hover:not(:disabled),
        .campos-desktop-shell button[class*="bg-slate-900"]:hover:not(:disabled),
        .campos-desktop-shell button[class*="bg-foreground"]:hover:not(:disabled),
        .campos-desktop-shell button[data-variant="primary"]:hover:not(:disabled),
        .campos-desktop-shell ~ div button[class*="bg-slate-900"]:hover:not(:disabled) {
          background: var(--sr-button-primary-hover) !important;
          color: var(--sr-button-primary-fg) !important;
          border-color: var(--sr-button-primary-hover) !important;
          transform: translateY(-1px) !important;
        }

        .campos-desktop-shell button[class*="outline"],
        .campos-desktop-shell button[class*="border-input"],
        .campos-desktop-shell button[class*="bg-background"],
        .campos-desktop-shell button[class*="bg-card"] {
          background: var(--sr-button-secondary-bg) !important;
          color: var(--sr-button-secondary-fg) !important;
          border-color: var(--sr-line-strong-live) !important;
        }

        .campos-desktop-shell button[class*="outline"]:hover:not(:disabled),
        .campos-desktop-shell button[class*="border-input"]:hover:not(:disabled),
        .campos-desktop-shell button[class*="bg-background"]:hover:not(:disabled),
        .campos-desktop-shell button[class*="bg-card"]:hover:not(:disabled) {
          background: var(--sr-button-secondary-hover) !important;
          color: var(--sr-button-secondary-fg) !important;
          border-color: var(--sr-brand-live) !important;
        }

        .campos-desktop-shell button[class*="ghost"],
        .campos-desktop-shell button[class*="bg-transparent"] {
          background: transparent !important;
          color: var(--sr-ink-soft-live) !important;
          border-color: transparent !important;
        }

        .campos-desktop-shell button[class*="ghost"]:hover:not(:disabled),
        .campos-desktop-shell button[class*="bg-transparent"]:hover:not(:disabled) {
          background: var(--sr-button-ghost-hover) !important;
          color: var(--sr-ink-live) !important;
        }

        .campos-desktop-shell button[data-state="active"],
        .campos-desktop-shell button[aria-pressed="true"],
        .campos-desktop-shell [role="button"][aria-selected="true"] {
          background: var(--sr-brand-soft-live) !important;
          color: var(--sr-brand-strong-live) !important;
          border-color: var(--sr-brand-live) !important;
          box-shadow: inset 0 0 0 1px color-mix(in srgb, var(--sr-brand-live) 45%, transparent) !important;
        }

        .campos-desktop-shell [role="tab"] {
          color: var(--sr-ink-soft-live) !important;
        }

        .campos-desktop-shell [role="tab"]:hover {
          color: var(--sr-ink-live) !important;
          background: color-mix(in srgb, var(--sr-brand-soft-live) 45%, transparent) !important;
        }

        .campos-desktop-shell [role="tab"][data-state="active"],
        .campos-desktop-shell [role="tab"][aria-selected="true"] {
          color: var(--sr-brand-strong-live) !important;
          background: var(--sr-panel-live) !important;
          border: 1px solid var(--sr-brand-live) !important;
          box-shadow: none !important;
        }

        .campos-desktop-shell input,
        .campos-desktop-shell textarea,
        .campos-desktop-shell select {
          color: var(--sr-ink-live) !important;
          caret-color: var(--sr-brand-live) !important;
        }

        .campos-desktop-shell input::placeholder,
        .campos-desktop-shell textarea::placeholder {
          color: var(--sr-ink-muted-live) !important;
          opacity: 1 !important;
        }

        .campos-desktop-shell [class*="bg-orange"],
        .campos-desktop-shell [class*="bg-amber"] {
          color: var(--sr-warning-live) !important;
        }

        .campos-desktop-shell [class*="bg-red"],
        .campos-desktop-shell [class*="text-red"] {
          color: var(--sr-danger-live) !important;
        }

        .campos-desktop-shell .leaflet-bar a,
        .campos-desktop-shell .leaflet-control-layers-toggle,
        .campos-desktop-shell [class*="absolute left-3 top-3"] button {
          color: var(--sr-ink-live) !important;
          background: var(--sr-panel-live) !important;
          border-color: var(--sr-line-strong-live) !important;
        }

        .campos-desktop-shell .leaflet-bar a:hover,
        .campos-desktop-shell .leaflet-control-layers-toggle:hover,
        .campos-desktop-shell [class*="absolute left-3 top-3"] button:hover:not(:disabled) {
          color: var(--sr-brand-strong-live) !important;
          background: var(--sr-brand-soft-live) !important;
          border-color: var(--sr-brand-live) !important;
        }

        .dark .campos-desktop-shell [class*="bg-white"],
        .dark .campos-desktop-shell [class*="text-white"] {
          text-shadow: none !important;
        }
      }
    `}</style>
  )
}
