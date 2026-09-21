export type RolProspect = { rol: string }

export const SENTINEL_CRON_DEFAULT_BATCH = 12
export const SENTINEL_CRON_MAX_BATCH = 12

export function resolveSentinelCronBatchLimit(value: string | null) {
  const requested = Number(value ?? String(SENTINEL_CRON_DEFAULT_BATCH))
  return Math.max(
    1,
    Math.min(Number.isFinite(requested) ? requested : SENTINEL_CRON_DEFAULT_BATCH, SENTINEL_CRON_MAX_BATCH),
  )
}

export function resolveExactRolProspects<T extends RolProspect>(
  requestedRol: string,
  scopedProspects: T[],
  areaUnscopedProspects: T[],
) {
  const scoped = scopedProspects.filter((item) => item.rol === requestedRol)
  if (scoped.length) return { targets: scoped, areaFilterBypassed: false }

  const fallback = areaUnscopedProspects.filter((item) => item.rol === requestedRol)
  return {
    targets: fallback,
    areaFilterBypassed: fallback.length > 0,
  }
}
