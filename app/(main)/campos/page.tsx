import type { Metadata } from "next"
import { CAMPOSFolderView } from "@/components/campos/campos-folder-view"

export const metadata: Metadata = {
  title: "CAMPOS - Gestión de Carpetas | Sur-Realista",
  description: "Vista de carpetas CAMPOS con mapa integrado",
}

export default function CAMPOSPage() {
  return (
    <div className="fixed inset-x-0 bottom-0 top-16 min-h-0 overflow-hidden bg-slate-50">
      <C