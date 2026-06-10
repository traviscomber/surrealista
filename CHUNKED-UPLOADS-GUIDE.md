# Chunked Uploads Guide

Solución completa para subir archivos grandes sin el error `FUNCTION_PAYLOAD_TOO_LARGE`.

## Problem

Error cuando subes archivo grande:
```
FUNCTION_PAYLOAD_TOO_LARGE
Intenta: Revisar que el archivo sea válido, Comprobar tu conexión, Usar un archivo más pequeño
```

**Causa:** Vercel tiene límite de 50MB en payloads de API.

## Solution

Usar chunked uploads para dividir archivos en pedazos de 5MB y subirlos secuencialmente.

## Componentes

### 1. Service: `lib/upload/chunked-upload-service.ts`
```typescript
import { chunkedUploadService } from "@/lib/upload/chunked-upload-service"

// Uso directo
const result = await chunkedUploadService.uploadInChunks(
  file,
  "/api/upload",
  {
    chunkSize: 5 * 1024 * 1024, // 5MB
    maxRetries: 3,
    onProgress: (percent) => console.log(`${percent}%`),
    onChunkComplete: (chunk, total) => console.log(`${chunk}/${total}`)
  }
)
```

### 2. API Endpoints

#### `/api/upload/init` (POST)
Inicia una sesión de carga
```bash
curl -X POST http://localhost:3000/api/upload/init \
  -H "Content-Type: application/json" \
  -d '{
    "fileName": "document.pdf",
    "fileSize": 104857600,
    "mimeType": "application/pdf",
    "totalChunks": 21
  }'
```

Response:
```json
{
  "uploadId": "uuid-here"
}
```

#### `/api/upload/chunk` (POST)
Sube un chunk individual
```bash
curl -X POST http://localhost:3000/api/upload/chunk \
  -F "uploadId=uuid-here" \
  -F "chunkIndex=0" \
  -F "totalChunks=21" \
  -F "chunk=@chunk-0"
```

#### `/api/upload/finalize` (POST)
Finaliza la subida y ensambla el archivo
```bash
curl -X POST http://localhost:3000/api/upload/finalize \
  -H "Content-Type: application/json" \
  -d '{
    "uploadId": "uuid-here",
    "fileName": "document.pdf",
    "fileSize": 104857600
  }'
```

### 3. Hook: `hooks/use-chunked-upload.ts`
```typescript
import { useChunkedUpload } from "@/hooks/use-chunked-upload"

export function MyComponent() {
  const { upload, progress, isUploading, error, uploadId, reset } = 
    useChunkedUpload({
      endpoint: "/api/upload",
      chunkSize: 5 * 1024 * 1024,
      maxRetries: 3
    })

  const handleUpload = async (file: File) => {
    const result = await upload(file)
    if (result.success) {
      console.log("Upload complete:", result.uploadId)
    }
  }

  return (
    <>
      <input type="file" onChange={(e) => {
        const file = e.target.files?.[0]
        if (file) handleUpload(file)
      }} />
      <p>Progress: {progress}%</p>
      {error && <p>Error: {error}</p>}
    </>
  )
}
```

### 4. Component: `components/upload/chunked-file-uploader.tsx`
Componente plug-and-play con drag & drop

```typescript
import { ChunkedFileUploader } from "@/components/upload/chunked-file-uploader"

export function MyPage() {
  return (
    <ChunkedFileUploader
      endpoint="/api/upload"
      maxFileSize={500} // MB
      acceptedFileTypes=".pdf,.doc,.docx,.xls,.xlsx"
      onSuccess={(uploadId, fileName) => {
        console.log(`Uploaded: ${fileName} (${uploadId})`)
      }}
      onError={(error) => {
        console.error("Upload failed:", error)
      }}
    />
  )
}
```

## Usage Examples

