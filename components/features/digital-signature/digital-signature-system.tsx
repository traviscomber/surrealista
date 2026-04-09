'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  FileText,
  Send,
  CheckCircle,
  Clock,
  AlertCircle,
  Download,
  Share2,
  Signature,
  Eye,
  Copy,
} from 'lucide-react'

interface DocumentToSign {
  id: string
  name: string
  type: 'mandato' | 'promesa' | 'anexo'
  status: 'draft' | 'sent' | 'viewed' | 'signed' | 'expired'
  createdDate: Date
  expiryDate: Date
  signatories: {
    name: string
    email: string
    status: 'pending' | 'viewed' | 'signed'
    signedDate?: Date
  }[]
  signatureType: 'electronic' | 'advanced' | 'qualified'
}

const DOCUMENT_TEMPLATES = [
  {
    id: '1',
    name: 'Mandato de Venta Exclusivo',
    type: 'mandato' as const,
    content: `MANDATO DE VENTA EXCLUSIVO

Otorgante: [PROPIETARIO]
Apoderado: Sur Realista
Propiedad: [DIRECCIÓN - ROL: XXXXX-X]

Características:
- Superficie: [HECTÁREAS] hectáreas
- Precio de venta: [PRECIO] UF
- Exclusividad: 180 días
- Comisión: [PORCENTAJE]%

El otorgante faculta a Sur Realista para representarlo en la venta de la propiedad descrita.

Firma digital: _______________
Fecha: _______________`,
  },
  {
    id: '2',
    name: 'Promesa de Compraventa',
    type: 'promesa' as const,
    content: `PROMESA DE COMPRAVENTA

PARTE VENDEDORA: [VENDEDOR]
PARTE COMPRADORA: [COMPRADOR]
PROPIEDAD: [DIRECCIÓN - ROL: XXXXX-X]

PRECIO: [PRECIO] UF
FINANCIAMIENTO: [MODALIDAD]
PLAZO CIERRE: [DÍAS] días

Condiciones especiales:
[CONDICIONES]

Firma digital: _______________
Fecha: _______________`,
  },
  {
    id: '3',
    name: 'Anexo Mandato - Exclusividad',
    type: 'anexo' as const,
    content: `ANEXO AL MANDATO DE VENTA

Exclusividad ampliada por [DÍAS] días adicionales
Nuevas condiciones: [DESCRIPCIÓN]
Comisión ajustada: [PORCENTAJE]%

Firma digital: _______________
Fecha: _______________`,
  },
]

