export type RolProspect = { rol: string }

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
