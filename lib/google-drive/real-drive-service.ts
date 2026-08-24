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

  async extractRolNumbers(_folderId: string): Promise<string[]> {
    // No verified server-side ROL extractor is exposed by the Drive API.
    // Never infer ROL values from folder/file names.
    return []
  }
}

export const realDriveService = new RealGoogleDriveService()
export { RealGoogleDriveService as RealDriveService }
