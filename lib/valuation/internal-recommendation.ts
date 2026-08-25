type RecommendationInput = {
  estimatedPrice: number | null
  priceRange: { low?: number; high?: number } | null
  confidence: number
  sampleCount: number
  marketAgeDays: number | null
  marketNeighbors: any[]
  kmzNeighbors: any[]
  contextStatus: string
  contextSignals?: any[]
}

export function buildInternalRecommendation(input: RecommendationInput) {
  const strongNeighbors = input.marketNeighbors.filter((row) => (row.area_similarity ?? 0) >= 0.8)
  const spatialNeighbors = input.marketNeighbors.filter((row) => row.neighbor_basis === 'spatial')
  const closeKmz = input.kmzNeighbors.filter((row) => Number(row.distance_km) <= 5)
  const negativeSignals = (input.contextSignals ?? []).filter((row) => row.sentiment === 'negative' || row.signal === 'negative')
  const positiveSignals = (input.contextSignals ?? []).filter((row) => row.sentiment === 'positive' || row.signal === 'positive')

  const evidenceScore = Math.min(100,
    input.confidence * 0.55 +
    Math.min(input.sampleCount, 10) * 2 +
    Math.min(strongNeighbors.length, 5) * 3 +
    Math.min(closeKmz.length, 5) * 2
  )

  let verdict: 'evidencia_fuerte' | 'revisar' | 'evidencia_debil' = 'revisar'
  if (evidenceScore >= 75 && input.sampleCount >= 5) verdict = 'evidencia_fuerte'
  if (evidenceScore < 55 || input.sampleCount < 3) verdict = 'evidencia_debil'

  const actions: string[] = []
  if (input.sampleCount < 5) actions.push('Actualizar mercado dirigido a la comuna/sector antes de cerrar una recomendación comercial.')
  if (!spatialNeighbors.length) actions.push('Georreferenciar los mejores avisos locales para validar proximidad real.')
  if (strongNeighbors.length) actions.push(`Revisar manualmente ${strongNeighbors.length} comparables con superficie similar antes de negociar.`)
  if (closeKmz.length) actions.push(`Contrastar ${closeKmz.length} puntos/predios SR dentro de 5 km con la evidencia comercial.`)
  if (negativeSignals.length) actions.push('Revisar las señales negativas actuales antes de recomendar precio o negociación.')
  if (input.contextStatus !== 'verified') actions.push('Verificar contexto/noticias actuales antes de usar esta valoración como recomendación final.')
  if (!actions.length) actions.push('La evidencia es suficiente para revisión comercial interna; validar atributos físicos del predio antes de negociar.')

  return {
    audience: 'juan_navarro_internal_sr',
    verdict,
    evidence_score: Math.round(evidenceScore),
    decision_summary: verdict === 'evidencia_fuerte'
      ? 'La evidencia disponible permite usar el rango como base sólida de revisión comercial interna.'
      : verdict === 'evidencia_debil'
        ? 'La evidencia todavía es insuficiente para cerrar una recomendación comercial; ampliar mercado y atributos del predio.'
        : 'El rango es utilizable como referencia, pero requiere revisión humana de comparables y atributos antes de negociar.',
    evidence: {
      sample_count: input.sampleCount,
      strong_area_neighbors: strongNeighbors.length,
      spatial_market_neighbors: spatialNeighbors.length,
      kmz_neighbors_within_5km: closeKmz.length,
      positive_current_signals: positiveSignals.length,
      negative_current_signals: negativeSignals.length,
      market_age_days: input.marketAgeDays,
    },
    recommended_actions: actions,
    guardrail: 'Recomendación interna SR. No constituye tasación bancaria ni reemplaza revisión legal, normativa o física del predio.',
  }
}
