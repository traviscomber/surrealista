export interface DriveFile {
  id: string
  name: string
  type: "folder" | "document" | "image" | "video" | "other"
  size: string
  modified: string
  status: "synced" | "pending" | "error"
  path: string
}

export interface CompanyFolder {
  id: string
  name: string
  code: string
  type: "company" | "project" | "property" | "document" | "media"
  children?: CompanyFolder[]
  fileCount: number
  lastModified: string
  status: "active" | "archived" | "pending"
  expanded?: boolean
}

export interface SyncSettings {
  autoSync: boolean
  syncInterval: number
  includeImages: boolean
  includeDocuments: boolean
  includeVideos: boolean
  maxFileSize: number
}
