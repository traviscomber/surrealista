"use client"

import { useCallback, useState } from "react"
import { useDropzone } from "react-dropzone"
import { Card, CardContent } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Upload, FileText, ImageIcon, Video, MapPin, CheckCircle, AlertCircle } from "lucide-react"

interface FileUploadZoneProps {
  onFilesProcessed: (results: any[]) => void
}

export function FileUploadZone({ onFilesProcessed }: FileUploadZoneProps) {
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [results, setResults] = useState<any[]>([])

  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      setUploading(true)
      setProgress(0)
      setResults([])

      const processedResults = []

      for (let i = 0; i < acceptedFiles.length; i++) {
        const file = acceptedFiles[i]
        setProgress((i / acceptedFiles.length) * 100)

        try {
          const formData = new FormData()
          formData.append("file", file)

          const response = await fetch("/api/v1/documents/classify", {
            method: "POST",
            body: formData,
          })

          const result = await response.json()
          processedResults.push({
            file: file.name,
            success: result.success,
            classification: result.classification,
            error: result.error,
          })
        } catch (error) {
          processedResults.push({
            file: file.name,
            success: false,
            error: "Error processing file",
          })
        }
      }

      setProgress(100)
      setResults(processedResults)
      setUploading(false)
      onFilesProcessed(processedResults)
    },
    [onFilesProcessed],
  )

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "application/pdf": [".pdf"],
      "image/*": [".jpg", ".jpeg", ".png", ".heic"],
      "video/*": [".mp4", ".mov", ".avi"],
      "application/vnd.google-earth.kmz": [".kmz"],
      "application/vnd.google-earth.kml+xml": [".kml"],
    },
    multiple: true,
  })

  const getFileIcon = (fileName: string) => {
    const ext = fileName.toLowerCase().split(".").pop()
    switch (ext) {
      case "pdf":
      case "doc":
      case "docx":
        return <FileText className="h-4 w-4" />
      case "jpg":
      case "jpeg":
      case "png":
      case "heic":
        return <ImageIcon className="h-4 w-4" />
      case "mp4":
      case "mov":
      case "avi":
        return <Video className="h-4 w-4" />
      case "kmz":
      case "kml":
        return <MapPin className="h-4 w-4" />
      default:
        return <FileText className="h-4 w-4" />
    }
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="p-6">
          <div
            {...getRootProps()}
            className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
              isDragActive ? "border-blue-500 bg-blue-50" : "border-gray-300 hover:border-gray-400"
            }`}
          >
            <input {...getInputProps()} />
            <Upload className="h-12 w-12 mx-auto mb-4 text-gray-400" />
            {isDragActive ? (
              <p className="text-blue-600">Suelta los archivos aquí...</p>
            ) : (
              <div>
                <p className="text-lg font-medium mb-2">Arrastra archivos aquí o haz clic para seleccionar</p>
                <p className="text-sm text-gray-500">Soporta: PDF, Imágenes, Videos, KMZ/KML</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {uploading && (
        <Card>
          <CardContent className="p-4">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Procesando archivos...</span>
                <span>{Math.round(progress)}%</span>
              </div>
              <Progress value={progress} />
            </div>
          </CardContent>
        </Card>
      )}

      {results.length > 0 && (
        <Card>
          <CardContent className="p-4">
            <h4 className="font-medium mb-3">Resultados del procesamiento:</h4>
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {results.map((result, index) => (
                <div key={index} className="flex items-center gap-3 text-sm">
                  {getFileIcon(result.file)}
                  <span className="flex-1">{result.file}</span>
                  {result.success ? (
                    <div className="flex items-center gap-2 text-green-600">
                      <CheckCircle className="h-4 w-4" />
                      <span>{result.classification?.folder}</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 text-red-600">
                      <AlertCircle className="h-4 w-4" />
                      <span>Error</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
