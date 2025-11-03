interface GoogleDriveConfig {
  apiKey: string
  clientId: string
  clientSecret: string
  redirectUri: string
}

interface DriveFile {
  id: string
  name: string
  mimeType: string
  size?: string
  modifiedTime: string
  parents?: string[]
  webViewLink: string
}

import { completenessAnalyzer, type CompletenessResult } from "./completeness-analyzer"

interface FolderStructure {
  id: string
  name: string
  originalName: string // Added original name field
  displayName: string // Added formatted display name
  files: DriveFile[]
  subfolders: FolderStructure[]
  totalFiles: number
  totalSize: number
  completionStatus: "complete" | "incomplete" | "pending"
  completenessScore: number // Added detailed completeness score
  completenessDetails: CompletenessResult // Added detailed analysis
  extractedInfo: {
    // Added extracted information
    rolNumbers: string[]
    location: string
    area: string
    year: string
  }
}

class RealGoogleDriveService {
  private config: GoogleDriveConfig
  private accessToken: string | null = null

  constructor() {
    this.config = {
      apiKey: "AIzaSyB6AVo8HT0RyEmiu8YRKj3skR3ujXyjHTU",
      clientId: "",
      clientSecret: "",
      redirectUri: "postmessage",
    }
  }

  async authenticate(): Promise<boolean> {
    try {
      console.log("[v0] Attempting server-side Google Drive authentication...")

      const response = await fetch("/api/drive/folders")

      if (response.ok) {
        console.log("[v0] Already authenticated via server-side OAuth")
        this.accessToken = "server_authenticated"
        return true
      }

      if (response.status === 401) {
        console.log("[v0] No access token found, starting OAuth popup...")
        return await this.startOAuthPopup()
      }

      console.log("[v0] API error:", response.status, "falling back to demo mode")
      this.accessToken = "demo_mode"
      return true
    } catch (error) {
      console.error("[v0] Authentication failed:", error)
      console.log("[v0] Falling back to demo mode due to authentication error")
      this.accessToken = "demo_mode"
      return true
    }
  }

  private async startOAuthPopup(): Promise<boolean> {
    return new Promise((resolve) => {
      const popup = window.open("/api/auth/google", "google-oauth", "width=500,height=600,scrollbars=yes,resizable=yes")

      if (!popup) {
        console.error("[v0] Popup blocked, falling back to demo mode")
        this.accessToken = "demo_mode"
        resolve(true)
        return
      }

      const checkClosed = setInterval(() => {
        if (popup.closed) {
          clearInterval(checkClosed)
          // Check if authentication was successful
          this.checkAuthenticationStatus().then(resolve)
        }
      }, 1000)

      // Listen for messages from popup
      const messageListener = (event: MessageEvent) => {
        if (event.origin !== window.location.origin) return

        if (event.data.type === "oauth-success") {
          clearInterval(checkClosed)
          window.removeEventListener("message", messageListener)
          popup.close()
          this.accessToken = "server_authenticated"
          resolve(true)
        } else if (event.data.type === "oauth-error") {
          clearInterval(checkClosed)
          window.removeEventListener("message", messageListener)
          popup.close()
          this.accessToken = "demo_mode"
          resolve(true)
        }
      }

      window.addEventListener("message", messageListener)

      // Timeout after 5 minutes
      setTimeout(() => {
        clearInterval(checkClosed)
        window.removeEventListener("message", messageListener)
        if (!popup.closed) {
          popup.close()
        }
        this.accessToken = "demo_mode"
        resolve(true)
      }, 300000)
    })
  }

  private async checkAuthenticationStatus(): Promise<boolean> {
    try {
      const response = await fetch("/api/drive/folders")
      if (response.ok) {
        this.accessToken = "server_authenticated"
        return true
      }
    } catch (error) {
      console.error("[v0] Error checking auth status:", error)
    }

    this.accessToken = "demo_mode"
    return true
  }

  async listSuccessCases(): Promise<FolderStructure[]> {
    if (!this.accessToken) {
      throw new Error("Not authenticated. Call authenticate() first.")
    }

    if (this.accessToken === "demo_mode") {
      console.log("[v0] Using demo data - authentication fell back to demo mode")
      return this.getEnhancedDemoSuccessCases()
    }

    try {
      console.log("[v0] Making API call via server-side endpoint...")

      const response = await fetch("/api/drive/folders")

      if (!response.ok) {
        const errorData = await response.json()
        console.error("[v0] Server API call failed:", response.status, errorData)
        throw new Error(`Server API call failed: ${response.status}`)
      }

      const data = await response.json()
      console.log("[v0] Real Google Drive response via server:", data)

      // Process real folders
      const folders: FolderStructure[] = []

      for (const folder of data.files || []) {
        const folderStructure = await this.analyzeFolderStructure(folder.id, folder.name)
        folders.push(folderStructure)
      }

      console.log("[v0] Successfully processed", folders.length, "real folders")
      return folders
    } catch (error) {
      console.error("[v0] Error fetching real data:", error)
      console.log("[v0] Falling back to enhanced demo data")
      return this.getEnhancedDemoSuccessCases()
    }
  }

