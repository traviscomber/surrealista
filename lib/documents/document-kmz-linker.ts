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

export class DocumentKMZLinker {
  private supabase = createBrowserClient()

  private extractCampoName(fileName: string): string {
    return fileName
      .replace(/\.kmz$/i, "")
      .replace(/\.kml$/i, "")
      .trim()
      .toLowerCase()
  }

  /**
   * Get all documents linked to a specific KMZ file
   * Searches by both linked_kmz_ids AND document title matching campo name
   */
  async getDocumentsForKMZ(kmzId: string, kmzFileName?: string): Promise<KMZDocumentLink[]> {
    try {
      // Only select columns that exist in property_documents table
      const query = this.supabase
        .from("property_documents")
        .select("id, title, file_url, file_type, file_size, category, tags, created_at, linked_kmz_ids")
        .order("created_at", { ascending: false })

      // Search by linked KMZ IDs
      const { data: dataById, error: errorById } = await query.contains("linked_kmz_ids", [kmzId])

      if (errorById) throw errorById

      let results = dataById || []

      if (kmzFileName) {
        const campoName = this.extractCampoName(kmzFileName)
        const { data: dataByName, error: errorByName } = await this.supabase
          .from("property_documents")
          .select("id, title, file_url, file_type, file_size, category, tags, created_at, linked_kmz_ids")
          .ilike("title", `%${campoName}%`)
          .order("created_at", { ascending: false })

        if (!errorByName && dataByName) {
          // Merge results, avoiding duplicates
          const existingIds = new Set(results.map((r) => r.id))
          const newDocs = dataByName.filter((doc) => !existingIds.has(doc.id))
          results = [...results, ...newDocs]
        }
      }

      return results.map((doc) => ({
        documentId: doc.id,
        documentTitle: doc.title || "Sin título",
        documentType: doc.file_type || "Otro",
        fileUrl: doc.file_url || "",
        category: doc.category || "general",
        tags: doc.tags || [],
        createdAt: doc.created_at,
      }))
    } catch (error) {
      console.error("[v0] Error getting documents for KMZ:", error)
      return []
    }
  }

  /**
   * Get document count for a KMZ file
   */
  async getDocumentCountForKMZ(kmzId: string, kmzFileName?: string): Promise<number> {
    try {
      const docs = await this.getDocumentsForKMZ(kmzId, kmzFileName)
      return docs.length
    } catch (error) {
      console.error("[v0] Error getting document count for KMZ:", error)
      return 0
    }
  }

  /**
   * Get the document folder path for a KMZ (campo)
   * Format: /documentacion/campos/{campo_name}
   */
  getDocumentFolderPath(kmzFileName: string): string {
    // Clean the KMZ filename to create a folder-friendly name
    const cleanName = kmzFileName
      .replace(/\.kmz$/i, "")
      .replace(/\.kml$/i, "")
      .replace(/[^a-zA-Z0-9\s\-_]/g, "")
      .replace(/\s+/g, "_")
      .toLowerCase()

    return `/documentacion/campos/${cleanName}`
  }

  /**
   * Link a document to a KMZ file
   */
  async linkDocumentToKMZ(documentId: string, kmzId: string): Promise<boolean> {
    try {
      // Get current linked KMZ IDs
      const { data: doc, error: fetchError } = await this.supabase
        .from("property_documents")
        .select("linked_kmz_ids")
        .eq("id", documentId)
        .single()

      if (fetchError) throw fetchError

      const currentKmzIds = doc?.linked_kmz_ids || []
      if (currentKmzIds.includes(kmzId)) {
        console.log("[v0] Document already linked to KMZ")
        return true
      }

      // Add new KMZ ID
      const { error: updateError } = await this.supabase
        .from("property_documents")
        .update({ linked_kmz_ids: [...currentKmzIds, kmzId] })
        .eq("id", documentId)

      if (updateError) throw updateError

      console.log("[v0] Document linked to KMZ successfully")
      return true
    } catch (error) {
      console.error("[v0] Error linking document to KMZ:", error)
      return false
    }
  }
}

export const documentKMZLinker = new DocumentKMZLinker()
