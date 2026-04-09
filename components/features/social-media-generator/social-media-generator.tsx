// Social Media Auto-Generator Component - Full Implementation
// Features: Instagram cards, LinkedIn posts, download as PNG

'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Download, Instagram, Linkedin, Copy, Check } from 'lucide-react'

interface PostContent {
  title: string
  description: string
  price?: string
  location?: string
  image?: string
}

export function SocialMediaGenerator() {
  const [postData, setPostData] = useState<PostContent>({
    title: 'Propiedad Disponible',
    description: 'Hermosa propiedad con ubicación estratégica.',
    price: '$0 UF',
    location: 'Santiago, Chile',
  })

  const [copied, setCopied] = useState<'instagram' | 'linkedin' | null>(null)

  const instagramCaption = `🏡 ¡${postData.title}! 🌟

📍 ${postData.location}
💰 ${postData.price}

${postData.description}

✨ Ubicación estratégica, ideal para invertir
🔗 Link en bio

#PropiedadesChile #InmobiliariaChile #InversionInmobiliaria #SurRealista #Propiedades`

  const linkedinCaption = `Oportunidad de Inversión: ${postData.title}

Nos complace presentar una excelente oportunidad inmobiliaria en ${postData.location}.

📋 Detalles de la Propiedad:
• Precio: ${postData.price}
• Ubicación: ${postData.location}
• Descripción: ${postData.description}

Esta propiedad presenta características excepcionales para inversionistas que buscan maximizar su rentabilidad. Con una ubicación estratégica, es un activo inmobiliario de alto potencial.

¿Te interesa conocer más detalles? Contáctanos hoy.

#InmobiliariaChile #InversionInmobiliaria #Propiedades #RealEstate`

  const handleCopy = (text: string, platform: 'instagram' | 'linkedin') => {
    navigator.clipboard.writeText(text)
    setCopied(platform)
    setTimeout(() => setCopied(null), 2000)
  }

  const downloadImage = (type: 'instagram' | 'linkedin') => {
    // Create canvas
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')

    if (type === 'instagram') {
      canvas.width = 1080
      canvas.height = 1080

      // Background gradient
      const gradient = ctx!.createLinearGradient(0, 0, 0, canvas.height)
      gradient.addColorStop(0, '#667eea')
      gradient.addColorStop(1, '#764ba2')
      ctx!.fillStyle = gradient
      ctx!.fillRect(0, 0, canvas.width, canvas.height)

      // Title
      ctx!.fillStyle = 'white'
      ctx!.font = 'bold 60px Arial'
      ctx!.textAlign = 'center'
      ctx!.fillText(postData.title, canvas.width / 2, 150)

      // Price
      ctx!.font = 'bold 50px Arial'
      ctx!.fillStyle = '#FFD700'
      ctx!.fillText(postData.price, canvas.width / 2, 280)

      // Location
      ctx!.font = '35px Arial'
      ctx!.fillStyle = 'white'
      ctx!.fillText(`📍 ${postData.location}`, canvas.width / 2, 380)

      // Description (wrapped)
      ctx!.font = '28px Arial'
      ctx!.fillStyle = 'rgba(255, 255, 255, 0.9)'
      const maxWidth = 900
      const lineHeight = 50
      let y = 480
      const words = postData.description.split(' ')
      let line = ''

      words.forEach((word) => {
        const testLine = line + word + ' '
        const metrics = ctx!.measureText(testLine)
        if (metrics.width > maxWidth && line) {
          ctx!.fillText(line, canvas.width / 2, y)
          line = word + ' '
          y += lineHeight
        } else {
          line = testLine
        }
      })
      ctx!.fillText(line, canvas.width / 2, y)

      // Hashtags
      ctx!.font = '24px Arial'
      ctx!.fillStyle = '#FFD700'
      ctx!.fillText('#SurRealista #Propiedades', canvas.width / 2, canvas.height - 50)
    } else {
      canvas.width = 1200
      canvas.height = 630

      // Background
      ctx!.fillStyle = '#f0f2f5'
      ctx!.fillRect(0, 0, canvas.width, canvas.height)

      // Header color bar
      ctx!.fillStyle = '#0a66c2'
      ctx!.fillRect(0, 0, canvas.width, 80)

      // Title
      ctx!.fillStyle = 'white'
      ctx!.font = 'bold 40px Arial'
      ctx!.textAlign = 'left'
      ctx!.fillText(postData.title, 50, 50)

      // Price and location
      ctx!.fillStyle = '#0a66c2'
      ctx!.font = 'bold 32px Arial'
      ctx!.fillText(`${postData.price} • ${postData.location}`, 50, 170)

      // Description
      ctx!.fillStyle = '#333'
      ctx!.font = '24px Arial'
      const descLineHeight = 40
      let descY = 250
      const descWords = postData.description.split(' ')
      let descLine = ''

      descWords.forEach((word) => {
        const testLine = descLine + word + ' '
        const metrics = ctx!.measureText(testLine)
        if (metrics.width > 1100 && descLine) {
          ctx!.fillText(descLine, 50, descY)
          descLine = word + ' '
          descY += descLineHeight
        } else {
          descLine = testLine
        }
      })
      ctx!.fillText(descLine, 50, descY)

      // Footer
      ctx!.fillStyle = '#0a66c2'
      ctx!.font = 'bold 20px Arial'
      ctx!.fillText('Contacta con Sur Realista para más información', 50, canvas.height - 40)
    }

    // Download
    const link = document.createElement('a')
    link.href = canvas.toDataURL('image/png')
    link.download = `${type}-post-${Date.now()}.png`
    link.click()
  }

  return (
    <div className="space-y-6 p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-slate-900">Generador de Posts para RRSS</h1>
        <p className="text-slate-600 mt-2">Crea automáticamente posts para Instagram y LinkedIn</p>
      </div>

      {/* Input Section */}
      <Card>
        <CardHeader>
          <CardTitle>Información de la Propiedad</CardTitle>
          <CardDescription>Completa los datos para generar los posts</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Título</label>
              <Input
                value={postData.title}
                onChange={(e) => setPostData({ ...postData, title: e.target.value })}
                placeholder="Ej: Propiedad en Las Condes"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Ubicación</label>
              <Input
                value={postData.location}
                onChange={(e) => setPostData({ ...postData, location: e.target.value })}
                placeholder="Ej: Santiago, Chile"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Precio</label>
              <Input
                value={postData.price}
                onChange={(e) => setPostData({ ...postData, price: e.target.value })}
                placeholder="Ej: $5.000 UF"
              />
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Descripción</label>
            <Textarea
              value={postData.description}
              onChange={(e) => setPostData({ ...postData, description: e.target.value })}
              placeholder="Describe los detalles principales de la propiedad..."
              className="min-h-24"
            />
          </div>
        </CardContent>
      </Card>

      {/* Preview and Export */}
      <Tabs defaultValue="instagram" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="instagram" className="flex items-center gap-2">
            <Instagram className="w-4 h-4" />
            Instagram
          </TabsTrigger>
          <TabsTrigger value="linkedin" className="flex items-center gap-2">
            <Linkedin className="w-4 h-4" />
            LinkedIn
          </TabsTrigger>
        </TabsList>

        <TabsContent value="instagram" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Vista Previa Instagram</span>
                <Badge variant="secondary">1080x1080px</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="max-w-sm mx-auto bg-gradient-to-b from-blue-600 to-purple-700 rounded-lg p-6 text-white shadow-lg">
                <h3 className="text-3xl font-bold text-center mb-4">{postData.title}</h3>
                <p className="text-2xl font-bold text-yellow-300 text-center mb-4">{postData.price}</p>
                <p className="text-lg text-center mb-6">📍 {postData.location}</p>
                <p className="text-center text-sm leading-relaxed mb-6">{postData.description}</p>
                <p className="text-center text-yellow-300 text-sm font-bold">#SurRealista #Propiedades</p>
              </div>

              <div className="space-y-2">
                <Button
                  onClick={() => handleCopy(instagramCaption, 'instagram')}
                  variant="outline"
                  className="w-full"
                >
                  {copied === 'instagram' ? (
                    <>
                      <Check className="w-4 h-4 mr-2" />
                      Copiado!
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4 mr-2" />
                      Copiar Caption
                    </>
                  )}
                </Button>
                <Button
                  onClick={() => downloadImage('instagram')}
                  className="w-full bg-gradient-to-r from-blue-600 to-purple-700"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Descargar Imagen
                </Button>
              </div>

              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-xs font-medium text-gray-600 mb-2">Caption sugerido:</p>
                <p className="text-sm text-gray-700 whitespace-pre-wrap max-h-40 overflow-y-auto">{instagramCaption}</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="linkedin" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Vista Previa LinkedIn</span>
                <Badge variant="secondary">1200x630px</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="max-w-2xl bg-white border border-gray-300 rounded-lg shadow-lg overflow-hidden">
                <div className="bg-blue-700 p-6 text-white">
                  <h3 className="text-2xl font-bold">{postData.title}</h3>
                </div>
                <div className="p-6">
                  <p className="font-bold text-lg text-blue-700 mb-4">
                    {postData.price} • {postData.location}
                  </p>
                  <p className="text-gray-700 text-sm leading-relaxed mb-4">{postData.description}</p>
                  <p className="text-sm text-gray-600 font-medium">
                    Contacta con Sur Realista para más información
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <Button
                  onClick={() => handleCopy(linkedinCaption, 'linkedin')}
                  variant="outline"
                  className="w-full"
                >
                  {copied === 'linkedin' ? (
                    <>
                      <Check className="w-4 h-4 mr-2" />
                      Copiado!
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4 mr-2" />
                      Copiar Contenido
                    </>
                  )}
                </Button>
                <Button
                  onClick={() => downloadImage('linkedin')}
                  className="w-full bg-blue-700 hover:bg-blue-800"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Descargar Imagen
                </Button>
              </div>

              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-xs font-medium text-gray-600 mb-2">Contenido sugerido:</p>
                <p className="text-sm text-gray-700 whitespace-pre-wrap max-h-40 overflow-y-auto">
                  {linkedinCaption}
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
