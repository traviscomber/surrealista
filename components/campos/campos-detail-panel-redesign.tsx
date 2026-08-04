"use client"

export function CAMPOSDetailPanelRedesign() {
  return (
    <style jsx global>{`
      @media (min-width: 1024px) {
        .campos-desktop-shell [data-campos-detail-panel="true"] {
          background: var(--sr-panel-live) !important;
          color: var(--sr-ink-live) !important;
        }

        .campos-desktop-shell [data-campos-detail-header="true"] {
          min-height: 54px !important;
          height: 54px !important;
          padding: 8px 12px !important;
          align-items: center !important;
          border-bottom: 1px solid var(--sr-line-live) !important;
          background: var(--sr-panel-live) !important;
        }

        .campos-desktop-shell [data-campos-detail-header="true"] > div:first-child {
          min-width: 0 !important;
          display: flex !important;
          flex-direction: column !important;
          justify-content: center !important;
          gap: 2px !important;
        }

        .campos-desktop-shell [data-campos-detail-header="true"] h2 {
          max-width: 330px !important;
          margin: 0 !important;
          font-size: 13px !important;
          line-height: 1.25 !important;
          font-weight: 650 !important;
          letter-spacing: -0.01em !important;
          color: var(--sr-ink-live) !important;
        }

        .campos-desktop-shell [data-campos-detail-header="true"] p {
          display: block !important;
          max-width: 330px !important;
          margin: 0 !important;
          font-size: 10.5px !important;
          line-height: 1.2 !important;
          color: var(--sr-ink-muted-live) !important;
        }

        .campos-desktop-shell [data-campos-detail-header="true"] button {
          width: 30px !important;
          height: 30px !important;
          min-height: 30px !important;
          border: 1px solid var(--sr-line-live) !important;
          border-radius: 7px !important;
          background: var(--sr-panel-soft-live) !important;
          color: var(--sr-ink-soft-live) !important;
        }

        .campos-desktop-shell [data-campos-detail-panel="true"] > div:nth-child(2) {
          overflow: hidden auto !important;
        }

        .campos-desktop-shell [data-campos-detail-panel="true"] > div:nth-child(2) > div > div:first-child {
          display: none !important;
        }

        .campos-desktop-shell [data-campos-detail-panel="true"] > div:nth-child(2) > div > div:nth-child(2) {
          padding: 10px 12px 12px !important;
        }

        .campos-desktop-shell [data-campos-detail-panel="true"] [class*="text-4xl"],
        .campos-desktop-shell [data-campos-detail-panel="true"] [class*="sm:text-4xl"] {
          font-size: 21px !important;
          line-height: 1.08 !important;
          font-weight: 680 !important;
          letter-spacing: -0.03em !important;
        }

        .campos-desktop-shell [data-campos-detail-panel="true"] [class*="text-3xl"] {
          font-size: 18px !important;
          line-height: 1.15 !important;
          font-weight: 650 !important;
          letter-spacing: -0.025em !important;
        }

        .campos-desktop-shell [data-campos-detail-panel="true"] [class*="text-2xl"] {
          font-size: 16px !important;
          line-height: 1.2 !important;
        }

        .campos-desktop-shell [data-campos-detail-panel="true"] :is(p, li, label, dd) {
          font-size: 11.5px !important;
          line-height: 1.45 !important;
        }

        .campos-desktop-shell [data-campos-detail-panel="true"] [class*="space-y-6"] > :not([hidden]) ~ :not([hidden]) {
          margin-top: 10px !important;
        }

        .campos-desktop-shell [data-campos-detail-panel="true"] [class*="p-5"],
        .campos-desktop-shell [data-campos-detail-panel="true"] [class*="p-4"] {
          padding: 11px !important;
        }

        .campos-desktop-shell [data-campos-detail-panel="true"] [class*="rounded-3xl"] {
          border-radius: 10px !important;
        }

        .campos-desktop-shell [data-campos-detail-panel="true"] [class*="rounded-2xl"] {
          border-radius: 9px !important;
        }

        .campos-desktop-shell [data-campos-detail-panel="true"] [data-campos-detail-tabs="true"] {
          position: sticky !important;
          top: 0 !important;
          z-index: 20 !important;
          display: flex !important;
          width: 100% !important;
          height: 38px !important;
          min-height: 38px !important;
          gap: 0 !important;
          padding: 0 !important;
          overflow-x: auto !important;
          overflow-y: hidden !important;
          border: 0 !important;
          border-bottom: 1px solid var(--sr-line-live) !important;
          border-radius: 0 !important;
          background: var(--sr-panel-live) !important;
          box-shadow: none !important;
          scrollbar-width: none !important;
          pointer-events: auto !important;
        }

        .campos-desktop-shell [data-campos-detail-tabs="true"]::-webkit-scrollbar {
          display: none !important;
        }

        .campos-desktop-shell [data-campos-detail-tabs="true"] [role="tab"] {
          position: relative !important;
          z-index: 21 !important;
          flex: 0 0 auto !important;
          min-width: max-content !important;
          height: 38px !important;
          min-height: 38px !important;
          padding: 0 10px !important;
          border: 0 !important;
          border-radius: 0 !important;
          background: transparent !important;
          color: var(--sr-ink-muted-live) !important;
          font-size: 10.5px !important;
          font-weight: 600 !important;
          line-height: 38px !important;
          box-shadow: none !important;
          pointer-events: auto !important;
          cursor: pointer !important;
        }

        .campos-desktop-shell [data-campos-detail-tabs="true"] [role="tab"]::after {
          content: "";
          position: absolute;
          right: 9px;
          bottom: 0;
          left: 9px;
          height: 2px;
          background: transparent;
        }

        .campos-desktop-shell [data-campos-detail-tabs="true"] [role="tab"]:hover {
          color: var(--sr-ink-live) !important;
          background: var(--sr-panel-soft-live) !important;
        }

        .campos-desktop-shell [data-campos-detail-tabs="true"] [role="tab"][data-state="active"],
        .campos-desktop-shell [data-campos-detail-tabs="true"] [role="tab"][aria-selected="true"] {
          color: var(--sr-brand-strong-live) !important;
          background: transparent !important;
        }

        .campos-desktop-shell [data-campos-detail-tabs="true"] [role="tab"][data-state="active"]::after,
        .campos-desktop-shell [data-campos-detail-tabs="true"] [role="tab"][aria-selected="true"]::after {
          background: var(--sr-brand-live) !important;
        }

        .campos-desktop-shell [data-campos-detail-panel="true"] [role="tabpanel"] {
          position: relative !important;
          z-index: 1 !important;
          padding: 12px !important;
          background: var(--sr-panel-live) !important;
        }
      }
    `}</style>
  )
}
