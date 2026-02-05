# Drag and Drop Feature for Comunicaciones

## Overview

This feature adds drag-and-drop functionality to the Comunicaciones module when creating new folders. Each newly created folder automatically includes three designated drop zones for organizing files:

1. **Propuesta Comercial** - For commercial proposals
2. **Presentacion** - For presentations  
3. **KMZ** - For KMZ (geospatial) files

## How It Works

### Creating a New Folder

1. Navigate to the Comunicaciones > Documentación tab
2. Click the "Nueva Carpeta" button
3. Enter a folder name (e.g., "Ranco", "Iñipulli")
4. Click "Crear Carpeta"
5. You'll be automatically taken to the folder's drag-drop interface

### Using the Drag and Drop Interface

**For each zone (Propuesta Comercial, Presentacion, KMZ):**

- **Drag files directly**: Click and drag files onto any zone
- **Click to select**: Click "Seleccionar archivo" to browse and upload files
- **View files**: See uploaded files listed below each zone with file size
- **Remove files**: Hover over a file and click the trash icon to remove it
- **Visual feedback**: Zones highlight when you drag files over them

### Files Management

- Files are uploaded to Vercel Blob storage
- Each file is organized by: `{folderId}/{zoneId}/{timestamp}-{filename}`
- Files persist in the database and can be retrieved later
- You can return to the folder list by clicking the "Volver" button

## Components

### FolderDragDrop Component
Located in: `/components/communications/folder-drag-drop.tsx`

**Props:**
- `folderName` (string): Name of the folder being managed
- `folderId` (string): Unique identifier for the folder
- `onFilesUpdated` (function, optional): Callback when files are updated

**Features:**
- Drag-and-drop file upload
- Multiple file selection
- File size formatting
- Real-time visual feedback
- Responsive 3-column layout

### DocumentsManager Updates
Updated in: `/components/communications/documents-manager.tsx`

**New features:**
- `viewingFolderId` state: Tracks which folder is being edited
- `viewingFolderName` state: Stores the folder name for display
- "Agregar archivos" button on folders for quick access to drag-drop interface
- Automatic navigation to drag-drop view after folder creation
- Back button to return to folder list

## Integration Notes

- The feature integrates seamlessly with existing Supabase folders table
- Uses the same `/api/upload` endpoint for file uploads
- Maintains compatibility with existing document management features
- No breaking changes to existing folder or document functionality
