"use client"

import React, { useState } from "react"
import { useChunkedUpload } from "@/hooks/use-chunked-upload"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Upload, CheckCircle, AlertCircle, Loader2 } from "lucide-react"

interface ChunkedFileUploaderProps {
  onSuccess?: (uploadId: string, fileName: string) => void
  onError?: (error: string) => void
  endpoint?: string
  maxFileSize?: number
  acceptedFileTypes?: string
}

export function ChunkedFileUploader({
  onSuccess,
  onError,
  endpoint,
  maxFileSize = 500,
  acceptedFileTypes = "*",
}: ChunkedFileUploaderProps) {
  const { upload, progress, isUploading, error, fileName, uploadId, reset } =
    useChunkedUpload({ endpoint })
  const [isDragging, setIsDragging] = useState(false)
  const fileInputRef = React.useRef<HTMLInputElement>(null)

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    const files = e.dataTransfer.files
    if (files.length > 0) {
      handleFile(files[0])
    }
  }

  const handleFile = async (file: File) => {
    const fileSizeMB = file.size / (1024 * 1024)
    if (fileSizeMB > maxFileSize) {
      const errorMsg = `File too large. Max: ${maxFileSize}MB`
      onError?.(errorMsg)
      return
    }

    const result = await upload(file)
    if (result.success && result.uploadId) {
      onSuccess?.(result.uploadId, file.name)
    }
  }

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.currentTarget.files
    if (files && files.length > 0) {
      handleFile(files[0])
    }
  }

  const handleBrowse = () => {
    fileInputRef.current?.click()
  }

  if (uploadId) {
    return (
      <Card className="w-full">
        <CardContent className="pt-6 flex flex-col items-center justify-center py-8">
          <CheckCircle className="h-12 w-12 text-green-600 mb-4" />
          <p className="text-lg font-semibold mb-2">Upload successful!</p>
          <p className="text-sm text-gray-600 mb-4">{fileName}</p>
          <Badge variant="outline" className="mb-4">
            {uploadId.substring(0, 8)}...
          </Badge>
          <Button onClick={reset} variant="outline">
            Upload another
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>File Upload</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
            isDragging
              ? "border-blue-500 bg-blue-50"
              : "border-gray-300 bg-gray-50"
          }`}
        >
          <Upload className="h-12 w-12 mx-auto mb-2 text-gray-400" />
          <p className="text-sm font-medium mb-1">
            Drag and drop your file here
          </p>
          <p className="text-xs text-gray-600 mb-4">or click below</p>
          <p className="text-xs text-gray-500">
            Max: {maxFileSize}MB
          </p>
        </div>

        <Button
          onClick={handleBrowse}
          disabled={isUploading}
          className="w-full"
        >
          {isUploading ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Uploading...
            </>
          ) : (
            <>
              <Upload className="h-4 w-4 mr-2" />
              Browse Files
            </>
          )}
        </Button>

        <input
          ref={fileInputRef}
          type="file"
          onChange={handleFileInput}
          accept={acceptedFileTypes}
          disabled={isUploading}
          className="hidden"
        />

        {isUploading && (
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">{fileName}</span>
              <span className="font-medium">{progress}%</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>
        )}

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  )
}
