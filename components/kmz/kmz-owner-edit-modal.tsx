'use client'

import { useEffect, useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { RefreshCw } from 'lucide-react'
import { createBrowserClient } from '@supabase/ssr'

interface KMZOwnerEditModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  kmzId: string
  kmzFileName?: string
  currentOwner?: string
  currentPic?: string
  currentPicPhone?: string
  currentPicEmail?: string
  currentGoogleDocsLink?: string
  currentRegion?: string
  currentCategory?: string
  currentDescription?: string
  currentFilePath?: string
  currentLatitude?: number | null
  currentLongitude?: number | null
  currentMetadata?: Record<string, unknown> | null
  onSave?: () => void
}

export function KMZOwnerEditModal({
  open,
  onOpenChange,
  kmzId,
  kmzFileName,
  currentOwner,
  currentPic,
  currentPicPhone,
  currentPicEmail,
  currentGoogleDocsLink,
  currentRegion,
  currentCategory,
  currentDescription,
  currentFilePath,
  currentLatitude,
  currentLongitude,
  currentMetadata,
  onSave,
}: KMZOwnerEditModalProps) {
  const [owner, setOwner] = useState('')
  const [pic, setPic] = useState('')
  const [picPhone, setPicPhone] = useState('')
  const [picEmail, setPicEmail] = useState('')
  const [googleDocsLink, setGoogleDocsLink] = useState('')
  const [region, setRegion] = useState('')
  const [category, setCategory] = useState('')
  const [description, setDescription] = useState('')
  const [filePath, setFilePath] = useState('')
  const [latitude, setLatitude] = useState('')
  const [longitude, setLongitude] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!open) return
    setOwner(currentOwner || '')
    setPic(currentPic || '')
    setPicPhone(currentPicPhone || '')
    setPicEmail(currentPicEmail || '')
    setGoogleDocsLink(currentGoogleDocsLink || '')
    setRegion(currentRegion || '')
    setCategory(currentCategory || '')
    setDescription(currentDescription || '')
    setFilePath(currentFilePath || '')
    setLatitude(currentLatitude != null && Number.isFinite(Number(currentLatitude)) ? String(currentLatitude) : '')
    setLongitude(currentLongitude != null && Number.isFinite(Number(currentLongitude)) ? String(currentLongitude) : '')
    setError(null)
  }, [
    open,
    currentOwner,
    currentPic,
    currentPicPhone,
    currentPicEmail,
    currentGoogleDocsLink,
    currentRegion,
    currentCategory,
    currentDescription,
    currentFilePath,
    currentLatitude,
    currentLongitude,
  ])

  const handleSave = async () => {
    try {
      setSaving(true)
      setError(null)

      const lat = latitude.trim() === '' ? null : Number(latitude)
      const lng = longitude.trim() === '' ? null : Number(longitude)
      if (lat !== null && (!Number.isFinite(lat) || lat < -90 || lat > 90)) {
        throw new Error('Latitud inválida. Debe estar entre -90 y 90.')
      }
      if (lng !== null && (!Number.isFinite(lng) || lng < -180 || lng > 180)) {
        throw new Error('Longitud inválida. Debe estar entre -180 y 180.')
      }
      if ((lat === null) !== (lng === null)) {
        throw new Error('Para cambiar la ubicación debes ingresar latitud y longitud.')
      }

      const nextMetadata: Record<string, unknown> = { ...(currentMetadata || {}) }
      if (lat !== null && lng !== null) {
        nextMetadata.manual_location = {
          lat,
          lng,
          source: 'admin_edit',
          updated_at: new Date().toISOString(),
        }
      } else {
        delete nextMetadata.manual_location
      }

      const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      )

      const { error: updateError } = await supabase
        .from('kmz_collection')
        .update({
          owner: owner.trim() || null,
          pic: pic.trim() || null,
          pic_phone: picPhone.trim() || null,
          pic_email: picEmail.trim() || null,
          google_docs_link: googleDocsLink.trim() || null,
          region: region.trim() || null,
          category: category.trim() || null,
          description: description.trim() || null,
          file_path: filePath.trim() || currentFilePath || '',
          metadata: nextMetadata,
          updated_at: new Date().toISOString(),
        })
        .eq('id', kmzId)

      if (updateError) throw updateError

      onOpenChange(false)
      onSave?.()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al guardar')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Editar información del KMZ</DialogTitle>
          {kmzFileName && (
            <div className="mt-3 rounded border border-border bg-muted/40 p-2">
              <p className="text-xs text-muted-foreground">Editando</p>
              <p className="break-all font-mono text-sm font-semibold">{kmzFileName}</p>
            </div>
          )}
        </DialogHeader>

        <div className="grid gap-4 py-2 md:grid-cols-2">
          {error && <div className="md:col-span-2 rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">{error}</div>}

          <div className="space-y-2"><Label htmlFor="region">Región / ubicación</Label><Input id="region" value={region} onChange={(e) => setRegion(e.target.value)} placeholder="Los Ríos" /></div>
          <div className="space-y-2"><Label htmlFor="category">Categoría</Label><Input id="category" value={category} onChange={(e) => setCategory(e.target.value)} placeholder="campo" /></div>

          <div className="space-y-2"><Label htmlFor="latitude">Latitud</Label><Input id="latitude" inputMode="decimal" value={latitude} onChange={(e) => setLatitude(e.target.value)} placeholder="-39.8142" /></div>
          <div className="space-y-2"><Label htmlFor="longitude">Longitud</Label><Input id="longitude" inputMode="decimal" value={longitude} onChange={(e) => setLongitude(e.target.value)} placeholder="-73.2459" /></div>

          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="filePath">Ruta / carpeta Google Drive</Label>
            <Input id="filePath" value={filePath} onChange={(e) => setFilePath(e.target.value)} placeholder="Campos / Los Ríos / Fundo..." />
          </div>

          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="description">Descripción</Label>
            <Textarea id="description" value={description} onChange={(e) => setDescription(e.target.value)} rows={3} />
          </div>

          <div className="space-y-2"><Label htmlFor="owner">Dueño del campo</Label><Input id="owner" value={owner} onChange={(e) => setOwner(e.target.value)} /></div>
          <div className="space-y-2"><Label htmlFor="pic">Person In Charge (PIC)</Label><Input id="pic" value={pic} onChange={(e) => setPic(e.target.value)} /></div>
          <div className="space-y-2"><Label htmlFor="picPhone">Teléfono PIC</Label><Input id="picPhone" value={picPhone} onChange={(e) => setPicPhone(e.target.value)} /></div>
          <div className="space-y-2"><Label htmlFor="picEmail">Email PIC</Label><Input id="picEmail" type="email" value={picEmail} onChange={(e) => setPicEmail(e.target.value)} /></div>

          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="googleDocsLink">Link Google Drive / Docs</Label>
            <Input id="googleDocsLink" value={googleDocsLink} onChange={(e) => setGoogleDocsLink(e.target.value)} className="font-mono text-xs" />
          </div>

          <p className="text-xs text-muted-foreground md:col-span-2">
            La latitud/longitud manual corrige el punto operativo mostrado por Sur-Realista. No reemplaza ni borra la geometría original del KMZ.
          </p>

          <div className="flex gap-2 pt-2 md:col-span-2">
            <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving} className="flex-1">Cancelar</Button>
            <Button onClick={() => void handleSave()} disabled={saving} className="flex-1">
              {saving ? <><RefreshCw className="mr-2 h-4 w-4 animate-spin" />Guardando...</> : 'Guardar cambios'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
