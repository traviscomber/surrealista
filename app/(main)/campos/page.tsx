import type { Metadata } from "next"
import { CAMPOSFolderView } from "@/components/campos/campos-folder-view"

export const metadata: Metadata = {
  title: "CAMPOS - Gestión de Carpetas | Sur-Realista",
  description: "Vista de carpetas CAMPOS con mapa integrado",
}

export default function CAMPOSPage() {
  return <CAMPOSFolderView />
}
