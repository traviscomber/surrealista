/**
 * KMZ Completeness Score Calculator
 * Evaluates data richness and completeness of KMZ metadata
 */

export interface CompletenessMetrics {
  score: number // 0-100
  level: 'critical' | 'low' | 'medium' | 'high' | 'complete'
  color: string
  label: string
  factors: {
    owner: number
    sii: number
    webDiscovery: number
    research: number
    spatial: number
  }
}

export function calculateCompletenessScore(
  kmz: any
): CompletenessMetrics {
  let score = 0
  const factors = {
    owner: 0,
    sii: 0,
    webDiscovery: 0,
    research: 0,
    spatial: 0,
  }

  const metadata = kmz.metadata || {}

  // Owner presence (25 points max)
  if (metadata.confirmed_owner) {
    score += 25
    factors.owner = 25
  } else if (metadata.web_owner) {
    score += 15
    factors.owner = 15
  } else if (metadata.public_owner_candidate) {
    score += 10
    factors.owner = 10
  }

  // SII data (20 points max)
  if (metadata.sii_point_resolution) {
    if (metadata.sii_point_resolution.record) {
      score += 20
      factors.sii = 20
    } else {
      score += 10
      factors.sii = 10
    }
  }

  // Web discovery (15 points max)
  if (metadata.web_owner) {
    const confidence = metadata.web_owner_confidence || 0
    const webPoints = Math.round(confidence * 15)
    score += webPoints
    factors.webDiscovery = webPoints
  }

  // Research leads (20 points max)
  if (metadata.owner_research_leads && Array.isArray(metadata.owner_research_leads)) {
    const leadPoints = Math.min(metadata.owner_research_leads.length * 5, 20)
    score += leadPoints
    factors.research = leadPoints
  } else if (metadata.owner_research_queue) {
    score += 10
    factors.research = 10
  }

  // Spatial data (20 points max)
  if (kmz.latitude && kmz.longitude) {
    score += 10
    factors.spatial = 10
  }
  if (kmz.area_hectares) {
    score += 10
    factors.spatial += 10
  }

  // Cap at 100
  score = Math.min(score, 100)

  // Determine level and colors
  let level: CompletenessMetrics['level']
  let color: string
  let label: string

  if (score >= 85) {
    level = 'complete'
    color = 'bg-green-600 text-green-50'
    label = 'Completo'
  } else if (score >= 60) {
    level = 'high'
    color = 'bg-emerald-500 text-emerald-50'
    label = 'Alto'
  } else if (score >= 40) {
    level = 'medium'
    color = 'bg-amber-500 text-amber-50'
    label = 'Medio'
  } else if (score >= 20) {
    level = 'low'
    color = 'bg-orange-500 text-orange-50'
    label = 'Bajo'
  } else {
    level = 'critical'
    color = 'bg-red-500 text-red-50'
    label = 'Crítico'
  }

  return {
    score,
    level,
    color,
    label,
    factors,
  }
}

export function getCompletenessIcon(level: CompletenessMetrics['level']) {
  const icons: Record<CompletenessMetrics['level'], string> = {
    complete: '✓✓',
    high: '✓',
    medium: '~',
    low: '–',
    critical: '!',
  }
  return icons[level]
}