  private async analyzeFolderStructure(folderId: string, folderName: string): Promise<FolderStructure> {
    try {
      const response = await fetch(`/api/drive/folders/${folderId}`)

      if (!response.ok) {
        throw new Error(`Failed to analyze folder: ${response.status}`)
      }

      const filesData = await response.json()
      const files: DriveFile[] = filesData.files || []
      const folders = files.filter((f) => f.mimeType === "application/vnd.google-apps.folder")
      const regularFiles = files.filter((f) => f.mimeType !== "application/vnd.google-apps.folder")

      const completenessDetails = completenessAnalyzer.analyzeCompleteness(regularFiles, folders)
      const completionStatus = this.getCompletionStatusFromScore(completenessDetails.overallScore)

      const extractedInfo = this.extractFolderInfo(folderName)
      const displayName = this.formatDisplayName(folderName, extractedInfo)

      return {
        id: folderId,
        name: folderName,
        originalName: folderName, // Store original name
        displayName, // Store formatted display name
        files: regularFiles,
        subfolders: [], // Could be expanded to analyze subfolders
        totalFiles: regularFiles.length,
        totalSize: regularFiles.reduce((sum, file) => sum + Number.parseInt(file.size || "0"), 0),
        completionStatus,
        completenessScore: completenessDetails.overallScore, // Store detailed score
        completenessDetails, // Store full analysis
        extractedInfo, // Store extracted information
      }
    } catch (error) {
      console.error("[v0] Error analyzing folder:", error)
      return {
        id: folderId,
        name: folderName,
        originalName: folderName,
        displayName: folderName,
        files: [],
        subfolders: [],
        totalFiles: 0,
        totalSize: 0,
        completionStatus: "pending",
        completenessScore: 0,
        completenessDetails: {
          overallScore: 0,
          criteriaResults: [],
          recommendations: [],
          missingElements: [],
          status: "poor",
        },
        extractedInfo: {
          rolNumbers: [],
          location: "",
          area: "",
          year: "",
        },
      }
    }
  }

  private extractFolderInfo(folderName: string): {
    rolNumbers: string[]
    location: string
    area: string
    year: string
  } {
    const info = {
      rolNumbers: [] as string[],
      location: "",
      area: "",
      year: "",
    }

    // Extract rol numbers
    const rolMatches = folderName.match(/\b\d{1,3}[-_]\d{1,4}\b/g)
    if (rolMatches) {
      info.rolNumbers = rolMatches
    }

    // Extract location
    const locationKeywords = ["valdivia", "temuco", "osorno", "puerto", "lago", "villarrica", "pucon", "frutillar"]
    for (const keyword of locationKeywords) {
      if (folderName.toLowerCase().includes(keyword)) {
        info.location = keyword.charAt(0).toUpperCase() + keyword.slice(1)
        break
      }
    }

    // Extract area
    const areaMatch = folderName.match(/(\d+[._]?\d*)\s*(has?|hectáreas?)/i)
    if (areaMatch) {
      info.area = `${areaMatch[1]} has`
    }

    // Extract year
    const yearMatch = folderName.match(/\b(20\d{2})\b/)
    if (yearMatch) {
      info.year = yearMatch[1]
    }

    return info
  }

  private formatDisplayName(originalName: string, extractedInfo: any): string {
    let displayName = originalName

    // If we have extracted info, create a more readable format
    if (extractedInfo.location || extractedInfo.area || extractedInfo.year) {
      const parts = []

      if (extractedInfo.location) parts.push(extractedInfo.location)
      if (extractedInfo.area) parts.push(extractedInfo.area)
      if (extractedInfo.year) parts.push(`(${extractedInfo.year})`)
      if (extractedInfo.rolNumbers.length > 0) parts.push(`Rol: ${extractedInfo.rolNumbers[0]}`)

      if (parts.length > 0) {
        displayName = parts.join(" - ")
      }
    }

    return displayName
  }

  private getCompletionStatusFromScore(score: number): "complete" | "incomplete" | "pending" {
    if (score >= 75) return "complete"
    if (score >= 40) return "incomplete"
    return "pending"
  }

