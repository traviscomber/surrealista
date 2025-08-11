import GoogleDriveImporter from "@/components/data-management/google-drive-importer"

export default function GoogleDriveImporterPage() {
  return (
    <div className="container mx-auto py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Importador Google Drive</h1>
        <p className="text-gray-600">Importa datos desde Google Drive, Sheets y archivos CSV</p>
      </div>
      <GoogleDriveImporter />
    </div>
  )
}
