export interface DriveFile {
  id: string
  name: string
  mimeType: string
  size?: string
  modifiedTime?: string
  parents?: string[]
  webViewLink?: string
}

export interface FolderStructure {
  id: string
  name: string
  originalName: string
  displayName: string
  files: DriveFile[]
  subfolders: FolderStructure[]
  totalFiles: number
  totalSize: number
  completionStatus: "complete" | "incomplete" | "pending"
  completenessScore: number
  completenessDetails: {
    overallScore: number
    criteriaResults: unknown[]
    recommendations: string[]
    missingElements: string[]
    status: string
  }
  extractedInfo: {
    rolNumbers: string[]
    location: string
    area: string
    year: string
  }
}

type FolderApiRow = {
  id?: unknown
  name?: unknown
  modifiedTime?: unknown
  webViewLink?: unknown
}

function emptyCompleteness() {
  return {
    overallScore: 0,
    criteriaResults: [] as unknown[],
    recommendations: [] as string[],
    missingElements: [] as string[],
    status: "pending",
  }
}

export class RealGoogleDriveService {
  private connected = false

  async authenticate(): Promise<boolean> {
    try {
      const response = await fetch("/api/drive/folders", { cache: "no-store" })
      if (response.ok) {
        this.connected = true
        return true
      }

      this.connected = false
      if (response.status === 401 && typeof window !== "undefined") {
        return this.startOAuthPopup()
      }
      return false
    } catch (error) {
      console.error("[Google Drive] authentication check failed", error)
      this.connected = false
      return false
    }
  }

  private async startOAuthPopup(): Promise<boolean> {
    if (typeof window === "undefined") return false

    return new Promise((resolve) => {
      const popup = window.open("/api/auth/google", "google-oauth", "width=500,height=600,scrollbars=yes,resizable=yes")
      if (!popup) {
        resolve(false)
        return
      }

      let settled = false
      const finish = (value: boolean) => {
        if (settled) return
        settled = true
        clearInterval(closedCheck)
        clearTimeout(timeout)
        window.removeEventListener("message", onMessage)
        this.connected = value
        resolve(value)
      }

      const onMessage = (event: MessageEvent) => {
        if (event.origin !== window.location.origin) return
        if (event.data?.type === "oauth-success") finish(true)
        if (event.data?.type === "oauth-error") finish(false)
      }

      const closedCheck = window.setInterval(() => {
        if (popup.closed) {
          void this.checkAuthenticationStatus().then(finish)
        }
      }, 1000)

      const timeout = window.setTimeout(() => {
        if (!popup.closed) popup.close()
        finish(false)
      }, 120_000)

      window.addEventListener("message", onMessage)
    })
  }

  private async checkAuthenticationStatus(): Promise<boolean> {
    try {
      const response = await fetch("/api/drive/folders", { cache: "no-store" })
      this.connected = response.ok
      return this.connected
    } catch {
      this.connected = false
      return false
    }
  }

  async listSuccessCases(): Promise<FolderStructure[]> {
    if (!this.connected && !(await this.checkAuthenticationStatus())) {
      throw new Error("Google Drive no está autenticado")
    }

    const response = await fetch("/api/drive/folders", { cache: "no-store" })
    if (!response.ok) {
      throw new Error(`Google Drive folders request failed: ${response.status}`)
    }

    const payload = await response.json().catch(() => ({}))
    const rows = Array.isArray(payload?.files) ? payload.files as FolderApiRow[] : []

    return rows.flatMap((row) => {
      const id = typeof row.id === "string" ? row.id : ""
      const name = typeof row.name === "string" ? row.name : ""
      if (!id || !name) return []

      return [{
        id,
        name,
        originalName: name,
        displayName: name,
        files: [],
        subfolders: [],
        totalFiles: 0,
        totalSize: 0,
        completionStatus: "pending" as const,
        completenessScore: 0,
        completenessDetails: emptyCompleteness(),
        extractedInfo: {
          rolNumbers: [],
          location: "",
          area: "",
          year: "",
        },
      }]
    })
  }

  async listFolderContents(folderId: string): Promise<DriveFile[]> {
    if (!this.connected && !(await this.checkAuthenticationStatus())) {
      throw new Error("Google Drive no está autenticado")
    }

    const response = await fetch(`/api/drive/folders/${encodeURIComponent(folderId)}`, { cache: "no-store" })
    if (!response.ok) throw new Error(`No se pudo leer la carpeta (${response.status})`)
    const payload = await response.json().catch(() => ({}))
    return Array.isArray(payload?.files) ? payload.files as DriveFile[] : []
  }

  async createFolder(parentFolderId: string, name: string): Promise<DriveFile> {
    const response = await fetch(`/api/drive/folders/${encodeURIComponent(parentFolderId)}/create`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    })
    const payload = await response.json().catch(() => ({}))
    if (!response.ok || !payload?.file) throw new Error(payload?.error || "No se pudo crear la carpeta")
    return payload.file as DriveFile
  }

  async uploadFile(parentFolderId: string, file: File): Promise<DriveFile> {
    const formData = new FormData()
    formData.append("file", file)
    const response = await fetch(`/api/drive/folders/${encodeURIComponent(parentFolderId)}/upload`, {
      method: "POST",
      body: formData,
    })
    const payload = await response.json().catch(() => ({}))
    if (!response.ok || !payload?.file) throw new Error(payload?.error || "No se pudo subir el archivo")
    return payload.file as DriveFile
  }

  async renameFile(fileId: string, name: string): Promise<DriveFile> {
    const response = await fetch(`/api/drive/files/${encodeURIComponent(fileId)}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    })
    const payload = await response.json().catch(() => ({}))
    if (!response.ok || !payload?.file) throw new Error(payload?.error || "No se pudo renombrar el elemento")
    return payload.file as DriveFile
  }

  async extractRolNumbers(_folderId: string): Promise<string[]> {
    // No verified server-side ROL extractor is exposed by the Drive API.
    // Never infer ROL values from folder/file names.
    return []
  }
}

export const realDriveService = new RealGoogleDriveService()
export { RealGoogleDriveService as RealDriveService }