### Ejemplo 1: Simple File Upload (Sin Progress)
```typescript
import { ChunkedFileUploader } from "@/components/upload/chunked-file-uploader"

export function UploadPage() {
  return (
    <ChunkedFileUploader
      onSuccess={(id, name) => alert(`${name} uploaded!`)}
      onError={(error) => alert(`Error: ${error}`)}
    />
  )
}
```

### Ejemplo 2: Con Validaciones Personalizadas
```typescript
const { upload, progress, isUploading, error } = useChunkedUpload()

const handleFileChange = async (file: File) => {
  // Validar tipo
  if (!file.type.startsWith("image/")) {
    alert("Only images allowed")
    return
  }

  // Validar tamaño
  if (file.size > 50 * 1024 * 1024) {
    alert("File too large (max 50MB)")
    return
  }

  // Subir
  const result = await upload(file)
  if (result.success) {
    console.log("Upload ID:", result.uploadId)
  }
}
```

### Ejemplo 3: Integración en Fundo Camarico
```typescript
import { ChunkedFileUploader } from "@/components/upload/chunked-file-uploader"

export function FundoCamaricoPage() {
  const handleUploadSuccess = async (uploadId: string, fileName: string) => {
    // Guardar referencia en DB
    const response = await fetch("/api/fundo-camarico/documents", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        uploadId,
        fileName,
        fundoId: "camarico-123"
      })
    })

    if (response.ok) {
      alert("Document saved!")
    }
  }

  return (
    <div>
      <h1>Fundo Camarico - Upload Documents</h1>
      <ChunkedFileUploader
        endpoint="/api/upload"
        maxFileSize={500}
        acceptedFileTypes=".pdf,.doc,.docx"
        onSuccess={handleUploadSuccess}
        onError={(error) => console.error(error)}
      />
    </div>
  )
}
```

## Features

✅ Divide archivos > 500MB en chunks de 5MB
✅ Reintentos automáticos (3x por defecto)
✅ Progress tracking en tiempo real
✅ Error handling robusto
✅ Drag & drop UI
✅ Reutilizable en cualquier componente
✅ Soporta archivos hasta 500MB
✅ TypeScript completo

## Configuration

### Cambiar tamaño de chunk
```typescript
const { upload } = useChunkedUpload({
  chunkSize: 10 * 1024 * 1024 // 10MB chunks
})
```

### Cambiar endpoint
```typescript
const { upload } = useChunkedUpload({
  endpoint: "/api/custom-upload"
})
```

### Cambiar reintentos
```typescript
const { upload } = useChunkedUpload({
  maxRetries: 5
})
```

## Browser Support

- Chrome 76+
- Firefox 73+
- Safari 13+
- Edge 79+

## Limits

- Máximo por archivo: 500MB
- Tamaño de chunk: 5MB (configurable)
- Reintentos: 3 (configurable)
- Timeout: 30s por chunk

## Troubleshooting

### "FUNCTION_PAYLOAD_TOO_LARGE"
✅ Ya NO ocurre con chunked uploads
Si persiste, usar tamaño de chunk más pequeño:
```typescript
useChunkedUpload({
  chunkSize: 2 * 1024 * 1024 // 2MB
})
```

### "Upload hangs"
- Verificar conexión a internet
- Verificar que `/api/upload/chunk` está respondiendo
- Revisar console para errores específicos

### "Progress stuck at X%"
- Usualmente significa error en chunk específico
- Ver `error` state en hook
- Reintentar upload

## File Structure

```
lib/upload/
├── chunked-upload-service.ts    # Core service

app/api/upload/
├── init/route.ts                # Init session
├── chunk/route.ts               # Upload chunk
└── finalize/route.ts            # Finalize & assemble

components/upload/
└── chunked-file-uploader.tsx    # UI component

hooks/
└── use-chunked-upload.ts        # React hook
```

## Performance

- Archivo 100MB: ~15-30 segundos
- Archivo 500MB: ~60-120 segundos
- (Depende: velocidad internet, tamaño chunk)

---

**Version:** 1.0
**Last Updated:** June 5, 2026
**Status:** Production Ready ✅
