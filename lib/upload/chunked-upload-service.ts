/**
 * Chunked Upload Service
 * Maneja carga de archivos grandes dividiéndolos en chunks
 * Ideal para archivos > 10MB
 */

export interface ChunkConfig {
  chunkSize: number
  maxRetries: number
  onProgress?: (progress: number) => void
  onChunkComplete?: (chunkIndex: number, total: number) => void
}

export interface UploadSession {
  sessionId: string
  fileName: string
  fileSize: number
  totalChunks: number
  uploadedChunks: Set<number>
}

const DEFAULT_CHUNK_SIZE = 5 * 1024 * 1024 // 5MB

export class ChunkedUploadService {
  private sessions: Map<string, UploadSession> = new Map()

  initSession(file: File): UploadSession {
    const sessionId = this.generateSessionId()
    const totalChunks = Math.ceil(file.size / DEFAULT_CHUNK_SIZE)

    const session: UploadSession = {
      sessionId,
      fileName: file.name,
      fileSize: file.size,
      totalChunks,
      uploadedChunks: new Set(),
    }

    this.sessions.set(sessionId, session)
    return session
  }

  getChunks(file: File, chunkSize: number = DEFAULT_CHUNK_SIZE): Blob[] {
    const chunks: Blob[] = []
    let offset = 0

    while (offset < file.size) {
      const chunkBlob = file.slice(offset, offset + chunkSize)
      chunks.push(chunkBlob)
      offset += chunkSize
    }

    return chunks
  }

  async uploadInChunks(
    file: File,
    uploadEndpoint: string,
    config: Partial<ChunkConfig> = {}
  ): Promise<{ success: boolean; uploadId?: string }> {
    const session = this.initSession(file)
    const chunkSize = config.chunkSize || DEFAULT_CHUNK_SIZE
    const maxRetries = config.maxRetries || 3
    const chunks = this.getChunks(file, chunkSize)

    try {
      const initResponse = await fetch(`${uploadEndpoint}/init`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fileName: file.name,
          fileSize: file.size,
          mimeType: file.type,
          totalChunks: chunks.length,
        }),
      })

      if (!initResponse.ok) {
        throw new Error(`Failed to init upload session`)
      }

      const { uploadId } = await initResponse.json()

      for (let i = 0; i < chunks.length; i++) {
        let retries = 0

        while (retries < maxRetries) {
          try {
            const formData = new FormData()
            formData.append("uploadId", uploadId)
            formData.append("chunkIndex", i.toString())
            formData.append("totalChunks", chunks.length.toString())
            formData.append("chunk", chunks[i], `chunk-${i}`)

            const chunkResponse = await fetch(`${uploadEndpoint}/chunk`, {
              method: "POST",
              body: formData,
            })

            if (!chunkResponse.ok) {
              throw new Error(`Chunk ${i} failed`)
            }

            session.uploadedChunks.add(i)
            const progress = (session.uploadedChunks.size / chunks.length) * 100
            config.onProgress?.(Math.round(progress))
            config.onChunkComplete?.(i + 1, chunks.length)

            break
          } catch (error) {
            retries++
            if (retries >= maxRetries) {
              throw new Error(`Chunk ${i} failed after ${maxRetries} retries`)
            }
            await new Promise((resolve) => setTimeout(resolve, 1000 * retries))
          }
        }
      }

      const finalizeResponse = await fetch(`${uploadEndpoint}/finalize`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          uploadId,
          fileName: file.name,
          fileSize: file.size,
        }),
      })

      if (!finalizeResponse.ok) {
        throw new Error(`Failed to finalize upload`)
      }

      const result = await finalizeResponse.json()
      this.sessions.delete(session.sessionId)
      config.onProgress?.(100)

      return { success: true, uploadId: result.fileId }
    } catch (error) {
      console.error("[v0] Chunked upload failed:", error)
      this.sessions.delete(session.sessionId)
      return { success: false }
    }
  }

  getProgress(sessionId: string): number {
    const session = this.sessions.get(sessionId)
    if (!session) return 0
    return (session.uploadedChunks.size / session.totalChunks) * 100
  }

  cancelSession(sessionId: string): void {
    this.sessions.delete(sessionId)
  }

  private generateSessionId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  }
}

export const chunkedUploadService = new ChunkedUploadService()
