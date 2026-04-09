/**
 * PDF Generation Utility for KMZ Properties
 * Generates formatted property sheets as PDF
 */

export async function generatePropertyPDF(kmzData: any, propertyName: string) {
  // Dynamic import to avoid bloat on initial load
  const html2pdf = await import('html2pdf.js').then(m => m.default).catch(() => null)
  
  if (!html2pdf) {
    console.error('html2pdf not available, using fallback')
    downloadAsHTML(kmzData, propertyName)
    return
  }

  // Create HTML content for the property
  const htmlContent = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="UTF-8">
        <title>Ficha de Propiedad - ${propertyName}</title>
        <style>
          body {
            font-family: 'Arial', sans-serif;
            margin: 20px;
            color: #333;
          }
          .header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 30px;
            border-radius: 10px;
            margin-bottom: 30px;
            text-align: center;
          }
          .header h1 {
            margin: 0;
            font-size: 28px;
          }
          .header p {
            margin: 5px 0;
            opacity: 0.9;
          }
          .property-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 20px;
            margin-bottom: 30px;
          }
          .info-card {
            border: 1px solid #ddd;
            border-radius: 8px;
            padding: 15px;
            background: #f9f9f9;
          }
          .info-card h3 {
            margin-top: 0;
            color: #667eea;
            font-size: 14px;
            text-transform: uppercase;
          }
          .info-card p {
            margin: 5px 0;
            font-size: 14px;
          }
          .info-value {
            font-weight: bold;
            color: #333;
            font-size: 16px;
          }
          .footer {
            margin-top: 40px;
            padding-top: 20px;
            border-top: 2px solid #ddd;
            text-align: center;
            color: #999;
            font-size: 12px;
          }
          .timestamp {
            color: #999;
            font-size: 12px;
            margin-top: 10px;
          }
          .page-break {
            page-break-after: always;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>${propertyName}</h1>
          <p>Ficha de Propiedad - Sur Realista</p>
        </div>

        <div class="property-grid">
          <div class="info-card">
            <h3>Ubicación</h3>
            <p><span class="info-value">${kmzData?.address || 'No disponible'}</span></p>
          </div>

          <div class="info-card">
            <h3>Coordenadas</h3>
            <p>Lat: <span class="info-value">${kmzData?.latitude?.toFixed(6) || 'N/A'}</span></p>
            <p>Lng: <span class="info-value">${kmzData?.longitude?.toFixed(6) || 'N/A'}</span></p>
          </div>

          <div class="info-card">
            <h3>Superficie</h3>
            <p><span class="info-value">${kmzData?.area ? `${kmzData.area.toLocaleString()} m²` : 'No disponible'}</span></p>
          </div>

          <div class="info-card">
            <h3>Valor</h3>
            <p><span class="info-value">${kmzData?.price ? `$${kmzData.price.toLocaleString()}` : 'Consultar'}</span></p>
          </div>

          <div class="info-card">
            <h3>Descripción</h3>
            <p>${kmzData?.description || 'Sin descripción'}</p>
          </div>

          <div class="info-card">
            <h3>Características</h3>
            <p>${kmzData?.features ? kmzData.features.join(', ') : 'N/A'}</p>
          </div>
        </div>

        <div class="footer">
          <p>Documento generado automáticamente por Sur Realista</p>
          <div class="timestamp">Generado: ${new Date().toLocaleString('es-CL')}</div>
        </div>
      </body>
    </html>
  `

  // Generate PDF
  const element = document.createElement('div')
  element.innerHTML = htmlContent

  const options = {
    margin: 10,
    filename: \`propiedad-\${propertyName.replace(/\\s+/g, '-')}-\${Date.now()}.pdf\`,
    image: { type: 'jpeg', quality: 0.98 },
    html2canvas: { scale: 2 },
    jsPDF: { orientation: 'portrait', unit: 'mm', format: 'a4' },
  }

  html2pdf().set(options).from(htmlContent).save()
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
