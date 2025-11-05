import { driveService } from "./drive-service"

export interface CachedFolder {
  id: string
  name: string
  mimeType: string
  modifiedTime?: string
  webViewLink?: string
  parents?: string[]
  children?: CachedFolder[]
  isExpanded?: boolean
  childrenLoaded?: boolean
}

export interface DriveIndexCache {
  folders: CachedFolder[]
  lastUpdated: number
  userId: string
  rootFolderId?: string
}

class DriveFolderCacheService {
  private cacheKey = "drive_folder_index"
  private cacheTimeout = 30 * 60 * 1000 // 30 minutes
  private rootFolderId = "1234567890" // TODO: Configure this with your actual root folder ID

  setRootFolder(folderId: string) {
    this.rootFolderId = folderId
    this.clearCache()
  }

  async getOrFetchFolders(forceRefresh = false): Promise<CachedFolder[]> {
    console.log("[v0] Getting or fetching Drive folders from root:", this.rootFolderId)

    if (!forceRefresh) {
      const cached = this.getCachedFolders()
      if (cached) {
        console.log("[v0] Using cached folder structure")
        return cached
      }
    }

    console.log("[v0] Fetching fresh folder structure from Drive...")
    const folders = await this.fetchFolderStructure(this.rootFolderId)

    this.cacheFolders(folders)

    return folders
  }

  async fetchFolderChildren(folderId: string): Promise<CachedFolder[]> {
    try {
      console.log("[v0] Fetching children for folder:", folderId)
      const { files } = await driveService.listFiles(folderId)

      const children: CachedFolder[] = files.map((file) => ({
        id: file.id,
        name: file.name,
        mimeType: file.mimeType,
        modifiedTime: file.modifiedTime,
        webViewLink: file.webViewLink,
        parents: file.parents,
        children: [],
        childrenLoaded: false,
        isExpanded: false,
      }))

      console.log("[v0] Loaded", children.length, "children")
      return children
    } catch (error) {
      console.error("[v0] Error fetching folder children:", error)
      return []
    }
  }

  private async fetchFolderStructure(folderId: string): Promise<CachedFolder[]> {
    try {
      console.log("[v0] Fetching folder structure for:", folderId)

      const { files } = await driveService.listFiles(folderId)

      const rootFolder: CachedFolder = {
        id: folderId,
        name: "Root",
        mimeType: "application/vnd.google-apps.folder",
        modifiedTime: new Date().toISOString(),
        children: files.map((file) => ({
          id: file.id,
          name: file.name,
          mimeType: file.mimeType,
          modifiedTime: file.modifiedTime,
          webViewLink: file.webViewLink,
          parents: file.parents,
          children: [],
          childrenLoaded: false,
          isExpanded: false,
        })),
        childrenLoaded: true,
        isExpanded: true,
      }

      console.log("[v0] Loaded root folder with", rootFolder.children?.length, "items")
      return [rootFolder]
    } catch (error) {
      console.error("[v0] Error fetching folder structure:", error)
      return []
    }
  }

  private getCachedFolders(): CachedFolder[] | null {
    try {
      const cached = localStorage.getItem(this.cacheKey)
      if (!cached) return null

      const data: DriveIndexCache = JSON.parse(cached)

      if (Date.now() - data.lastUpdated > this.cacheTimeout) {
        console.log("[v0] Cache expired")
        return null
      }

      if (data.rootFolderId !== this.rootFolderId) {
        console.log("[v0] Root folder changed, cache invalid")
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
        userId: "current_user",
        rootFolderId: this.rootFolderId,
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

  async refreshCache(): Promise<CachedFolder[]> {
    return this.getOrFetchFolders(true)
  }
}

export const driveFolderCache = new DriveFolderCacheService()
