export interface DriveFile {
  id: string
  name: string
  mimeType: string
  size?: string
  modifiedTime: string
  webViewLink?: string
  parents?: string[]
  thumbnailLink?: string
}

export interface DriveFolder {
  id: string
  name: string
  files: DriveFile[]
  subfolders: DriveFolder[]
  totalFiles: number
}

export class GoogleDriveService {
  private _apiKey: string
  private baseUrl = "https://www.googleapis.com/drive/v3"
  private maxRetries = 3
  private retryDelay = 1000
  private cache: Map<string, { data: any; timestamp: number }> = new Map()
  private cacheTimeout = 5 * 60 * 1000 // 5 minutes

  constructor(apiKey: string) {
    this._apiKey = apiKey
  }

  private async fetchWithRetry(url: string, options: RequestInit = {}, retries = this.maxRetries): Promise<Response> {
    try {
      console.log("[v0] Fetching:", url)
      const response = await fetch(url, {
        ...options,
        signal: AbortSignal.timeout(30000), // 30 second timeout
      })

      if (!response.ok) {
        if (response.status === 429 && retries > 0) {
          // Rate limit - wait and retry
          console.log("[v0] Rate limited, retrying in", this.retryDelay * 2, "ms")
          await new Promise((resolve) => setTimeout(resolve, this.retryDelay * 2))
          return this.fetchWithRetry(url, options, retries - 1)
        }

        if (response.status >= 500 && retries > 0) {
          // Server error - retry
          console.log("[v0] Server error, retrying in", this.retryDelay, "ms")
          await new Promise((resolve) => setTimeout(resolve, this.retryDelay))
          return this.fetchWithRetry(url, options, retries - 1)
        }

        throw new Error(`API error: ${response.status} ${response.statusText}`)
      }

      return response
    } catch (error) {
      if (retries > 0 && (error instanceof TypeError || error.name === "AbortError")) {
        // Network error or timeout - retry
        console.log("[v0] Network error, retrying in", this.retryDelay, "ms", error)
        await new Promise((resolve) => setTimeout(resolve, this.retryDelay))
        return this.fetchWithRetry(url, options, retries - 1)
      }
      throw error
    }
  }

