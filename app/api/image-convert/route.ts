import { type NextRequest, NextResponse } from "next/server"
import sharp from "sharp"

export const dynamic = "force-dynamic"

export async function GET(request: NextRequest) {
  try {
    // Obtener parámetros de la URL
    const url = request.nextUrl.searchParams.get("url")
    const format = request.nextUrl.searchParams.get("format") || "webp"
    const quality = Number.parseInt(request.nextUrl.searchParams.get("quality") || "80", 10)
    const width = request.nextUrl.searchParams.get("width")
      ? Number.parseInt(request.nextUrl.searchParams.get("width") || "0", 10)
      : undefined

    // Validar URL
    if (!url) {
      return NextResponse.json({ error: "URL parameter is required" }, { status: 400 })
    }

    // Validar formato
    if (format !== "webp" && format !== "avif" && format !== "jpeg" && format !== "png") {
      return NextResponse.json({ error: "Format must be webp, avif, jpeg, or png" }, { status: 400 })
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

    // Convertir la imagen al formato deseado
    const imageBuffer = await imageResponse.arrayBuffer()
    let sharpInstance = sharp(Buffer.from(imageBuffer))

    // Redimensionar si se especifica un ancho
    if (width) {
      sharpInstance = sharpInstance.resize(width)
    }

    // Convertir al formato especificado
    let outputBuffer
    if (format === "webp") {
      outputBuffer = await sharpInstance.webp({ quality }).toBuffer()
    } else if (format === "avif") {
      outputBuffer = await sharpInstance.avif({ quality }).toBuffer()
    } else if (format === "jpeg") {
      outputBuffer = await sharpInstance.jpeg({ quality }).toBuffer()
    } else if (format === "png") {
      outputBuffer = await sharpInstance.png({ quality }).toBuffer()
    }

    // Configurar los headers de la respuesta
    const headers = new Headers()
    headers.set("Content-Type", `image/${format}`)
    headers.set("Cache-Control", "public, max-age=31536000, immutable")

    // Devolver la imagen convertida
    return new NextResponse(outputBuffer, {
      status: 200,
      headers,
    })
  } catch (error) {
    console.error("Error processing image:", error)
    return NextResponse.json({ error: "Failed to process image" }, { status: 500 })
  }
}
