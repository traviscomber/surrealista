"use client"

import { CAMPOSFolderViewIntegrated } from "@/components/campos/campos-folder-view-integrated"

/**
 * Compatibility entrypoint kept for existing routes and shells.
 * The canonical CAMPOS implementation lives in CAMPOSFolderViewIntegrated so
 * geometry parsing, CIREN context and fallback semantics have a single source.
 */
export function CAMPOSFolderView() {
  return <CAMPOSFolderViewIntegrated />
}