  private analyzeCompletionStatus(files: DriveFile[]): "complete" | "incomplete" | "pending" {
    // Keeping for backward compatibility
    const requiredFolders = [
      "1_FOTOS",
      "2_DOCUMENTOS",
      "3_COMUNICACIONES",
      "4_MARKETING",
      "5_PDF_SUELTO",
      "6_KMZ_SUELTO",
    ]
    const folderNames = files.filter((f) => f.mimeType === "application/vnd.google-apps.folder").map((f) => f.name)

    const hasRequiredFolders = requiredFolders.every((required) =>
      folderNames.some((name) => name.includes(required.split("_")[1])),
    )

    if (hasRequiredFolders && files.length >= 10) return "complete"
    if (files.length >= 5) return "incomplete"
    return "pending"
  }

  async extractRolNumbers(folderId: string): Promise<string[]> {
    try {
      const response = await fetch(`/api/drive/extract-rol/${folderId}`)

      if (!response.ok) {
        throw new Error(`Failed to extract rol numbers: ${response.status}`)
      }

      const data = await response.json()
      return data.rolNumbers || []
    } catch (error) {
      console.error("[v0] Error extracting rol numbers:", error)
      return []
    }
  }

  private async getDocumentFiles(folderId: string): Promise<DriveFile[]> {
    const response = await fetch(`/api/drive/documents/${folderId}`)

    if (!response.ok) {
      throw new Error(`Failed to get document files: ${response.status}`)
    }

    const data = await response.json()
    return data.files || []
  }

  private simulateRolExtraction(fileName: string): string[] {
    const rolPatterns = [
      /(\d{1,3}-\d{1,4})/g, // Format: 123-456
      /rol[:\s]*(\d+)/gi, // Format: rol: 123 or rol 123
      /inscripción[:\s]*(\d+)/gi, // Format: inscripción: 123
    ]

    const rolNumbers: string[] = []

    for (const pattern of rolPatterns) {
      const matches = fileName.match(pattern)
      if (matches) {
        rolNumbers.push(...matches)
      }
    }

    return rolNumbers
  }

  private getEnhancedDemoSuccessCases(): FolderStructure[] {
    return [
      {
        id: "1wJRhFJNpIqoJ_O9FPIhpPglmypnwgt5F",
        name: "Valdivia 142 has Teresa F...",
        originalName: "Valdivia 142 has Teresa F...",
        displayName: "Valdivia 142 has Teresa F...",
        files: [
          {
            id: "1",
            name: "1_FOTOS",
            mimeType: "application/vnd.google-apps.folder",
            modifiedTime: "2025-08-12T00:00:00Z",
            webViewLink: "https://drive.google.com/drive/folders/1wJRhFJNpIqoJ_O9FPIhpPglmypnwgt5F",
          },
          {
            id: "2",
            name: "2_DOCUMENTOS",
            mimeType: "application/vnd.google-apps.folder",
            modifiedTime: "2025-08-12T00:00:00Z",
            webViewLink: "https://drive.google.com/drive/folders/1wJRhFJNpIqoJ_O9FPIhpPglmypnwgt5F",
          },
          {
            id: "3",
            name: "Fundo Iñipulli_140_110124_compressed.pdf",
            mimeType: "application/pdf",
            size: "5100000",
            modifiedTime: "2024-01-12T00:00:00Z",
            webViewLink: "https://drive.google.com/drive/folders/1wJRhFJNpIqoJ_O9FPIhpPglmypnwgt5F",
          },
          {
            id: "4",
            name: "Orden de Venta Iñipulli.docx",
            mimeType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            size: "38000",
            modifiedTime: "2023-11-23T00:00:00Z",
            webViewLink: "https://drive.google.com/drive/folders/1wJRhFJNpIqoJ_O9FPIhpPglmypnwgt5F",
          },
          {
            id: "5",
            name: "Campo Iñipulli 140_has.kmz",
            mimeType: "application/vnd.google-earth.kmz",
            size: "2000",
            modifiedTime: "2023-09-13T00:00:00Z",
            webViewLink: "https://drive.google.com/drive/folders/1wJRhFJNpIqoJ_O9FPIhpPglmypnwgt5F",
          },
        ],
        subfolders: [],
        totalFiles: 8,
        totalSize: 7200000,
        completionStatus: "complete",
        completenessScore: 100,
        completenessDetails: {
          overallScore: 100,
          criteriaResults: [],
          recommendations: [],
          missingElements: [],
          status: "excellent",
        },
        extractedInfo: {
          rolNumbers: [],
          location: "",
          area: "",
          year: "",
        },
      },
    ]
  }

  private getDemoSuccessCases(): FolderStructure[] {
    return this.getEnhancedDemoSuccessCases()
  }
}

export const realDriveService = new RealGoogleDriveService()
export { RealGoogleDriveService as RealDriveService }
export type { FolderStructure, DriveFile }
