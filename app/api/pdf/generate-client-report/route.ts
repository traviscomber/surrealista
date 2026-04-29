import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function POST(request: NextRequest) {
  try {
    const { clientId, clientData } = await request.json()

    if (!clientId || !clientData) {
      return NextResponse.json(
        { error: 'Missing clientId or clientData' },
        { status: 400 }
      )
    }

    // Generate PDF content as HTML
    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <style>
            body { font-family: Arial, sans-serif; margin: 0; padding: 20px; color: #333; }
            .header { border-bottom: 3px solid #16a34a; margin-bottom: 30px; padding-bottom: 20px; }
            .title { font-size: 28px; font-weight: bold; color: #1a1a1a; margin: 0; }
            .subtitle { font-size: 14px; color: #666; margin: 5px 0 0 0; }
            .section { margin-bottom: 25px; page-break-inside: avoid; }
            .section-title { font-size: 16px; font-weight: bold; color: #16a34a; border-bottom: 2px solid #e5e7eb; padding-bottom: 8px; margin-bottom: 12px; }
            .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; }
            .info-item { }
            .label { font-size: 12px; color: #666; font-weight: bold; text-transform: uppercase; margin-bottom: 3px; }
            .value { font-size: 14px; color: #1a1a1a; }
            .badge { display: inline-block; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: bold; margin-right: 8px; margin-bottom: 5px; }
            .badge-buyer { background: #dbeafe; color: #1e40af; }
            .badge-seller { background: #dcfce7; color: #166534; }
            .badge-hot { background: #fee2e2; color: #991b1b; }
            .table { width: 100%; border-collapse: collapse; }
            .table th { background: #f3f4f6; padding: 8px; text-align: left; font-weight: bold; border: 1px solid #e5e7eb; }
            .table td { padding: 8px; border: 1px solid #e5e7eb; }
            .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; font-size: 12px; color: #666; text-align: center; }
          </style>
        </head>
        <body>
          <div class="header">
            <p class="title">Ficha de Cliente - Reporte Completo</p>
            <p class="subtitle">Generado: ${new Date().toLocaleDateString('es-CL')}</p>
          </div>

          <!-- Cliente Info -->
          <div class="section">
            <div class="section-title">Información del Cliente</div>
            <div class="info-grid">
              <div class="info-item">
                <div class="label">Nombre</div>
                <div class="value">${clientData.first_name} ${clientData.last_name}</div>
              </div>
              <div class="info-item">
                <div class="label">Empresa</div>
                <div class="value">${clientData.company_name || 'N/A'}</div>
              </div>
              <div class="info-item">
                <div class="label">Email</div>
                <div class="value">${clientData.email || 'N/A'}</div>
              </div>
              <div class="info-item">
                <div class="label">Teléfono</div>
                <div class="value">${clientData.phone || clientData.mobile || 'N/A'}</div>
              </div>
              <div class="info-item">
                <div class="label">Ciudad</div>
                <div class="value">${clientData.city || 'N/A'}</div>
              </div>
              <div class="info-item">
                <div class="label">Región</div>
                <div class="value">${clientData.region || 'N/A'}</div>
              </div>
            </div>
            <div style="margin-top: 12px;">
              ${clientData.client_type ? `<span class="badge ${clientData.client_type === 'buyer' ? 'badge-buyer' : 'badge-seller'}">${clientData.client_type === 'buyer' ? 'Comprador' : 'Vendedor'}</span>` : ''}
              ${clientData.status === 'hot' ? '<span class="badge badge-hot">🔥 Hot Lead</span>' : ''}
            </div>
          </div>

          <!-- Budget Info -->
          ${clientData.budget_min ? `
          <div class="section">
            <div class="section-title">Presupuesto</div>
            <div class="info-grid">
              <div class="info-item">
                <div class="label">Presupuesto Mínimo</div>
                <div class="value">UF ${clientData.budget_min?.toLocaleString()}</div>
              </div>
              <div class="info-item">
                <div class="label">Presupuesto Máximo</div>
                <div class="value">UF ${clientData.budget_max?.toLocaleString()}</div>
              </div>
            </div>
          </div>
          ` : ''}

          <!-- Contact History -->
          <div class="section">
            <div class="section-title">Historial de Contacto</div>
            <div class="info-grid">
              <div class="info-item">
                <div class="label">Fecha de Creación</div>
                <div class="value">${clientData.created_at ? new Date(clientData.created_at).toLocaleDateString('es-CL') : 'N/A'}</div>
              </div>
              <div class="info-item">
                <div class="label">Último Contacto</div>
                <div class="value">${clientData.last_contact_date ? new Date(clientData.last_contact_date).toLocaleDateString('es-CL') : 'Sin contacto'}</div>
              </div>
            </div>
          </div>

          <!-- Notes -->
          ${clientData.notes ? `
          <div class="section">
            <div class="section-title">Notas</div>
            <div class="value" style="line-height: 1.6; white-space: pre-wrap;">${clientData.notes}</div>
          </div>
          ` : ''}

          <div class="footer">
            <p>Documento generado automáticamente por Sur-Realista CRM</p>
            <p>© ${new Date().getFullYear()} - Todos los derechos reservados</p>
          </div>
        </body>
      </html>
    `

    // Return HTML as downloadable content
    return new NextResponse(htmlContent, {
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Content-Disposition': `attachment; filename="cliente_${clientData.first_name}_${clientData.last_name}_${Date.now()}.html"`,
      },
    })
  } catch (error) {
    console.error('Error generating PDF:', error)
    return NextResponse.json(
      { error: 'Error generating PDF report' },
      { status: 500 }
    )
  }
}
