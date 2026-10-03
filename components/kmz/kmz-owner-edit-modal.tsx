'use client'

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { RefreshCw } from 'lucide-react'

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
  currentDisplayName?: string
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
  currentDisplayName,
  onSave,
}: KMZOwnerEditModalProps) {
  const [displayName, setDisplayName] = useState('')
  const [owner, setOwner] = useState('')
  const [pic, setPic] = useState('')
  const [picPhone, setPicPhone] = useState('')
  const [picEmail, setPicEmail] = useState('')
  const [googleDocsLink, setGoogleDocsLink] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Update form fields when modal opens or data changes
  useEffect(() => {
    if (open) {
      setDisplayName(currentDisplayName || '')
      setOwner(currentOwner || '')
      setPic(currentPic || '')
      setPicPhone(currentPicPhone || '')
      setPicEmail(currentPicEmail || '')
      setGoogleDocsLink(currentGoogleDocsLink || '')
      setError(null)
    }
  }, [open, currentDisplayName, currentOwner, currentPic, currentPicPhone, currentPicEmail, currentGoogleDocsLink])

  const handleSave = async () => {
    try {
      setSaving(true)
      setError(null)

      const payload: Record<string, string> = {
        owner,
        google_docs_link: googleDocsLink,
      }

      if (currentDisplayName !== undefined || displayName.trim()) payload.displayName = displayName
      if (currentPic !== undefined || pic.trim()) payload.pic = pic
      if (currentPicPhone !== undefined || picPhone.trim()) payload.pic_phone = picPhone
      if (currentPicEmail !== undefined || picEmail.trim()) payload.pic_email = picEmail

      const response = await fetch(`/api/kmz/profile/${encodeURIComponent(kmzId)}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const result = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(result.error || 'Error al guardar')

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
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Editar ficha del campo</DialogTitle>
          {kmzFileName && (
            <div className="mt-3 rounded-md border border-border/70 bg-secondary/30 p-3">
              <p className="text-xs text-muted-foreground">Archivo fuente KMZ</p>
              <p className="mt-1 break-all font-mono text-xs font-medium text-foreground">{kmzFileName}</p>
            </div>
          )}
        </DialogHeader>

        <div className="space-y-4">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
              {error}
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="displayName">Nombre operativo del campo</Label>
            <Input
              id="displayName"
              placeholder={kmzFileName || "Nombre visible"}
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Cambia sólo el nombre visible. El nombre original del archivo KMZ se conserva como fuente.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="owner">Propietario</Label>
            <Input
              id="owner"
              placeholder="Nombre del propietario"
              value={owner}
              onChange={(e) => setOwner(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="pic">Responsable</Label>
            <Input
              id="pic"
              placeholder="Nombre del contacto principal"
              value={pic}
              onChange={(e) => setPic(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="picPhone">Teléfono</Label>
            <Input
              id="picPhone"
              placeholder="+56 9 1234 5678"
              value={picPhone}
              onChange={(e) => setPicPhone(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="picEmail">Email</Label>
            <Input
              id="picEmail"
              type="email"
              placeholder="contacto@ejemplo.com"
              value={picEmail}
              onChange={(e) => setPicEmail(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="googleDocsLink">Google Docs</Label>
            <Input
              id="googleDocsLink"
              placeholder="https://docs.google.com/..."
              value={googleDocsLink}
              onChange={(e) => setGoogleDocsLink(e.target.value)}
              className="font-mono text-xs"
            />
          </div>

          <div className="flex gap-2 pt-4">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={saving}
              className="flex-1"
            >
              Cancelar
            </Button>
            <Button
              onClick={handleSave}
              disabled={saving}
              className="flex-1"
            >
              {saving ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Guardando...
                </>
              ) : (
                'Guardar'
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
