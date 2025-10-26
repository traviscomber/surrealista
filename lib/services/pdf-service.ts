import { jsPDF } from "jspdf"
import autoTable from "jspdf-autotable"

export interface PropertyReportData {
  property: {
    id: string
    title: string
    address: string
    city: string
    price: number
    surface: number
    rooms: number
    bathrooms: number
    status: string
    type: string
  }
  agent?: {
    name: string
    email: string
    phone?: string
  }
  visits?: Array<{
    date: string
    visitor_name: string
    notes?: string
  }>
  documents?: Array<{
    name: string
    type: string
    uploaded_at: string
  }>
  analytics?: {
    total_views: number
    total_visits: number
    avg_time_on_page: number
    conversion_rate: number
  }
}

export interface FinancialReportData {
  period: {
    start: string
    end: string
  }
  summary: {
    total_sales: number
    total_commissions: number
    total_expenses: number
    net_profit: number
  }
  transactions: Array<{
    date: string
    property: string
    amount: number
    commission: number
    agent: string
  }>
  expenses: Array<{
    date: string
    category: string
    description: string
    amount: number
  }>
}

export class PDFService {
  private formatCurrency(amount: number): string {
    return new Intl.NumberFormat("es-ES", {
      style: "currency",
      currency: "EUR",
    }).format(amount)
  }

  private formatDate(date: string): string {
    return new Date(date).toLocaleDateString("es-ES", {
      year: "numeric",
      month: "long",
      day: "numeric",
    })
  }

  private addHeader(doc: jsPDF, title: string) {
    doc.setFontSize(20)
    doc.setTextColor(30, 58, 138) // blue-900
    doc.text(title, 20, 20)

    doc.setFontSize(10)
    doc.setTextColor(100, 116, 139) // slate-500
    doc.text(`Generado el ${this.formatDate(new Date().toISOString())}`, 20, 28)

    doc.setDrawColor(226, 232, 240) // slate-200
    doc.line(20, 32, 190, 32)
  }

  private addFooter(doc: jsPDF, pageNumber: number) {
    const pageHeight = doc.internal.pageSize.height
    doc.setFontSize(8)
    doc.setTextColor(148, 163, 184) // slate-400
    doc.text(`Página ${pageNumber}`, 105, pageHeight - 10, { align: "center" })
    doc.text("Sur-Realista - Sistema de Gestión Inmobiliaria", 105, pageHeight - 6, { align: "center" })
  }

  generatePropertyReport(data: PropertyReportData): jsPDF {
    const doc = new jsPDF()
    let yPos = 40

    this.addHeader(doc, "Reporte de Propiedad")

    // Property Information
    doc.setFontSize(14)
    doc.setTextColor(30, 58, 138)
    doc.text("Información de la Propiedad", 20, yPos)
    yPos += 8

    doc.setFontSize(10)
    doc.setTextColor(51, 65, 85) // slate-700

    const propertyInfo = [
      ["Título", data.property.title],
      ["Dirección", data.property.address],
      ["Ciudad", data.property.city],
      ["Precio", this.formatCurrency(data.property.price)],
      ["Superficie", `${data.property.surface} m²`],
      ["Habitaciones", data.property.rooms.toString()],
      ["Baños", data.property.bathrooms.toString()],
      ["Estado", data.property.status],
      ["Tipo", data.property.type],
    ]

    autoTable(doc, {
      startY: yPos,
      head: [],
      body: propertyInfo,
      theme: "plain",
      styles: { fontSize: 10, cellPadding: 3 },
      columnStyles: {
        0: { fontStyle: "bold", cellWidth: 40 },
        1: { cellWidth: 130 },
      },
    })

    yPos = (doc as any).lastAutoTable.finalY + 10

    // Agent Information
    if (data.agent) {
      doc.setFontSize(14)
      doc.setTextColor(30, 58, 138)
      doc.text("Agente Asignado", 20, yPos)
      yPos += 8

      const agentInfo = [
        ["Nombre", data.agent.name],
        ["Email", data.agent.email],
        ["Teléfono", data.agent.phone || "N/A"],
      ]

      autoTable(doc, {
        startY: yPos,
        head: [],
        body: agentInfo,
        theme: "plain",
        styles: { fontSize: 10, cellPadding: 3 },
        columnStyles: {
          0: { fontStyle: "bold", cellWidth: 40 },
          1: { cellWidth: 130 },
        },
      })

      yPos = (doc as any).lastAutoTable.finalY + 10
    }

    // Analytics
    if (data.analytics) {
      doc.setFontSize(14)
      doc.setTextColor(30, 58, 138)
      doc.text("Estadísticas", 20, yPos)
      yPos += 8

      const analyticsInfo = [
        ["Vistas Totales", data.analytics.total_views.toString()],
        ["Visitas Totales", data.analytics.total_visits.toString()],
        ["Tiempo Promedio", `${data.analytics.avg_time_on_page} min`],
        ["Tasa de Conversión", `${data.analytics.conversion_rate}%`],
      ]

      autoTable(doc, {
        startY: yPos,
        head: [],
        body: analyticsInfo,
        theme: "plain",
        styles: { fontSize: 10, cellPadding: 3 },
        columnStyles: {
          0: { fontStyle: "bold", cellWidth: 40 },
          1: { cellWidth: 130 },
        },
      })

      yPos = (doc as any).lastAutoTable.finalY + 10
    }

    // Visits
    if (data.visits && data.visits.length > 0) {
      if (yPos > 240) {
        doc.addPage()
        yPos = 20
      }

      doc.setFontSize(14)
      doc.setTextColor(30, 58, 138)
      doc.text("Historial de Visitas", 20, yPos)
      yPos += 8

      const visitsData = data.visits.map((visit) => [
        this.formatDate(visit.date),
        visit.visitor_name,
        visit.notes || "Sin notas",
      ])

      autoTable(doc, {
        startY: yPos,
        head: [["Fecha", "Visitante", "Notas"]],
        body: visitsData,
        theme: "striped",
        headStyles: { fillColor: [30, 58, 138], textColor: 255 },
        styles: { fontSize: 9, cellPadding: 4 },
      })

      yPos = (doc as any).lastAutoTable.finalY + 10
    }

    // Documents
    if (data.documents && data.documents.length > 0) {
      if (yPos > 240) {
        doc.addPage()
        yPos = 20
      }

      doc.setFontSize(14)
      doc.setTextColor(30, 58, 138)
      doc.text("Documentos", 20, yPos)
      yPos += 8

      const documentsData = data.documents.map((doc) => [doc.name, doc.type, this.formatDate(doc.uploaded_at)])

      autoTable(doc, {
        startY: yPos,
        head: [["Nombre", "Tipo", "Fecha de Subida"]],
        body: documentsData,
        theme: "striped",
        headStyles: { fillColor: [30, 58, 138], textColor: 255 },
        styles: { fontSize: 9, cellPadding: 4 },
      })
    }

    this.addFooter(doc, 1)

    return doc
  }

