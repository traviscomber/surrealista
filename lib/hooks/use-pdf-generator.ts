"use client"

import { useState } from "react"
import { pdfService, type PropertyReportData, type FinancialReportData } from "@/lib/services/pdf-service"

export function usePDFGenerator() {
  const [generating, setGenerating] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  const generatePropertyReport = async (data: PropertyReportData, filename?: string) => {
    try {
      setGenerating(true)
      setError(null)

      const doc = pdfService.generatePropertyReport(data)
      const defaultFilename = `propiedad-${data.property.id}-${new Date().toISOString().split("T")[0]}.pdf`

      pdfService.downloadPDF(doc, filename || defaultFilename)
    } catch (err) {
      setError(err as Error)
      console.error("[v0] Error generating property report:", err)
      throw err
    } finally {
      setGenerating(false)
    }
  }

  const generateFinancialReport = async (data: FinancialReportData, filename?: string) => {
    try {
      setGenerating(true)
      setError(null)

      const doc = pdfService.generateFinancialReport(data)
      const defaultFilename = `reporte-financiero-${new Date().toISOString().split("T")[0]}.pdf`

      pdfService.downloadPDF(doc, filename || defaultFilename)
    } catch (err) {
      setError(err as Error)
      console.error("[v0] Error generating financial report:", err)
      throw err
    } finally {
      setGenerating(false)
    }
  }

  const getPropertyReportBlob = async (data: PropertyReportData): Promise<Blob> => {
    try {
      setGenerating(true)
      setError(null)

      const doc = pdfService.generatePropertyReport(data)
      return pdfService.getPDFBlob(doc)
    } catch (err) {
      setError(err as Error)
      console.error("[v0] Error generating property report blob:", err)
      throw err
    } finally {
      setGenerating(false)
    }
  }

  const getFinancialReportBlob = async (data: FinancialReportData): Promise<Blob> => {
    try {
      setGenerating(true)
      setError(null)

      const doc = pdfService.generateFinancialReport(data)
      return pdfService.getPDFBlob(doc)
    } catch (err) {
      setError(err as Error)
      console.error("[v0] Error generating financial report blob:", err)
      throw err
    } finally {
      setGenerating(false)
    }
  }

  return {
    generating,
    error,
    generatePropertyReport,
    generateFinancialReport,
    getPropertyReportBlob,
    getFinancialReportBlob,
  }
}
