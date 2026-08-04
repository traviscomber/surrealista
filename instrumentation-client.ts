const MAP_BASE_LAYER_STORAGE_KEY = "sur-realista-map-base-layer"
const DEFAULT_BASE_LAYER = "Satélite"

function normalizeLayerName(value: string | null | undefined) {
  return String(value || "").replace(/\s+/g, " ").trim()
}

function findLayerName(label: HTMLLabelElement) {
  const text = label.querySelector("span")?.textContent || label.textContent
  return normalizeLayerName(text)
}

function configureLayerControl(control: Element) {
  if (!(control instanceof HTMLElement)) return

  const labels = Array.from(control.querySelectorAll<HTMLLabelElement>("label"))
  const baseLayers = labels
    .map((label) => ({
      label,
      input: label.querySelector<HTMLInputElement>('input[type="radio"]'),
      name: findLayerName(label),
    }))
    .filter((entry) => entry.input && entry.name)

  if (baseLayers.length === 0) return

  const storedLayer = normalizeLayerName(window.localStorage.getItem(MAP_BASE_LAYER_STORAGE_KEY))
  const preferredLayer = storedLayer || DEFAULT_BASE_LAYER
  const preferred =
    baseLayers.find((entry) => entry.name.toLocaleLowerCase("es") === preferredLayer.toLocaleLowerCase("es")) ||
    baseLayers.find((entry) => entry.name.toLocaleLowerCase("es").includes("satélite"))

  if (preferred?.input && !preferred.input.checked) {
    preferred.input.click()
  }

  baseLayers.forEach(({ input, name }) => {
    if (!input || input.dataset.surRealistaLayerPreference === "ready") return
    input.dataset.surRealistaLayerPreference = "ready"
    input.addEventListener("change", () => {
      if (input.checked) window.localStorage.setItem(MAP_BASE_LAYER_STORAGE_KEY, name)
    })
  })
}

function configureAllLayerControls() {
  document.querySelectorAll(".leaflet-control-layers").forEach(configureLayerControl)
}

if (typeof window !== "undefined") {
  const start = () => {
    configureAllLayerControls()

    const observer = new MutationObserver(() => configureAllLayerControls())
    observer.observe(document.documentElement, { childList: true, subtree: true })
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start, { once: true })
  else start()
}