export function DigitalSignatureSystem() {
  const [documents, setDocuments] = useState<DocumentToSign[]>([
    {
      id: '1',
      name: 'Mandato Fundo Los Boldos',
      type: 'mandato',
      status: 'signed',
      createdDate: new Date('2024-05-20'),
      expiryDate: new Date('2024-11-20'),
      signatories: [
        { name: 'Juan Pérez', email: 'juan@example.com', status: 'signed', signedDate: new Date('2024-05-21') },
      ],
      signatureType: 'electronic',
    },
    {
      id: '2',
      name: 'Promesa San José',
      type: 'promesa',
      status: 'viewed',
      createdDate: new Date('2024-05-22'),
      expiryDate: new Date('2024-06-05'),
      signatories: [
        { name: 'María López', email: 'maria@example.com', status: 'viewed' },
        { name: 'Pedro Soto', email: 'pedro@example.com', status: 'pending' },
      ],
      signatureType: 'electronic',
    },
  ])

  const [selectedDocument, setSelectedDocument] = useState<DocumentToSign | null>(null)
  const [newSignatoryEmail, setNewSignatoryEmail] = useState('')
  const [newSignatoryName, setNewSignatoryName] = useState('')

  const getStatusColor = (status: DocumentToSign['status']) => {
    const colors = {
      draft: 'bg-gray-100 text-gray-800',
      sent: 'bg-blue-100 text-blue-800',
      viewed: 'bg-yellow-100 text-yellow-800',
      signed: 'bg-green-100 text-green-800',
      expired: 'bg-red-100 text-red-800',
    }
    return colors[status]
  }

  const getStatusIcon = (status: DocumentToSign['status']) => {
    const icons = {
      draft: <FileText className="w-4 h-4" />,
      sent: <Send className="w-4 h-4" />,
      viewed: <Eye className="w-4 h-4" />,
      signed: <CheckCircle className="w-4 h-4" />,
      expired: <AlertCircle className="w-4 h-4" />,
    }
    return icons[status]
  }

  const getStatusLabel = (status: DocumentToSign['status']) => {
    const labels = {
      draft: 'Borrador',
      sent: 'Enviado',
      viewed: 'Visualizado',
      signed: 'Firmado',
      expired: 'Expirado',
    }
    return labels[status]
  }

  const createNewDocument = (templateId: string) => {
    const template = DOCUMENT_TEMPLATES.find((t) => t.id === templateId)
    if (!template) return

    const newDoc: DocumentToSign = {
      id: Date.now().toString(),
      name: template.name,
      type: template.type,
      status: 'draft',
      createdDate: new Date(),
      expiryDate: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000), // 180 días
      signatories: [],
      signatureType: 'electronic',
    }

    setDocuments([...documents, newDoc])
    setSelectedDocument(newDoc)
  }

  const addSignatory = (docId: string) => {
    if (!newSignatoryEmail || !newSignatoryName) return

    const updatedDocs = documents.map((doc) => {
      if (doc.id === docId) {
        return {
          ...doc,
          signatories: [
            ...doc.signatories,
            { name: newSignatoryName, email: newSignatoryEmail, status: 'pending' },
          ],
        }
      }
      return doc
    })

    setDocuments(updatedDocs)
    setSelectedDocument(updatedDocs.find((d) => d.id === docId) || null)
    setNewSignatoryEmail('')
    setNewSignatoryName('')
  }

  const sendDocument = (docId: string) => {
    // TODO: Integrar DocuSign API
    // await docusignService.sendForSignature(document, signatories)
    const updatedDocs = documents.map((doc) => (doc.id === docId ? { ...doc, status: 'sent' as const } : doc))
    setDocuments(updatedDocs)
    setSelectedDocument(updatedDocs.find((d) => d.id === docId) || null)
    console.log('[DocuSign] Document ready to send:', docId)
  }

  return (
    <div className="space-y-6 p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-slate-900">Sistema de Firma Digital</h1>
        <p className="text-slate-600 mt-2">Gestiona mandatos y contratos con firma electrónica</p>
      </div>

      <Alert className="border-amber-200 bg-amber-50">
        <AlertCircle className="h-4 w-4 text-amber-600" />
        <AlertDescription className="text-amber-800">
          Esta integración está lista para conectar DocuSign. Se necesita configurar credenciales de DocuSign en Settings.
        </AlertDescription>
      </Alert>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Documents List */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Documentos para Firmar</CardTitle>
              <CardDescription>Gestiona mandatos y contratos</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {documents.length === 0 ? (
                <p className="text-sm text-slate-500 text-center py-8">No hay documentos aún</p>
              ) : (
                documents.map((doc) => (
                  <Card
                    key={doc.id}
                    className="p-4 cursor-pointer hover:border-blue-500 transition"
                    onClick={() => setSelectedDocument(doc)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <FileText className="w-4 h-4 text-blue-600" />
                          <p className="font-semibold">{doc.name}</p>
                          <Badge className={getStatusColor(doc.status)}>
                            {getStatusIcon(doc.status)}
                            <span className="ml-1">{getStatusLabel(doc.status)}</span>
                          </Badge>
                        </div>
                        <p className="text-xs text-slate-500 mb-3">
                          Creado: {doc.createdDate.toLocaleDateString('es-CL')} | Vencimiento:{' '}
                          {doc.expiryDate.toLocaleDateString('es-CL')}
                        </p>
                        <div className="flex gap-2 flex-wrap">
                          {doc.signatories.map((sig, idx) => (
                            <Badge key={idx} variant="outline">
                              {sig.name} -{' '}
                              <span
                                className={
                                  sig.status === 'signed'
                                    ? 'text-green-600'
                                    : sig.status === 'viewed'
                                      ? 'text-yellow-600'
                                      : 'text-slate-600'
                                }
                              >
                                {sig.status === 'signed' ? '✓ Firmado' : sig.status === 'viewed' ? '👁️ Visto' : '⏳ Pendiente'}
                              </span>
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </div>
                  </Card>
                ))
              )}
            </CardContent>
          </Card>
        </div>

        {/* Templates & Actions */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Crear Documento</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {DOCUMENT_TEMPLATES.map((template) => (
                <Button
                  key={template.id}
                  variant="outline"
                  className="w-full justify-start text-left"
                  onClick={() => createNewDocument(template.id)}
                >
                  <FileText className="w-4 h-4 mr-2" />
                  <span className="text-xs">{template.name}</span>
                </Button>
              ))}
            </CardContent>
          </Card>

          {selectedDocument && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Acciones</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full justify-start"
                  disabled={selectedDocument.status !== 'draft'}
                >
                  <Eye className="w-4 h-4 mr-2" />
                  Previsualizar
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full justify-start"
                  disabled={selectedDocument.status !== 'draft'}
                >
                  <Download className="w-4 h-4 mr-2" />
                  Descargar
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full justify-start"
                  disabled={selectedDocument.status !== 'draft'}
                >
                  <Copy className="w-4 h-4 mr-2" />
                  Duplicar
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Document Editor */}
      {selectedDocument && (
        <Card>
          <CardHeader>
            <CardTitle>{selectedDocument.name}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Tabs defaultValue="signatories" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="signatories">Signatarios</TabsTrigger>
                <TabsTrigger value="content">Contenido</TabsTrigger>
              </TabsList>

              <TabsContent value="signatories" className="space-y-4">
                {/* Add Signatory */}
                {selectedDocument.status === 'draft' && (
                  <div className="space-y-3 p-4 bg-slate-50 rounded-lg">
                    <p className="font-semibold text-sm">Agregar Signatario</p>
                    <Input
                      placeholder="Nombre"
                      value={newSignatoryName}
                      onChange={(e) => setNewSignatoryName(e.target.value)}
                    />
                    <Input
                      placeholder="Email"
                      type="email"
                      value={newSignatoryEmail}
                      onChange={(e) => setNewSignatoryEmail(e.target.value)}
                    />
                    <Button
                      onClick={() => addSignatory(selectedDocument.id)}
                      size="sm"
                      className="w-full"
                      disabled={!newSignatoryEmail || !newSignatoryName}
                    >
                      Agregar
                    </Button>
                  </div>
                )}

                {/* Signatories List */}
                <div className="space-y-2">
                  {selectedDocument.signatories.map((sig, idx) => (
                    <Card key={idx} className="p-3">
                      <div className="flex justify-between items-center">
                        <div>
                          <p className="font-semibold text-sm">{sig.name}</p>
                          <p className="text-xs text-slate-600">{sig.email}</p>
                          {sig.signedDate && (
                            <p className="text-xs text-green-600 mt-1">
                              Firmado: {sig.signedDate.toLocaleDateString('es-CL')}
                            </p>
                          )}
                        </div>
                        <Badge
                          className={
                            sig.status === 'signed'
                              ? 'bg-green-100 text-green-800'
                              : sig.status === 'viewed'
                                ? 'bg-yellow-100 text-yellow-800'
                                : 'bg-slate-100 text-slate-800'
                          }
                        >
                          {sig.status === 'signed' ? '✓ Firmado' : sig.status === 'viewed' ? '👁️ Visto' : '⏳ Pendiente'}
                        </Badge>
                      </div>
                    </Card>
                  ))}
                </div>

                {/* Send Button */}
                {selectedDocument.status === 'draft' && selectedDocument.signatories.length > 0 && (
                  <Button
                    onClick={() => sendDocument(selectedDocument.id)}
                    className="w-full bg-blue-600 hover:bg-blue-700"
                  >
                    <Send className="w-4 h-4 mr-2" />
                    Enviar para Firma
                  </Button>
                )}
              </TabsContent>

              <TabsContent value="content">
                <div className="p-4 bg-slate-50 rounded-lg border border-slate-200 min-h-64">
                  <p className="text-sm text-slate-700 whitespace-pre-wrap font-mono text-xs">
                    [Contenido del documento - Se renderizaría desde DocuSign en producción]
                  </p>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      )}

      {/* Configuration Section */}
      <Card className="border-blue-200 bg-blue-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-blue-600" />
            Configuración Requerida
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h3 className="font-semibold text-sm mb-2">Para activar firma digital con DocuSign:</h3>
            <ol className="text-sm space-y-2 list-decimal list-inside text-slate-700">
              <li>Ve a Settings → Integrations</li>
              <li>Conecta tu cuenta de DocuSign</li>
              <li>Obtén tu DocuSign Account ID y API Key</li>
              <li>Configura los templates disponibles</li>
              <li>Autoriza los campos de firma</li>
              <li>Vuelve aquí y activa la integración</li>
            </ol>
          </div>
          <Button
            disabled
            className="w-full bg-blue-600"
            title="Requiere configuración de DocuSign API"
          >
            <Signature className="w-4 h-4 mr-2" />
            Activar DocuSign Integration
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
