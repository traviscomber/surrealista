"use client"

import { useState, useCallback } from "react"
import { chunkedUploadService } from "@/lib/upload/chunked-upload-service"

export interface UseChunkedUploadOptions {
  endpoint?: string
  chunkSize?: number
  maxRetries?: number
}

export function useChunkedUpload(options: UseChunkedUploadOptions = {}) {
  const endpoint = options.endpoint || "/api/upload"
  const [progress, setProgress] = useState(0)
  const [isUploading, setIsUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [fileName, setFileName] = useState<string | null>(null)
  const [uploadId, setUploadId] = useState<string | null>(null)

  const upload = useCallback(
    async (file: File) => {
      setIsUploading(true)
      setError(null)
      setProgress(0)
      setFileName(file.name)

      try {
        const result = await chunkedUploadService.uploadInChunks(
          file,
          endpoint,
          {
            chunkSize: options.chunkSize,
            maxRetries: options.maxRetries,
            onProgress: setProgress,
            onChunkComplete: () => {
              // Log optional
            },
          }
        )

        if (result.success && result.uploadId) {
          setUploadId(result.uploadId)
          setProgress(100)
          return { success: true, uploadId: result.uploadId }
        } else {
          throw new Error("Upload failed")
        }
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "Upload failed"
        setError(errorMessage)
        return { success: false }
      } finally {
        setIsUploading(false)
      }
    },
    [endpoint, options.chunkSize, options.maxRetries]
  )

  const reset = useCallback(() => {
    setProgress(0)
    setIsUploading(false)
    setError(null)
    setFileName(null)
    setUploadId(null)
  }, [])

  return {
    upload,
    progress,
    isUploading,
    error,
    fileName,
    uploadId,
    reset,
  }
}
