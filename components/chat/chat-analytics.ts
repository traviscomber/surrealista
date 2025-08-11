interface ChatSession {
  sessionId: string
  startTime: Date
  endTime?: Date
  messageCount: number
  topics: string[]
  leadGenerated: boolean
  userSatisfaction?: number
}

interface ChatMessage {
  sessionId: string
  content: string
  sender: "user" | "bot"
  timestamp: Date
  topic?: string
}

interface LeadData {
  sessionId: string
  userMessage: string
  leadType: "contact_request" | "property_inquiry" | "financing_question"
  timestamp: Date
}

// In-memory storage (in production, use a proper database)
const chatSessions: Map<string, ChatSession> = new Map()
const chatMessages: ChatMessage[] = []
const leadData: LeadData[] = []

export function trackChatSession(sessionId: string, action: "opened" | "closed"): void {
  if (action === "opened") {
    chatSessions.set(sessionId, {
      sessionId,
      startTime: new Date(),
      messageCount: 0,
      topics: [],
      leadGenerated: false,
    })
  } else if (action === "closed") {
    const session = chatSessions.get(sessionId)
    if (session) {
      session.endTime = new Date()
      chatSessions.set(sessionId, session)
    }
  }
}

export function trackMessage(sessionId: string, content: string, sender: "user" | "bot"): void {
  const message: ChatMessage = {
    sessionId,
    content,
    sender,
    timestamp: new Date(),
    topic: detectTopic(content),
  }

  chatMessages.push(message)

  // Update session message count
  const session = chatSessions.get(sessionId)
  if (session) {
    session.messageCount++
    if (message.topic && !session.topics.includes(message.topic)) {
      session.topics.push(message.topic)
    }
    chatSessions.set(sessionId, session)
  }
}

export function trackLeadGeneration(sessionId: string, userMessage: string, leadType: LeadData["leadType"]): void {
  const lead: LeadData = {
    sessionId,
    userMessage,
    leadType,
    timestamp: new Date(),
  }

  leadData.push(lead)

  // Mark session as lead generated
  const session = chatSessions.get(sessionId)
  if (session) {
    session.leadGenerated = true
    chatSessions.set(sessionId, session)
  }
}

function detectTopic(content: string): string {
  const topicKeywords = {
    propiedades: ["casa", "propiedad", "venta", "arriendo", "precio", "ubicacion"],
    financiamiento: ["credito", "hipotecario", "banco", "subsidio", "financiamiento"],
    tecnologia_ia: ["ia", "inteligencia", "artificial", "tecnologia", "algoritmo"],
    contacto: ["contacto", "agente", "telefono", "reunion", "cita", "hablar"],
    empresa: ["empresa", "sur-realista", "quienes", "somos", "historia"],
  }

  const lowerContent = content.toLowerCase()

  for (const [topic, keywords] of Object.entries(topicKeywords)) {
    if (keywords.some((keyword) => lowerContent.includes(keyword))) {
      return topic
    }
  }

  return "general"
}

export function getChatAnalytics() {
  const sessions = Array.from(chatSessions.values())
  const totalSessions = sessions.length
  const totalMessages = chatMessages.length
  const totalLeads = leadData.length

  // Calculate average session duration
  const completedSessions = sessions.filter((s) => s.endTime)
  const avgDuration =
    completedSessions.length > 0
      ? completedSessions.reduce((sum, s) => sum + (s.endTime!.getTime() - s.startTime.getTime()), 0) /
        completedSessions.length /
        1000 /
        60
      : 0

  // Topic distribution
  const topicCounts: Record<string, number> = {}
  chatMessages.forEach((msg) => {
    if (msg.topic) {
      topicCounts[msg.topic] = (topicCounts[msg.topic] || 0) + 1
    }
  })

  // Peak hours analysis
  const hourCounts: Record<number, number> = {}
  chatMessages.forEach((msg) => {
    const hour = msg.timestamp.getHours()
    hourCounts[hour] = (hourCounts[hour] || 0) + 1
  })

  // Lead conversion rate
  const conversionRate = totalSessions > 0 ? (totalLeads / totalSessions) * 100 : 0

  return {
    totalSessions,
    totalMessages,
    totalLeads,
    avgDuration: Math.round(avgDuration * 100) / 100,
    conversionRate: Math.round(conversionRate * 100) / 100,
    topicDistribution: topicCounts,
    peakHours: hourCounts,
    recentSessions: sessions.slice(-10).reverse(),
    recentLeads: leadData.slice(-10).reverse(),
  }
}