  generateFinancialReport(data: FinancialReportData): jsPDF {
    const doc = new jsPDF()
    let yPos = 40

    this.addHeader(doc, "Reporte Financiero")

    // Period
    doc.setFontSize(12)
    doc.setTextColor(71, 85, 105) // slate-600
    doc.text(`Período: ${this.formatDate(data.period.start)} - ${this.formatDate(data.period.end)}`, 20, yPos)
    yPos += 12

    // Summary
    doc.setFontSize(14)
    doc.setTextColor(30, 58, 138)
    doc.text("Resumen Financiero", 20, yPos)
    yPos += 8

    const summaryData = [
      ["Ventas Totales", this.formatCurrency(data.summary.total_sales)],
      ["Comisiones Totales", this.formatCurrency(data.summary.total_commissions)],
      ["Gastos Totales", this.formatCurrency(data.summary.total_expenses)],
      ["Beneficio Neto", this.formatCurrency(data.summary.net_profit)],
    ]

    autoTable(doc, {
      startY: yPos,
      head: [],
      body: summaryData,
      theme: "plain",
      styles: { fontSize: 11, cellPadding: 4 },
      columnStyles: {
        0: { fontStyle: "bold", cellWidth: 60 },
        1: { cellWidth: 110, halign: "right", fontStyle: "bold" },
      },
    })

    yPos = (doc as any).lastAutoTable.finalY + 15

    // Transactions
    if (data.transactions.length > 0) {
      if (yPos > 200) {
        doc.addPage()
        yPos = 20
      }

      doc.setFontSize(14)
      doc.setTextColor(30, 58, 138)
      doc.text("Transacciones", 20, yPos)
      yPos += 8

      const transactionsData = data.transactions.map((t) => [
        this.formatDate(t.date),
        t.property,
        this.formatCurrency(t.amount),
        this.formatCurrency(t.commission),
        t.agent,
      ])

      autoTable(doc, {
        startY: yPos,
        head: [["Fecha", "Propiedad", "Monto", "Comisión", "Agente"]],
        body: transactionsData,
        theme: "striped",
        headStyles: { fillColor: [30, 58, 138], textColor: 255 },
        styles: { fontSize: 8, cellPadding: 3 },
        columnStyles: {
          2: { halign: "right" },
          3: { halign: "right" },
        },
      })

      yPos = (doc as any).lastAutoTable.finalY + 15
    }

    // Expenses
    if (data.expenses.length > 0) {
      if (yPos > 200) {
        doc.addPage()
        yPos = 20
      }

      doc.setFontSize(14)
      doc.setTextColor(30, 58, 138)
      doc.text("Gastos", 20, yPos)
      yPos += 8

      const expensesData = data.expenses.map((e) => [
        this.formatDate(e.date),
        e.category,
        e.description,
        this.formatCurrency(e.amount),
      ])

      autoTable(doc, {
        startY: yPos,
        head: [["Fecha", "Categoría", "Descripción", "Monto"]],
        body: expensesData,
        theme: "striped",
        headStyles: { fillColor: [30, 58, 138], textColor: 255 },
        styles: { fontSize: 8, cellPadding: 3 },
        columnStyles: {
          3: { halign: "right" },
        },
      })
    }

    this.addFooter(doc, 1)

    return doc
  }

  downloadPDF(doc: jsPDF, filename: string) {
    doc.save(filename)
  }

  getPDFBlob(doc: jsPDF): Blob {
    return doc.output("blob")
  }

  getPDFDataUri(doc: jsPDF): string {
    return doc.output("datauristring")
  }
}

export const pdfService = new PDFService()
