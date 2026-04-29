'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { MessageCircle, Send, Copy, Check, ExternalLink } from 'lucide-react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

interface WhatsAppTemplate {
  id: string
  name: string
  content: string
  variables: string[]
}

const WHATSAPP_TEMPLATES: WhatsAppTemplate[] = [
  {
    id: '1',
    name: 'Presentación de Propiedad',
    content: 'Hola {{nombre}}, te comparto la ficha de {{propiedad}} en {{ubicacion}}. Presupuesto: {{precio}} UF. ¿Te interesa ver más detalles?',
    variables: ['nombre', 'propiedad', 'ubicacion', 'precio'],
  },
  {
    id: '2',
    name: 'Seguimiento Post-Visita',
    content: '¡Hola {{nombre}}! ¿Qué te pareció {{propiedad}}? Estoy disponible para resolver tus dudas. Llamemos mañana a las {{hora}}.',
    variables: ['nombre', 'propiedad', 'hora'],
  },
  {
    id: '3',
    name: 'Alerta de Precio Bajado',
    content: '{{nombre}}, bajamos el precio de {{propiedad}} a {{nuevo_precio}} UF (antes {{precio_anterior}}). Es tu oportunidad. ¿Hablamos?',
    variables: ['nombre', 'propiedad', 'nuevo_precio', 'precio_anterior'],
  },
  {
    id: '4',
    name: 'Recordatorio de Promesa',
    content: 'Recordatorio: Tu promesa de compraventa vence el {{fecha}}. ¿Necesitas ayuda con la documentación?',
    variables: ['fecha'],
  },
]

