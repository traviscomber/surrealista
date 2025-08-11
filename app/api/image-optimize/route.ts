import { type NextRequest, NextResponse } from "next/server"
import sharp from "sharp"

export const dynamic = "force-dynamic"

export async function GET(request: NextRequest) {
  try {
    // Obtener parámetros de la URL
    const url = request.nextUrl.searchParams.get("url")
    const quality = Number.parseInt(request.nextUrl.searchParams.get("quality") || "80", 10)
    const width = request.nextUrl.searchParams.get("width")
      ? Number.parseInt(request.nextUrl.searchParams.get("width") || "0", 10)
      : undefined

    // Validar URL
    if (!url) {
      return NextResponse.json({ error: "URL parameter is required" }, { status: 400 })
    }

    // Obtener la imagen
    let imageResponse
    try {
      // Si la URL es relativa, convertirla a absoluta
      const absoluteUrl = url.startsWith("http")
        ? url
        : `${request.nextUrl.origin}${url.startsWith("/") ? "" : "/"}${url}`

      imageResponse = await fetch(absoluteUrl)

      if (!imageResponse.ok) {
        throw new Error(`Failed to fetch image: ${imageResponse.statusText}`)
      }
    } catch (error) {
      console.error("Error fetching image:", error)
      return NextResponse.json({ error: "Failed to fetch image" }, { status: 500 })
    }

    // Procesar la imagen
    const imageBuffer = await imageResponse.arrayBuffer()
    let sharpInstance = sharp(Buffer.from(imageBuffer))

    // Obtener información de la imagen
    const metadata = await sharpInstance.metadata()
    const format = metadata.format

    // Redimensionar si se especifica un ancho
    if (width) {
      sharpInstance = sharpInstance.resize(width)
    }

    // Optimizar según el formato original
    let outputBuffer
    let outputFormat = format

    if (format === "jpeg" || format === "jpg") {
      outputBuffer = await sharpInstance.jpeg({ quality }).toBuffer()
      outputFormat = "jpeg"
    } else if (format === "png") {
      outputBuffer = await sharpInstance.png({ quality }).toBuffer()
      outputFormat = "png"
    } else if (format === "webp") {
      outputBuffer = await sharpInstance.webp({ quality }).toBuffer()
      outputFormat = "webp"
    } else if (format === "avif") {
      outputBuffer = await sharpInstance.avif({ quality }).toBuffer()
      outputFormat = "avif"
    } else {
      // Para otros formatos, convertir a JPEG
      outputBuffer = await sharpInstance.jpeg({ quality }).toBuffer()
      outputFormat = "jpeg"
    }

    // Configurar los headers de la respuesta
    const headers = new Headers()
    headers.set("Content-Type", `image/${outputFormat}`)
    headers.set("Cache-Control", "public, max-age=31536000, immutable")

    // Devolver la imagen optimizada
    return new NextResponse(outputBuffer, {
      status: 200,
      headers,
    })
  } catch (error) {
    console.error("Error optimizing image:", error)
    return NextResponse.json({ error: "Failed to optimize image" }, { status: 500 })
  }
}
