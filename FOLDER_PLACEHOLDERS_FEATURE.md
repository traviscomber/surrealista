# Folder Placeholders Feature

## Overview
Administrators can now customize the document placeholders (drag-and-drop zones) for each folder in the Comunicaciones section. This allows for flexible configuration of what types of documents can be added to different folders.

## How It Works

### For Users
- When viewing a folder in drag-and-drop mode, users see the configured document placeholders
- Each placeholder represents a drop zone where users can upload documents
- Default placeholders are: "Propuesta Comercial", "Presentacion", and "KMZ"

### For Admins
- Admins have access to an "Editar Placeholders" button when viewing a folder in drag-and-drop mode
- Clicking this button opens a dialog where admins can:
  - **Add new placeholders**: Define a technical name and visible label for each placeholder
  - **Edit existing placeholders**: Modify the technical name or visible label
  - **Delete placeholders**: Remove unwanted placeholders
  - **Reorder placeholders**: Change the order in which placeholders appear (using drag handles)

## Database Schema

### folder_placeholders Table
```sql
CREATE TABLE folder_placeholders (
  id UUID PRIMARY KEY,
  folder_id UUID NOT NULL -- References folders table
  placeholder_name VARCHAR(255) NOT NULL -- Technical identifier
  placeholder_label VARCHAR(255) NOT NULL -- User-visible label
  sort_order INTEGER -- Display order
  created_at TIMESTAMP,
  updated_at TIMESTAMP,
  created_by UUID,
  UNIQUE(folder_id, placeholder_name)
);
```

## Components

### FolderPlaceholdersEditor
Location: `components/communications/folder-placeholders-editor.tsx`

Main admin interface for managing placeholders. Features:
- Display current placeholders in a list
- Add new placeholders with name and label
- Edit existing placeholders inline
- Delete placeholders with confirmation
- Responsive dialog layout

Props:
- `folderId`: UUID of the folder being edited
- `folderName`: Display name of the folder
- `isOpen`: Boolean to control dialog visibility
- `onClose`: Callback when dialog closes

### FolderDragDrop (Updated)
Location: `components/communications/folder-drag-drop.tsx`

Updated to support custom placeholders:
- Fetches custom placeholders from database on mount
- Falls back to default placeholders if none configured
- Shows "Editar Placeholders" button for admins
- Reloads placeholders after admin makes changes
- Displays placeholder labels instead of technical names

New Props:
- `isAdmin`: Boolean to determine if user is admin

## API Integration

### Supabase
- **Table**: `folder_placeholders`
- **Operations**:
  - `SELECT`: Fetch placeholders for a folder (ordered by sort_order)
  - `INSERT`: Add new placeholder (admin only)
  - `UPDATE`: Modify existing placeholder (admin only)
  - `DELETE`: Remove placeholder (admin only)

## Authorization

- **View placeholders**: All authenticated users
- **Create/Edit/Delete placeholders**: Admin users only
- Admin status is determined by `profiles.role = 'admin'`

## Default Behavior

If no custom placeholders are configured for a folder, the system automatically uses:
1. Propuesta Comercial
2. Presentacion
3. KMZ

These defaults are defined in `FolderDragDrop.tsx` and can be customized there.

## Usage Example

1. Navigate to Comunicaciones > Documentación
2. Create a new folder or click "Agregar archivos" on an existing folder
3. If you're an admin, click "Editar Placeholders"
4. Add, edit, or delete placeholders as needed
5. Changes are saved immediately to the database
6. Close the dialog and the placeholders will reload

## Future Enhancements

- Drag-and-drop reordering of placeholders
- Placeholder descriptions for additional context
- Placeholder icons/colors for visual distinction
- Required vs optional placeholders
- Placeholder-specific file type restrictions
