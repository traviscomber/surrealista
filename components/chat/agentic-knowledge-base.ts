interface KnowledgeCategory {
  name: string
  keywords: string[]
  responses: string[]
}

const knowledgeBase: KnowledgeCategory[] = [
  {
    name: "empresa",
    keywords: ["empresa", "sur-realista", "quienes", "somos", "historia", "mision", "vision", "valores", "equipo"],
    responses: [
      "Sur-Realista es la inmobiliaria líder en el sur de Chile, especializada en propiedades premium en las regiones de Los Lagos, Los Ríos y La Araucanía. Fundada con la misión de conectar a las personas con su hogar ideal, combinamos experiencia local con tecnología de vanguardia.",
      "Somos una empresa innovadora que utiliza inteligencia artificial para ofrecer el mejor servicio inmobiliario del sur de Chile. Nuestro equipo de expertos conoce cada rincón de la región y está comprometido con encontrar la propiedad perfecta para cada cliente.",
      "Sur-Realista se distingue por su enfoque personalizado y uso de tecnología avanzada. Operamos en las ciudades más hermosas del sur: Puerto Varas, Pucón, Valdivia, Frutillar, Osorno y Chiloé, ofreciendo propiedades que van desde casas familiares hasta inversiones comerciales.",
    ],
  },
  {
    name: "ia_tecnologia",
    keywords: [
      "ia",
      "inteligencia",
      "artificial",
      "tecnologia",
      "algoritmo",
      "prediccion",
      "analisis",
      "automatico",
      "machine",
      "learning",
    ],
    responses: [
      "Nuestra IA utiliza algoritmos avanzados de machine learning para analizar el mercado inmobiliario en tiempo real. Con una precisión del 94.2%, puede predecir tendencias de precios, evaluar propiedades y recomendar las mejores opciones según tus necesidades específicas.",
      "La tecnología de Sur-Realista integra datos de múltiples fuentes: CIREN, SII, Banco Central de Chile y más. Esto nos permite ofrecer análisis predictivos, evaluaciones de riesgo y recomendaciones personalizadas que ninguna otra inmobiliaria en la región puede igualar.",
      "Nuestro sistema de IA procesa información geográfica, económica y social para identificar oportunidades de inversión, calcular el valor real de propiedades y predecir su potencial de revalorización. Es como tener un experto inmobiliario trabajando 24/7 para ti.",
    ],
  },
  {
    name: "propiedades",
    keywords: [
      "casa",
      "propiedad",
      "venta",
      "arriendo",
      "precio",
      "ubicacion",
      "metros",
      "dormitorios",
      "baños",
      "terreno",
      "disponible",
    ],
    responses: [
      "Tenemos más de 247 propiedades disponibles en el sur de Chile. Desde casas familiares en Puerto Varas ($120M-$300M) hasta cabañas de lujo en Pucón ($80M-$250M). También ofrecemos terrenos, departamentos y propiedades comerciales en ubicaciones premium.",
      "Nuestro catálogo incluye propiedades en las mejores ubicaciones: frente a lagos en Villarrica y Llanquihue, con vista al volcán en Pucón, casas patrimoniales en Valdivia, y propiedades rurales en Chiloé. Precios desde $45M hasta $500M según ubicación y características.",
      "Cada propiedad pasa por nuestro análisis de IA que evalúa potencial de revalorización, riesgos geológicos, accesibilidad y servicios. Te podemos mostrar propiedades que coincidan exactamente con tu presupuesto, preferencias de ubicación y estilo de vida.",
    ],
  },
  {
    name: "financiamiento",
    keywords: [
      "credito",
      "hipotecario",
      "financiamiento",
      "banco",
      "subsidio",
      "pie",
      "dividendo",
      "tasa",
      "interes",
      "prestamo",
    ],
    responses: [
      "Trabajamos con todos los bancos principales de Chile para conseguirte las mejores condiciones de crédito hipotecario. Tasas desde 3.5% anual, financiamiento hasta 90% del valor, y plazos de hasta 30 años. También te ayudamos con subsidios habitacionales DS1 y DS19.",
      "Nuestro equipo de asesores financieros te guía en todo el proceso: pre-aprobación de crédito, evaluación de subsidios disponibles, negociación de tasas preferenciales y tramitación completa. Tenemos convenios especiales que pueden ahorrarte hasta $2M en gastos operacionales.",
      "Ofrecemos simulaciones personalizadas de crédito, análisis de capacidad de pago y estrategias de financiamiento. Si eres primera vivienda, profesional joven o familia, tenemos opciones específicas que se adaptan a tu situación particular.",
    ],
  },
  {
    name: "contacto_agentes",
    keywords: ["contacto", "agente", "telefono", "email", "reunion", "visita", "cita", "hablar", "llamar", "whatsapp"],
    responses: [
      "¡Perfecto! Te conecto con nuestros agentes especializados. Para Puerto Varas y alrededores: María González (+56 9 8765 4321). Para Pucón y Villarrica: Carlos Mendoza (+56 9 8765 4322). Para Valdivia: Ana Rodríguez (+56 9 8765 4323). También puedes escribirnos a contacto@sur-realista.cl",
      "Nuestros agentes están disponibles de lunes a viernes 9:00-18:00 y sábados 10:00-14:00. Puedes agendar una cita llamando al +56 65 2234 567 o enviando WhatsApp al +56 9 8765 4320. Ofrecemos visitas presenciales y virtuales con tour 360°.",
      "Te puedo agendar una reunión con uno de nuestros expertos. ¿Prefieres una cita en nuestra oficina de Puerto Varas (Av. Costanera 1234), una visita a propiedades específicas, o una videollamada? Nuestros agentes son especialistas locales con más de 10 años de experiencia en la región.",
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
    "Gracias por tu consulta. Soy el asistente de Sur-Realista y estoy aquí para ayudarte con información sobre propiedades, financiamiento, nuestra tecnología IA y más. ¿Podrías ser más específico sobre lo que necesitas?",
    "Entiendo que tienes una consulta. Como especialista en el mercado inmobiliario del sur de Chile, puedo ayudarte con propiedades disponibles, opciones de financiamiento, análisis de inversión o conectarte con nuestros agentes. ¿Qué te interesa más?",
    "¡Hola! Estoy aquí para asistirte con todo lo relacionado a Sur-Realista. Puedo informarte sobre nuestras propiedades en Puerto Varas, Pucón, Valdivia y otras ciudades del sur, así como sobre nuestros servicios de IA. ¿En qué puedo ayudarte específicamente?",
  ]

  return defaultResponses[Math.floor(Math.random() * defaultResponses.length)]
}
