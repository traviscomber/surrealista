/** PDF generation utilities for KMZ properties. */

function createPropertyHtml(kmzData: any, propertyName: string): string {
  return `<!doctype html><html><head><meta charset="UTF-8"><title>Ficha de Propiedad - ${propertyName}</title></head><body><h1>${propertyName}</h1><dl><dt>Ubicación</dt><dd>${kmzData?.address || "No disponible"}</dd><dt>Coordenadas</dt><dd>${kmzData?.latitude ?? "N/A"}, ${kmzData?.longitude ?? "N/A"}</dd><dt>Superficie</dt><dd>${kmzData?.area ?? "No disponible"}</dd><dt>Descripción</dt><dd>${kmzData?.description || "Sin descripción"}</dd></dl></body></html>`
}

export async function generatePropertyPDF(kmzData: any, propertyName: string) {
  const html2pdf = await import("html2pdf.js").then((module) => module.default).catch(() => null)
  if (!html2pdf) {
    downloadAsHTML(kmzData, propertyName)
    return
  }

  await (html2pdf as any)()
    .set({ margin: 10, filename: `propiedad-${propertyName.replace(/\s+/g, "-")}-${Date.now()}.pdf` })
    .from(createPropertyHtml(kmzData, propertyName))
    .save()
}

function downloadAsHTML(kmzData: any, propertyName: string) {
  const blob = new Blob([createPropertyHtml(kmzData, propertyName)], { type: "text/html" })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement("a")
  anchor.href = url
  anchor.download = `propiedad-${propertyName.replace(/\s+/g, "-")}.html`
  anchor.click()
  URL.revokeObjectURL(url)
}

export function downloadPropertySheet(kmzData: any, propertyName: string, format: "pdf" | "html" = "html") {
  if (format === "pdf") return generatePropertyPDF(kmzData, propertyName)
  downloadAsHTML(kmzData, propertyName)
}