  private getCached(key: string): any | null {
    const cached = this.cache.get(key)
    if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
      console.log("[v0] Using cached data for:", key)
      return cached.data
    }
    return null
  }

  private setCache(key: string, data: any): void {
    this.cache.set(key, { data, timestamp: Date.now() })
  }

  private clearCache(): void {
    this.cache.clear()
  }

  get apiKey() {
    return this._apiKey
  }

  async listFiles(
    folderId?: string,
    pageToken?: string,
  ): Promise<{
    files: DriveFile[]
    nextPageToken?: string
  }> {
    const cacheKey = `listFiles_${folderId}_${pageToken}`
    const cached = this.getCached(cacheKey)
    if (cached) return cached

    try {
      const params = new URLSearchParams({
        key: this._apiKey,
        fields: "nextPageToken,files(id,name,mimeType,size,modifiedTime,webViewLink,parents,thumbnailLink)",
        pageSize: "100",
      })

      if (folderId) {
        params.append("q", `'${folderId}' in parents and trashed=false`)
      } else {
        params.append("q", "trashed=false")
      }

      if (pageToken) {
        params.append("pageToken", pageToken)
      }

      const response = await this.fetchWithRetry(`${this.baseUrl}/files?${params}`)
      const data = await response.json()

      const result = {
        files: data.files || [],
        nextPageToken: data.nextPageToken,
      }

      this.setCache(cacheKey, result)
      return result
    } catch (error) {
      console.error("[v0] Error listing files:", error)
      throw error
    }
  }

  async getFolderStructure(folderId: string): Promise<DriveFolder> {
    const cacheKey = `folderStructure_${folderId}`
    const cached = this.getCached(cacheKey)
    if (cached) return cached

    try {
      console.log("[v0] Getting folder structure for:", folderId)

      // Get folder info
      const folderResponse = await this.fetchWithRetry(
        `${this.baseUrl}/files/${folderId}?key=${this._apiKey}&fields=id,name`,
      )
      const folderInfo = await folderResponse.json()

      console.log("[v0] Folder name from Drive:", folderInfo.name)

      // Get folder contents
      const { files } = await this.listFiles(folderId)

      console.log(
        "[v0] Files in folder:",
        files.map((f) => f.name),
      )

      // Separate files and folders
      const regularFiles = files.filter((file) => file.mimeType !== "application/vnd.google-apps.folder")
      const subfolderFiles = files.filter((file) => file.mimeType === "application/vnd.google-apps.folder")

      // Recursively get subfolders with error handling
      const subfolders: DriveFolder[] = []
      for (const subfolder of subfolderFiles) {
        try {
          const subfolderStructure = await this.getFolderStructure(subfolder.id)
          subfolders.push(subfolderStructure)
        } catch (error) {
          console.error(`[v0] Error getting subfolder ${subfolder.name}:`, error)
          // Continue with other subfolders even if one fails
        }
      }

      const result = {
        id: folderInfo.id,
        name: folderInfo.name, // Using exact name from Drive, no modifications
        files: regularFiles,
        subfolders,
        totalFiles: regularFiles.length + subfolders.reduce((sum, sf) => sum + sf.totalFiles, 0),
      }

      this.setCache(cacheKey, result)
      return result
    } catch (error) {
      console.error("[v0] Error getting folder structure:", error)
      throw error
    }
  }

  async searchFiles(query: string): Promise<DriveFile[]> {
    try {
      const params = new URLSearchParams({
        key: this._apiKey,
        q: `name contains '${query}' and trashed=false`,
        fields: "files(id,name,mimeType,size,modifiedTime,webViewLink,parents,thumbnailLink)",
        pageSize: "50",
      })

      const response = await this.fetchWithRetry(`${this.baseUrl}/files?${params}`)

      if (!response.ok) {
        throw new Error(`Google Drive API error: ${response.status}`)
      }

      const data = await response.json()
      return data.files || []
    } catch (error) {
      console.error("Error searching files:", error)
      throw error
    }
  }

  async getFileContent(fileId: string): Promise<string> {
    try {
      const response = await this.fetchWithRetry(`${this.baseUrl}/files/${fileId}?alt=media&key=${this._apiKey}`)

      if (!response.ok) {
        throw new Error(`Error getting file content: ${response.status}`)
      }

      return await response.text()
    } catch (error) {
      console.error("Error getting file content:", error)
      throw error
    }
  }

  async extractRolNumbers(files: DriveFile[]): Promise<
    {
      fileId: string
      fileName: string
      rolNumbers: string[]
      documentType: "inscripcion" | "mandato" | "tasacion" | "kmz" | "fundo" | "foto" | "orden" | "otro"
    }[]
  > {
    const results = []

    for (const file of files) {
      try {
        // Determinar tipo de documento por nombre basado en estructura real
        let documentType: "inscripcion" | "mandato" | "tasacion" | "kmz" | "fundo" | "foto" | "orden" | "otro" = "otro"
        const fileName = file.name.toLowerCase()

        if (fileName.includes("inscripcion") || fileName.includes("inscripción")) {
          documentType = "inscripcion"
        } else if (fileName.includes("mandato")) {
          documentType = "mandato"
        } else if (fileName.includes("tasacion") || fileName.includes("tasación")) {
          documentType = "tasacion"
        } else if (fileName.includes(".kmz") || fileName.includes("campo")) {
          documentType = "kmz"
        } else if (fileName.includes("fundo")) {
          documentType = "fundo"
        } else if (fileName.includes("foto")) {
          documentType = "foto"
        } else if (fileName.includes("orden") && fileName.includes("venta")) {
          documentType = "orden"
        }

        // Solo procesar archivos de texto/PDF/KMZ (simulado)
        if (
          file.mimeType.includes("text") ||
          file.mimeType.includes("pdf") ||
          file.mimeType.includes("document") ||
          file.mimeType.includes("kmz")
        ) {
          // Simulación de extracción de números de rol
          const mockRolNumbers = this.generateMockRolNumbers(documentType)

          results.push({
            fileId: file.id,
            fileName: file.name,
            rolNumbers: mockRolNumbers,
            documentType,
          })
        }
      } catch (error) {
        console.error(`Error processing file ${file.name}:`, error)
      }
    }

    return results
  }

  private generateMockRolNumbers(documentType: string): string[] {
    // Simulación de números de rol basados en el tipo de documento real
    const mockNumbers = {
      inscripcion: ["140-2024", "142-2024"], // Números de rol de inscripciones
      mandato: ["MV-INI-2024-001", "MV-TF-2024-002"], // Mandatos de venta
      tasacion: ["TAS-2024-456", "TAS-COM-2024-789"], // Tasaciones
      kmz: ["KMZ-140-2023"], // Archivos de ubicación KMZ
      fundo: ["FUNDO-INI-140-2024"], // Documentos de fundo
      foto: ["FOTO-REF-2023"], // Referencias fotográficas
      orden: ["OV-INI-2023", "OV-TF-2023"], // Órdenes de venta
      otro: ["ROL-2024-999"],
    }

    return mockNumbers[documentType as keyof typeof mockNumbers] || mockNumbers.otro
  }

  async testConnection(): Promise<boolean> {
    try {
      console.log("[v0] Testing Google Drive connection...")
      const response = await this.fetchWithRetry(`${this.baseUrl}/about?key=${this._apiKey}&fields=user`)
      console.log("[v0] Connection test successful")
      return response.ok
    } catch (error) {
      const isProduction =
        typeof window !== "undefined" &&
        !window.location.hostname.includes("localhost") &&
        !window.location.hostname.includes("preview")

      if (isProduction) {
        console.error("[v0] Connection test failed:", error)
      } else {
        console.log("[v0] Connection test failed (expected in preview):", error)
      }
      return false
    }
  }

  async searchKMZFiles(query?: string, folderId?: string): Promise<DriveFile[]> {
    try {
      let searchQuery =
        "(name contains '.kmz' or mimeType contains 'kmz' or mimeType contains 'google-earth') and trashed=false"

      if (query && query.trim()) {
        searchQuery = `name contains '${query}' and ${searchQuery}`
      }

      if (folderId) {
        searchQuery = `'${folderId}' in parents and ${searchQuery}`
      }

      const params = new URLSearchParams({
        key: this._apiKey,
        q: searchQuery,
        fields: "files(id,name,mimeType,size,modifiedTime,webViewLink,parents,thumbnailLink)",
        pageSize: "100",
      })

      const response = await this.fetchWithRetry(`${this.baseUrl}/files?${params}`)

      if (!response.ok) {
        throw new Error(`Google Drive API error: ${response.status}`)
      }

      const data = await response.json()

      console.log(
        "[v0] KMZ files found:",
        (data.files || []).map((f: DriveFile) => f.name),
      )

      return data.files || []
    } catch (error) {
      console.error("Error searching KMZ files:", error)
      throw error
    }
  }

  async searchKMZInAllFolders(
    rootFolderId?: string,
    query?: string,
  ): Promise<
    {
      file: DriveFile
      folderPath: string[]
      depth: number
    }[]
  > {
    const results: { file: DriveFile; folderPath: string[]; depth: number }[] = []

    const searchInFolder = async (folderId: string, currentPath: string[], depth: number) => {
      try {
        // Search KMZ files in current folder
        const kmzFiles = await this.searchKMZFiles(query, folderId)

        for (const file of kmzFiles) {
          results.push({
            file,
            folderPath: [...currentPath],
            depth,
          })
        }

        // Get subfolders and search recursively
        const { files } = await this.listFiles(folderId)
        const subfolders = files.filter((file) => file.mimeType === "application/vnd.google-apps.folder")

        for (const subfolder of subfolders) {
          await searchInFolder(subfolder.id, [...currentPath, subfolder.name], depth + 1)
        }
      } catch (error) {
        console.error(`Error searching in folder ${folderId}:`, error)
      }
    }

    if (rootFolderId) {
      // Get root folder name
      try {
        const folderResponse = await this.fetchWithRetry(
          `${this.baseUrl}/files/${rootFolderId}?key=${this._apiKey}&fields=name`,
        )
        const folderInfo = await folderResponse.json()
        await searchInFolder(rootFolderId, [folderInfo.name], 0)
      } catch (error) {
        console.error("Error getting root folder info:", error)
        await searchInFolder(rootFolderId, ["Root"], 0)
      }
    } else {
      // Search in all accessible folders
      const kmzFiles = await this.searchKMZFiles(query)
      for (const file of kmzFiles) {
        results.push({
          file,
          folderPath: ["Root"],
          depth: 0,
        })
      }
    }

    return results
  }
}

// Instancia singleton del servicio
export const driveService = new GoogleDriveService("AIzaSyB6AVo8HT0RyEmiu8YRKj3skR3ujXyjHTU")
