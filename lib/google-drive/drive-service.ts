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

/**
 * Legacy client-side Drive adapter.
 *
 * Direct Drive access from the browser is intentionally disabled. Private Drive
 * data must be accessed through a server-side OAuth integration so credentials
 * never ship in the client bundle. The methods remain as safe no-op adapters for
 * old callers while the UI migrates to the server integration.
 */
export class GoogleDriveService {
  get apiKey(): null {
    return null
  }

  async listFiles(
    _folderId?: string,
    _pageToken?: string,
  ): Promise<{ files: DriveFile[]; nextPageToken?: string }> {
    return { files: [] }
  }

  async getFolderStructure(folderId: string): Promise<DriveFolder> {
    return {
      id: folderId,
      name: "Google Drive no conectado",
      files: [],
      subfolders: [],
      totalFiles: 0,
    }
  }

  async searchFiles(_query: string): Promise<DriveFile[]> {
    return []
  }

  async getFileContent(_fileId: string): Promise<string> {
    throw new Error("Direct client-side Google Drive content access is disabled")
  }

  async extractRolNumbers(_files: DriveFile[]): Promise<
    Array<{
      fileId: string
      fileName: string
      rolNumbers: string[]
      documentType: "inscripcion" | "mandato" | "tasacion" | "kmz" | "fundo" | "foto" | "orden" | "otro"
    }>
  > {
    // Never fabricate ROL values. Verified extraction belongs in the canonical
    // server-side document pipeline.
    return []
  }

  async testConnection(): Promise<boolean> {
    return false
  }

  async searchKMZFiles(_query?: string, _folderId?: string): Promise<DriveFile[]> {
    return []
  }

  async searchKMZInAllFolders(
    _rootFolderId?: string,
    _query?: string,
  ): Promise<Array<{ file: DriveFile; folderPath: string[]; depth: number }>> {
    return []
  }

  async searchFolders(): Promise<DriveFile[]> {
    return []
  }
}

export const driveService = new GoogleDriveService()
