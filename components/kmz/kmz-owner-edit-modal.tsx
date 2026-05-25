'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { RefreshCw } from 'lucide-react'
import { createBrowserClient } from '@supabase/ssr'

interface KMZOwnerEditModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  kmzId: string
  currentOwner?: string
  currentPic?: string
  currentPicPhone?: string
  currentPicEmail?: string
  currentGoogleDocsLink?: string
  onSave?: () => void
}

export function KMZOwnerEditModal({
  open,
  onOpenChange,
  kmzId,
  currentOwner,
  currentPic,
  currentPicPhone,
  currentPicEmail,
  currentGoogleDocsLink,
  onSave,
}: KMZOwnerEditModalProps) {
  const [owner, setOwner] = useState(currentOwner || '')
  const [pic, setPic] = useState(currentPic || '')
  const [picPhone, setPicPhone] = useState(currentPicPhone || '')
  const [picEmail, setPicEmail] = useState(currentPicEmail || '')
  const [googleDocsLink, setGoogleDocsLink] = useState(currentGoogleDocsLink || '')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSave = async () => {
    try {
      setSaving(true)
      setError(null)

      const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      )

      const { error: updateError } = await supabase
        .from('kmz_collection')
        .update({
          owner: owner || null,
          pic: pic || null,
          pic_phone: picPhone || null,
          pic_email: picEmail || null,
          google_docs_link: googleDocsLink || null,
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
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Editar Dueño y Documentación del Campo</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
              {error}
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="owner">Dueño del Campo</Label>
            <Input
              id="owner"
              placeholder="Nombre del propietario"
              value={owner}
              onChange={(e) => setOwner(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="pic">Person In Charge (PIC)</Label>
            <Input
              id="pic"
              placeholder="Nombre del contacto principal"
              value={pic}
              onChange={(e) => setPic(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="picPhone">Teléfono PIC</Label>
            <Input
              id="picPhone"
              placeholder="+56 9 1234 5678"
              value={picPhone}
              onChange={(e) => setPicPhone(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="picEmail">Email PIC</Label>
            <Input
              id="picEmail"
              type="email"
              placeholder="contacto@ejemplo.com"
              value={picEmail}
              onChange={(e) => setPicEmail(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="googleDocsLink">Link Google Docs</Label>
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
              className="flex-1 bg-purple-600 hover:bg-purple-700"
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
