'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import { Plus, Trash2, AlertCircle, CheckCircle2, Clock } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

const DEFAULT_DOCUMENTS = [
  { name: 'Título de Propiedad', category: 'legal' },
  { name: 'Certificado de Avalúo', category: 'legal' },
  { name: 'Certificado de No Afectación', category: 'legal' },
  { name: 'Fojas de Dominio', category: 'legal' },
  { name: 'Escritura Pública', category: 'legal' },
  { name: 'Permiso Municipal', category: 'municipal' },
  { name: 'Certificado AFICO', category: 'tax' },
  { name: 'Certificado del SII', category: 'tax' },
]

interface ChecklistItem {
  id: string
  name: string
  category: string
  completed: boolean
  due_date?: string
  notes?: string
}

interface DocumentChecklistProps {
  clientId?: string
  onUpdate?: (items: ChecklistItem[]) => void
}

export function DocumentChecklist({ clientId, onUpdate }: DocumentChecklistProps) {
  const [items, setItems] = useState<ChecklistItem[]>([])
  const [isOpen, setIsOpen] = useState(false)
  const [newDoc, setNewDoc] = useState({ name: '', category: 'legal' })

  useEffect(() => {
    // Inicializar con documentos por defecto
    const initialItems = DEFAULT_DOCUMENTS.map((doc, idx) => ({
      id: `${idx}-${Date.now()}`,
      ...doc,
      completed: false,
    }))
    setItems(initialItems)
  }, [])

  const toggleItem = (id: string) => {
    const updated = items.map((item) =>
      item.id === id ? { ...item, completed: !item.completed } : item
    )
    setItems(updated)
    onUpdate?.(updated)
  }

  const addDocument = () => {
    if (!newDoc.name.trim()) return

    const newItem: ChecklistItem = {
      id: `new-${Date.now()}`,
      name: newDoc.name,
      category: newDoc.category,
      completed: false,
    }

    const updated = [...items, newItem]
    setItems(updated)
    onUpdate?.(updated)
    setNewDoc({ name: '', category: 'legal' })
    setIsOpen(false)
  }

  const removeItem = (id: string) => {
    const updated = items.filter((item) => item.id !== id)
    setItems(updated)
    onUpdate?.(updated)
  }

  const completedCount = items.filter((item) => item.completed).length
  const completionPercentage = items.length > 0 ? Math.round((completedCount / items.length) * 100) : 0

  const getCategoryColor = (category: string) => {
    const colors = {
      legal: 'bg-blue-100 text-blue-800',
      municipal: 'bg-purple-100 text-purple-800',
      tax: 'bg-amber-100 text-amber-800',
    }
    return colors[category as keyof typeof colors] || 'bg-gray-100 text-gray-800'
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Documentación Legal</CardTitle>
        <CardDescription>
          Checklist de documentos requeridos - {completedCount} de {items.length} completados ({completionPercentage}%)
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="flex justify-between items-center text-sm">
            <span className="font-medium">Progreso</span>
            <span>{completionPercentage}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-green-500 h-2 rounded-full transition-all"
              style={{ width: `${completionPercentage}%` }}
            />
          </div>
        </div>

        {/* Documents List */}
        <div className="space-y-2 max-h-96 overflow-y-auto">
          {items.map((item) => (
            <div
              key={item.id}
              className="flex items-center gap-3 p-3 rounded-lg border hover:bg-gray-50 transition-colors"
            >
              <Checkbox
                checked={item.completed}
                onCheckedChange={() => toggleItem(item.id)}
                className="mt-1"
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className={item.completed ? 'line-through text-gray-400' : 'text-gray-900'}>
                    {item.name}
                  </span>
                  <Badge className={`text-xs ${getCategoryColor(item.category)}`}>{item.category}</Badge>
                </div>
                {item.notes && <p className="text-xs text-gray-500 mt-1">{item.notes}</p>}
              </div>
              {item.completed ? (
                <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0" />
              ) : (
                <Clock className="w-5 h-5 text-amber-500 flex-shrink-0" />
              )}
              <Button
                size="sm"
                variant="ghost"
                onClick={() => removeItem(item.id)}
                className="text-red-500 hover:text-red-700 flex-shrink-0"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          ))}
        </div>

        {/* Add Document Dialog */}
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" className="w-full" size="sm">
              <Plus className="w-4 h-4 mr-2" />
              Agregar Documento Personalizado
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Agregar Documento</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Nombre del Documento</label>
                <Input
                  placeholder="Ej: Permiso Sanitario"
                  value={newDoc.name}
                  onChange={(e) => setNewDoc({ ...newDoc, name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Categoría</label>
                <Select value={newDoc.category} onValueChange={(val) => setNewDoc({ ...newDoc, category: val })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="legal">Legal</SelectItem>
                    <SelectItem value="municipal">Municipal</SelectItem>
                    <SelectItem value="tax">Tributario</SelectItem>
                    <SelectItem value="other">Otro</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button onClick={addDocument} className="w-full">
                Agregar
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Status Summary */}
        <div className="grid grid-cols-3 gap-2 pt-2 border-t">
          <div className="text-center p-2 bg-blue-50 rounded">
            <p className="text-xs text-gray-600">Total</p>
            <p className="text-lg font-bold text-blue-600">{items.length}</p>
          </div>
          <div className="text-center p-2 bg-green-50 rounded">
            <p className="text-xs text-gray-600">Completados</p>
            <p className="text-lg font-bold text-green-600">{completedCount}</p>
          </div>
          <div className="text-center p-2 bg-amber-50 rounded">
            <p className="text-xs text-gray-600">Pendientes</p>
            <p className="text-lg font-bold text-amber-600">{items.length - completedCount}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
