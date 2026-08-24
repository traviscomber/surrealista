/**
 * PDF Generation Utility for KMZ Properties
 * Generates formatted property sheets as PDF
 */

export async function generatePropertyPDF(kmzData: any, propertyName: string) {
  const html2pdf = await import("html2pdf.js").then((module) => module.default).catch(() => null)
  if (!html2pdf) {
    console.error("html2pdf is not available")
    return
  }

  const htmlContent = `<h1>${propertyName}</h1><p>${kmzData?.description || "Sin descripción"}</p>`
  await (html2pdf as any)().set({
    margin: 10,
    filename: `propiedad-${propertyName.replace(/\s+/g, "-")}-${Date.now()}.pdf`,
  }).from(htmlContent).save()
}

// Fallback: Download as HTML
function downloadAsHTML(kmzData: any, propertyName: string) {
  const html = \`
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="UTF-8">
        <title>Ficha de Propiedad - \${propertyName}</title>
        <style>
          body { font-family: Arial; margin: 20px; }
          h1 { color: #667eea; }
          .info { margin: 15px 0; padding: 10px; background: #f0f0f0; }
        </style>
      </head>
      <body>
        <h1>\${propertyName}</h1>
        <div class="info">
          <p><strong>Ubicación:</strong> \${kmzData?.address || 'N/A'}</p>
          <p><strong>Coordenadas:</strong> Lat: \${kmzData?.latitude}, Lng: \${kmzData?.longitude}</p>
          <p><strong>Superficie:</strong> \${kmzData?.area} m²</p>
          <p><strong>Valor:</strong> \${kmzData?.price}</p>
          <p><strong>Descripción:</strong> \${kmzData?.description || 'N/A'}</p>
        </div>
        <p style="color: #999; font-size: 12px;">Generado: \${new Date().toLocaleString()}</p>
      </body>
    </html>
  \`

  const blob = new Blob([html], { type: 'text/html' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = \`propiedad-\${propertyName.replace(/\\s+/g, '-')}.html\`
  a.click()
  URL.revokeObjectURL(url)
}

export function downloadPropertySheet(kmzData: any, propertyName: string, format: 'pdf' | 'html' = 'html') {
  if (format === 'pdf') {
    generatePropertyPDF(kmzData, propertyName)
  } else {
    downloadAsHTML(kmzData, propertyName)
  }
}
