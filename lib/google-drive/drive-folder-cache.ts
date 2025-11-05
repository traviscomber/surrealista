import { driveService } from "./drive-service"

export interface CachedFolder {
  id: string
  name: string
  mimeType: string
  modifiedTime: string
  webViewLink?: string
  parents?: string[]
  children?: CachedFolder[]
  isExpanded?: boolean
}

export interface DriveIndexCache {
  folders: CachedFolder[]
  lastUpdated: number
  userId: string
}

class DriveFolderCacheService {
  private cacheKey = "drive_folder_index"
  private cacheTimeout = 30 * 60 * 1000 // 30 minutes

  async getOrFetchFolders(rootFolderId?: string, forceRefresh = false): Promise<CachedFolder[]> {
    console.log("[v0] Getting or fetching Drive folders...")

    // Check cache first
    if (!forceRefresh) {
      const cached = this.getCachedFolders()
      if (cached) {
        console.log("[v0] Using cached folder structure")
        return cached
      }
    }

    // Fetch fresh data
    console.log("[v0] Fetching fresh folder structure from Drive...")
    const folders = await this.fetchAllFolders(rootFolderId)

    // Cache the results
    this.cacheFolders(folders)

    return folders
  }

  private async fetchAllFolders(rootFolderId?: string): Promise<CachedFolder[]> {
    try {
      if (rootFolderId) {
        // Fetch specific folder structure
        const structure = await driveService.getFolderStructure(rootFolderId)
        return this.convertToCachedFolder(structure)
      }

      // Fetch all accessible folders
      const { files } = await driveService.listFiles()
      const folders = files.filter((f) => f.mimeType === "application/vnd.google-apps.folder")

      // Convert to cached format
      const cachedFolders: CachedFolder[] = []
      for (const folder of folders) {
        try {
          const structure = await driveService.getFolderStructure(folder.id)
          cachedFolders.push(...this.convertToCachedFolder(structure))
        } catch (error) {
          console.error(`[v0] Error fetching folder ${folder.name}:`, error)
          // Add folder without children if fetch fails
          cachedFolders.push({
            id: folder.id,
            name: folder.name,
            mimeType: folder.mimeType,
            modifiedTime: folder.modifiedTime,
            webViewLink: folder.webViewLink,
            parents: folder.parents,
            children: [],
            isExpanded: false,
          })
        }
      }

      return cachedFolders
    } catch (error) {
      console.error("[v0] Error fetching folders:", error)
      return []
    }
  }

  private convertToCachedFolder(structure: any): CachedFolder[] {
    const folder: CachedFolder = {
      id: structure.id,
      name: structure.name,
      mimeType: "application/vnd.google-apps.folder",
      modifiedTime: new Date().toISOString(),
      children: [],
      isExpanded: false,
    }

    // Add subfolders recursively
    if (structure.subfolders && structure.subfolders.length > 0) {
      folder.children = structure.subfolders.flatMap((sf: any) => this.convertToCachedFolder(sf))
    }

    // Add files as children
    if (structure.files && structure.files.length > 0) {
      const fileChildren: CachedFolder[] = structure.files.map((file: any) => ({
        id: file.id,
        name: file.name,
        mimeType: file.mimeType,
        modifiedTime: file.modifiedTime,
        webViewLink: file.webViewLink,
        parents: file.parents,
      }))
      folder.children = [...(folder.children || []), ...fileChildren]
    }

    return [folder]
  }

  private getCachedFolders(): CachedFolder[] | null {
    try {
      const cached = localStorage.getItem(this.cacheKey)
      if (!cached) return null

      const data: DriveIndexCache = JSON.parse(cached)

      // Check if cache is still valid
      if (Date.now() - data.lastUpdated > this.cacheTimeout) {
        console.log("[v0] Cache expired")
        return null
      }

      return data.folders
    } catch (error) {
      console.error("[v0] Error reading cache:", error)
      return null
    }
  }

  private cacheFolders(folders: CachedFolder[]): void {
    try {
      const cache: DriveIndexCache = {
        folders,
        lastUpdated: Date.now(),
        userId: "current_user", // TODO: Get actual user ID
      }

      localStorage.setItem(this.cacheKey, JSON.stringify(cache))
      console.log("[v0] Cached", folders.length, "folders")
    } catch (error) {
      console.error("[v0] Error caching folders:", error)
    }
  }

  clearCache(): void {
    localStorage.removeItem(this.cacheKey)
    console.log("[v0] Cache cleared")
  }

  async refreshCache(rootFolderId?: string): Promise<CachedFolder[]> {
    return this.getOrFetchFolders(rootFolderId, true)
  }
}

export const driveFolderCache = new DriveFolderCacheService()
