import { createBrowserClient } from "@/lib/supabase/client"

export interface KMZDocumentLink {
  documentId: string
  documentTitle: string
  documentType: string
  fileUrl: string
  category: string
  tags: string[]
  createdAt: string
}

type PropertyDocumentRow = {
  id: string
  title: string
  document_type: string
  file_url: string
  category: string
  tags: string[]
  created_at: string
  linked_kmz_ids: string[]
}

function asRecord(value: unknown): Record<string, unknown> | null {
  return value !== null && typeof value === "object" ? (value as Record<string, unknown>) : null
}

function stringValue(value: unknown, fallback = "") {
  return typeof value === "string" ? value : fallback
}

function stringArray(value: unknown) {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : []
}

function normalizePropertyDocument(value: unknown): PropertyDocumentRow | null {
  const row = asRecord(value)
  if (!row) return null
  const id = stringValue(row.id)
  if (!id) return null

  return {
    id,
    title: stringValue(row.title, "Sin título"),
    document_type: stringValue(row.document_type, "Otro"),
    file_url: stringValue(row.file_url),
    category: stringValue(row.category, "general"),
    tags: stringArray(row.tags),
    created_at: stringValue(row.created_at),
    linked_kmz_ids: stringArray(row.linked_kmz_ids),
  }
}

export class DocumentKMZLinker {
  private supabase = createBrowserClient()

  private extractCampoName(fileName: string): string {
    return fileName.replace(/\.kmz$/i, "").replace(/\.kml$/i, "").trim().toLowerCase()
  }

  async getDocumentsForKMZ(kmzId: string, kmzFileName?: string): Promise<KMZDocumentLink[]> {
    try {
      const { data: dataById, error: errorById } = await this.supabase
        .from("property_documents")
        .select("*")
        .contains("linked_kmz_ids", [kmzId])
        .order("created_at", { ascending: false })

      if (errorById) throw errorById

      let results = (dataById || [])
        .map(normalizePropertyDocument)
        .filter((document): document is PropertyDocumentRow => document !== null)

      if (kmzFileName) {
        const campoName = this.extractCampoName(kmzFileName)
        const { data: dataByName, error: errorByName } = await this.supabase
          .from("property_documents")
          .select("*")
          .ilike("title", `%${campoName}%`)
          .order("created_at", { ascending: false })

        if (!errorByName && dataByName) {
          const existingIds = new Set(results.map((document) => document.id))
          const newDocs = dataByName
            .map(normalizePropertyDocument)
            .filter((document): document is PropertyDocumentRow => document !== null && !existingIds.has(document.id))
          results = [...results, ...newDocs]
        }
      }

      return results.map((document) => ({
        documentId: document.id,
        documentTitle: document.title,
        documentType: document.document_type,
        fileUrl: document.file_url,
        category: document.category,
        tags: document.tags,
        createdAt: document.created_at,
      }))
    } catch (error) {
      console.error("[v0] Error getting documents for KMZ:", error)
      return []
    }
  }

  async getDocumentCountForKMZ(kmzId: string, kmzFileName?: string): Promise<number> {
    return (await this.getDocumentsForKMZ(kmzId, kmzFileName)).length
  }

  getDocumentFolderPath(kmzFileName: string): string {
    const cleanName = kmzFileName
      .replace(/\.kmz$/i, "")
      .replace(/\.kml$/i, "")
      .replace(/[^a-zA-Z0-9\s\-_]/g, "")
      .replace(/\s+/g, "_")
      .toLowerCase()

    return `/documentacion/campos/${cleanName}`
  }

  async linkDocumentToKMZ(documentId: string, kmzId: string): Promise<boolean> {
    try {
      const { data, error: fetchError } = await this.supabase
        .from("property_documents")
        .select("linked_kmz_ids")
        .eq("id", documentId)
        .single()

      if (fetchError) throw fetchError

      const row = asRecord(data)
      const currentKmzIds = stringArray(row?.linked_kmz_ids)
      if (currentKmzIds.includes(kmzId)) return true

      const { error: updateError } = await this.supabase
        .from("property_documents")
        .update({ linked_kmz_ids: [...currentKmzIds, kmzId] })
        .eq("id", documentId)

      if (updateError) throw updateError
      return true
    } catch (error) {
      console.error("[v0] Error linking document to KMZ:", error)
      return false
    }
  }
}

export const documentKMZLinker = new DocumentKMZLinker()