export function WhatsAppBusinessIntegration() {
  const [selectedTemplate, setSelectedTemplate] = useState<WhatsAppTemplate | null>(null)
  const [templateVariables, setTemplateVariables] = useState<Record<string, string>>({})
  const [phoneNumber, setPhoneNumber] = useState('')
  const [customMessage, setCustomMessage] = useState('')
  const [copiedId, setCopiedId] = useState<string | null>(null)

  const generateMessage = () => {
    if (!selectedTemplate) return ''
    let message = selectedTemplate.content
    selectedTemplate.variables.forEach((variable) => {
      const value = templateVariables[variable] || `{{${variable}}}`
      message = message.replace(`{{${variable}}}`, value)
    })
    return message
  }

  const openWhatsApp = (phone: string, message: string) => {
    if (!phone.startsWith('+')) {
      phone = '+56' + phone.replace(/^0/, '')
    }
    const encodedMessage = encodeURIComponent(message)
    window.open(`https://wa.me/${phone.replace(/\D/g, '')}?text=${encodedMessage}`, '_blank')
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
  }

  const currentMessage = generateMessage()

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageCircle className="w-5 h-5 text-green-600" />
            WhatsApp Web - Mensajes Directos
          </CardTitle>
          <CardDescription>Envía mensajes a través de WhatsApp Web sin necesidad de configurar API</CardDescription>
        </CardHeader>
      </Card>

      <Tabs defaultValue="templates" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="templates">Plantillas</TabsTrigger>
          <TabsTrigger value="custom">Mensaje Personalizado</TabsTrigger>
        </TabsList>

        <TabsContent value="templates" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Plantillas Predefinidas</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                {WHATSAPP_TEMPLATES.map((template) => (
                  <Button
                    key={template.id}
                    variant={selectedTemplate?.id === template.id ? 'default' : 'outline'}
                    className="w-full justify-start text-left h-auto p-4"
                    onClick={() => {
                      setSelectedTemplate(template)
                      setTemplateVariables({})
                    }}
                  >
                    <div className="flex flex-col items-start gap-1">
                      <span className="font-medium">{template.name}</span>
                      <span className="text-xs opacity-70">{template.content.substring(0, 60)}...</span>
                    </div>
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>

          {selectedTemplate && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Completar Variables</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {selectedTemplate.variables.map((variable) => (
                  <div key={variable} className="space-y-2">
                    <label className="text-sm font-medium capitalize">{variable.replace(/_/g, ' ')}</label>
                    <Input
                      placeholder={`Ingresa ${variable}`}
                      value={templateVariables[variable] || ''}
                      onChange={(e) =>
                        setTemplateVariables({
                          ...templateVariables,
                          [variable]: e.target.value,
                        })
                      }
                    />
                  </div>
                ))}

                <div className="space-y-2">
                  <label className="text-sm font-medium">Número Teléfono (+56 o sin 0)</label>
                  <Input
                    placeholder="+56912345678 o 912345678"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                  />
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-2">
                  <p className="text-sm font-medium text-blue-900">Vista Previa del Mensaje:</p>
                  <p className="text-sm text-blue-800 whitespace-pre-wrap">{currentMessage}</p>
                </div>

                <div className="flex gap-2">
                  <Button
                    onClick={() => {
                      if (phoneNumber && currentMessage) {
                        openWhatsApp(phoneNumber, currentMessage)
                      }
                    }}
                    disabled={!phoneNumber || !currentMessage}
                    className="flex-1 bg-green-600 hover:bg-green-700"
                  >
                    <ExternalLink className="w-4 h-4 mr-2" />
                    Abrir WhatsApp Web
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      copyToClipboard(currentMessage)
                      setCopiedId('message')
                      setTimeout(() => setCopiedId(null), 2000)
                    }}
                  >
                    {copiedId === 'message' ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="custom" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Mensaje Personalizado</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Número Teléfono</label>
                <Input
                  placeholder="+56912345678 o 912345678"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Mensaje</label>
                <Textarea
                  placeholder="Escribe tu mensaje aquí..."
                  value={customMessage}
                  onChange={(e) => setCustomMessage(e.target.value)}
                  rows={5}
                />
                <p className="text-xs text-gray-500">{customMessage.length} caracteres</p>
              </div>

              <div className="flex gap-2">
                <Button
                  onClick={() => {
                    if (phoneNumber && customMessage) {
                      openWhatsApp(phoneNumber, customMessage)
                    }
                  }}
                  disabled={!phoneNumber || !customMessage}
                  className="flex-1 bg-green-600 hover:bg-green-700"
                >
                  <ExternalLink className="w-4 h-4 mr-2" />
                  Abrir WhatsApp Web
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    copyToClipboard(customMessage)
                    setCopiedId('custom')
                    setTimeout(() => setCopiedId(null), 2000)
                  }}
                >
                  {copiedId === 'custom' ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Alert className="bg-green-50 border-green-200">
        <MessageCircle className="h-4 w-4 text-green-600" />
        <AlertDescription className="text-green-800">
          Los mensajes se abren en WhatsApp Web. Solo necesitas tener WhatsApp Web o la app de escritorio sincronizada con tu teléfono.
        </AlertDescription>
      </Alert>
    </div>
  )
}

  const sendMessage = () => {
    if (!newMessage.trim()) return

    const message: WhatsAppMessage = {
      id: Date.now().toString(),
      phone: selectedPhone,
      name: 'You',
      message: newMessage,
      timestamp: new Date(),
      direction: 'sent',
      status: 'pending',
    }

    setMessages([...messages, message])
    setNewMessage('')

    // TODO: Integrar WhatsApp Business API aquí
    // await whatsappService.sendMessage(selectedPhone, newMessage)
    console.log('[WhatsApp] Message ready to send:', message)
  }

  const sendTemplate = (templateId: string) => {
    const template = WHATSAPP_TEMPLATES.find((t) => t.id === templateId)
    if (!template) return

    let content = template.content
    template.variables.forEach((variable) => {
      content = content.replace(`{{${variable}}}`, templateVariables[variable] || `{{${variable}}}`)
    })

    const message: WhatsAppMessage = {
      id: Date.now().toString(),
      phone: selectedPhone,
      name: 'You',
      message: content,
      timestamp: new Date(),
      direction: 'sent',
      status: 'pending',
    }

    setMessages([...messages, message])
    setTemplateVariables({})

    // TODO: Integrar WhatsApp Business API
    // await whatsappService.sendTemplateMessage(selectedPhone, template.id, templateVariables)
    console.log('[WhatsApp] Template message ready to send:', message)
  }

  return (
    <div className="space-y-6 p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-slate-900">WhatsApp Business Integration</h1>
        <p className="text-slate-600 mt-2">Chat unificado con clientes a través de WhatsApp</p>
      </div>

      <Alert className="border-amber-200 bg-amber-50">
        <AlertCircle className="h-4 w-4 text-amber-600" />
        <AlertDescription className="text-amber-800">
          Esta integración está lista para conectar la API de WhatsApp Business. Se necesita configurar credenciales de Meta en Settings.
        </AlertDescription>
      </Alert>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Chat Area */}
        <div className="lg:col-span-2 space-y-4">
          <Card>
            <CardHeader className="border-b">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Chat con Cliente</CardTitle>
                  <CardDescription>{selectedPhone}</CardDescription>
                </div>
                <Badge variant="outline">
                  <MessageCircle className="w-3 h-3 mr-1" />
                  Listo para conectar
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="p-4">
              <div className="h-96 overflow-y-auto mb-4 space-y-3 border rounded-lg p-4 bg-slate-50">
                {messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex ${msg.direction === 'sent' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-xs px-4 py-2 rounded-lg ${
                        msg.direction === 'sent'
                          ? 'bg-green-500 text-white'
                          : 'bg-slate-200 text-slate-900'
                      }`}
                    >
                      <p className="text-sm">{msg.message}</p>
                      <p className="text-xs mt-1 opacity-75">
                        {msg.timestamp.toLocaleTimeString('es-CL', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Message Input */}
              <div className="flex gap-2">
                <Textarea
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault()
                      sendMessage()
                    }
                  }}
                  placeholder="Escribe tu mensaje..."
                  className="min-h-20"
                />
                <Button
                  onClick={sendMessage}
                  disabled={!newMessage.trim()}
                  size="sm"
                  className="self-end bg-green-600 hover:bg-green-700"
                >
                  <Send className="w-4 h-4" />
                </Button>
              </div>

              <p className="text-xs text-slate-500 mt-2">
                Presiona Shift+Enter para nueva línea, Enter para enviar
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Templates Sidebar */}
        <div>
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Templates</CardTitle>
              <CardDescription>Mensajes pre-aprobados</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {WHATSAPP_TEMPLATES.map((template) => (
                <Card
                  key={template.id}
                  className="p-3 border cursor-pointer hover:border-green-500 hover:bg-green-50 transition"
                >
                  <p className="font-semibold text-sm mb-2">{template.name}</p>
                  <p className="text-xs text-slate-600 mb-3 line-clamp-2">{template.content}</p>

                  {template.variables.length > 0 && (
                    <div className="space-y-2 mb-3">
                      {template.variables.map((variable) => (
                        <Input
                          key={variable}
                          placeholder={variable}
                          size="sm"
                          value={templateVariables[variable] || ''}
                          onChange={(e) =>
                            setTemplateVariables({
                              ...templateVariables,
                              [variable]: e.target.value,
                            })
                          }
                          className="text-xs"
                        />
                      ))}
                    </div>
                  )}

                  <Button
                    size="sm"
                    variant="outline"
                    className="w-full text-xs"
                    onClick={() => sendTemplate(template.id)}
                  >
                    <Send className="w-3 h-3 mr-1" />
                    Enviar
                  </Button>
                </Card>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>

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
            <h3 className="font-semibold text-sm mb-2">Para activar WhatsApp Business:</h3>
            <ol className="text-sm space-y-2 list-decimal list-inside text-slate-700">
              <li>Ve a Settings → Integrations</li>
              <li>Conecta tu cuenta de Meta/WhatsApp</li>
              <li>Autoriza acceso a WhatsApp Business API</li>
              <li>Obtén tu Business Account ID y Access Token</li>
              <li>Configura números de teléfono autorizados</li>
              <li>Vuelve aquí y haz clic en "Activar"</li>
            </ol>
          </div>
          <Button
            disabled
            className="w-full bg-blue-600"
            title="Requeriere configuración de Meta API"
          >
            <Check className="w-4 h-4 mr-2" />
            Activar WhatsApp Business API
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
