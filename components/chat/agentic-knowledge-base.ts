interface KnowledgeCategory {
  name: string
  keywords: string[]
  responses: string[]
}

const knowledgeBase: KnowledgeCategory[] = [
  {
    name: "google_drive",
    keywords: ["drive", "google", "carpetas", "folders", "archivos", "files", "documentos", "documents"],
    responses: [
      "Puedo ayudarte a explorar los datos almacenados en Google Drive. Tengo acceso a todas las carpetas, documentos y archivos KMZ de tu cuenta. ¿Qué información específica necesitas?",
      "Estoy conectado a tu Google Drive y puedo buscar documentos, listar carpetas, analizar archivos KMZ y proporcionar información sobre cualquier dato almacenado. ¿Qué te gustaría consultar?",
      "Tengo acceso completo a tu Google Drive. Puedo ayudarte a encontrar documentos específicos, explorar la estructura de carpetas o analizar archivos KMZ. ¿Qué necesitas buscar?",
    ],
  },
  {
    name: "kmz_files",
    keywords: ["kmz", "mapa", "map", "coordenadas", "coordinates", "polígono", "polygon", "región", "region"],
    responses: [
      "Los archivos KMZ contienen información geográfica de propiedades. Puedo mostrarte qué archivos KMZ están disponibles, en qué regiones se encuentran, y sus coordenadas. ¿Qué región te interesa?",
      "Tenemos archivos KMZ organizados por región (Los Lagos, Los Ríos, La Araucanía, etc.). Cada archivo contiene polígonos con límites de propiedades y coordenadas. ¿Quieres ver los archivos de alguna región específica?",
      "Los archivos KMZ están almacenados en Supabase y organizados por región. Puedo darte información sobre cualquier archivo: nombre, ubicación, coordenadas, y cantidad de puntos. ¿Qué archivo necesitas consultar?",
    ],
  },
  {
    name: "buscar_datos",
    keywords: ["buscar", "search", "encontrar", "find", "listar", "list", "mostrar", "show"],
    responses: [
      "Puedo buscar en todos los documentos y archivos de Google Drive. ¿Qué tipo de información estás buscando? Puedo buscar por nombre de archivo, contenido, carpeta o tipo de documento.",
      "Para buscar datos específicos, puedo filtrar por: nombre de archivo, ubicación (carpeta), tipo de archivo, fecha de creación, o contenido. ¿Qué criterio de búsqueda prefieres?",
      "Tengo capacidad de búsqueda avanzada en Google Drive. Puedo encontrar documentos por palabras clave, listar archivos en carpetas específicas, o filtrar por tipo. ¿Qué necesitas encontrar?",
    ],
  },
  {
    name: "estadisticas",
    keywords: ["cuántos", "how many", "total", "cantidad", "count", "estadísticas", "statistics", "resumen", "summary"],
    responses: [
      "Puedo proporcionarte estadísticas sobre tus datos: cantidad total de archivos, distribución por carpetas, archivos KMZ por región, tamaño total de almacenamiento, etc. ¿Qué estadística te interesa?",
      "Tengo acceso a métricas completas de tu Google Drive: número de documentos, archivos KMZ por región, distribución de tipos de archivo, y más. ¿Qué información estadística necesitas?",
      "Puedo generar resúmenes estadísticos de tus datos: archivos por carpeta, KMZ por región, documentos por tipo, fechas de creación, etc. ¿Qué resumen te gustaría ver?",
    ],
  },
  {
    name: "ayuda",
    keywords: [
      "ayuda",
      "help",
      "cómo",
      "how",
      "qué puedes",
      "what can",
      "funciones",
      "functions",
      "capacidades",
      "capabilities",
    ],
    responses: [
      "Puedo ayudarte con: 1) Buscar documentos en Google Drive, 2) Listar archivos y carpetas, 3) Consultar archivos KMZ por región, 4) Proporcionar estadísticas de datos, 5) Explorar la estructura de carpetas. ¿Qué te gustaría hacer?",
      "Mis capacidades incluyen: búsqueda de documentos, exploración de carpetas, análisis de archivos KMZ, estadísticas de datos, y consultas sobre información almacenada en Google Drive. ¿En qué puedo asistirte?",
      "Estoy diseñado para ayudarte a navegar y consultar tus datos en Google Drive. Puedo buscar archivos, listar carpetas, analizar KMZ, y responder preguntas sobre tu información almacenada. ¿Qué necesitas?",
    ],
  },
]

export async function getAgenticResponse(userMessage: string): Promise<string> {
  const message = userMessage.toLowerCase()

  // Find the best matching category based on keywords
  let bestMatch: { category: KnowledgeCategory; score: number } | null = null

  for (const category of knowledgeBase) {
    const matchingKeywords = category.keywords.filter((keyword) => message.includes(keyword.toLowerCase()))

    if (matchingKeywords.length > 0) {
      const score = matchingKeywords.length / category.keywords.length
      if (!bestMatch || score > bestMatch.score) {
        bestMatch = { category, score }
      }
    }
  }

  if (bestMatch) {
    // Return a random response from the best matching category
    const responses = bestMatch.category.responses
    return responses[Math.floor(Math.random() * responses.length)]
  }

  // Default responses for unmatched queries
  const defaultResponses = [
    "Gracias por tu consulta. Soy el asistente de datos de Google Drive y estoy aquí para ayudarte a buscar documentos, explorar carpetas, consultar archivos KMZ y proporcionar estadísticas. ¿Qué información necesitas?",
    "Entiendo que tienes una consulta sobre tus datos. Puedo ayudarte a buscar archivos, listar carpetas, analizar archivos KMZ por región, o proporcionar estadísticas. ¿Qué te interesa consultar?",
    "¡Hola! Estoy aquí para asistirte con tus datos en Google Drive. Puedo buscar documentos, explorar carpetas, consultar archivos KMZ organizados por región, y más. ¿En qué puedo ayudarte específicamente?",
  ]

  return defaultResponses[Math.floor(Math.random() * defaultResponses.length)]
}
