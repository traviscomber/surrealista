import assert from "node:assert/strict"
import test from "node:test"

import { resolveExactRolProspects } from "../lib/prospeccion/sentinel-targeting"

test("falls back to the same exact ROL when only the area filter excluded it", () => {
  const scoped = [{ rol: "209-44" }, { rol: "231-119" }]
  const areaUnscoped = [{ rol: "234-189" }, { rol: "209-44" }]

  const resolved = resolveExactRolProspects("234-189", scoped, areaUnscoped)

  assert.equal(resolved.areaFilterBypassed, true)
  assert.deepEqual(resolved.targets.map((item) => item.rol), ["234-189"])
})

test("does not invent an exact ROL that is absent from both scopes", () => {
  const resolved = resolveExactRolProspects(
    "999-999",
    [{ rol: "209-44" }],
    [{ rol: "234-189" }],
  )

  assert.equal(resolved.areaFilterBypassed, false)
  assert.deepEqual(resolved.targets, [])
})

test("keeps an exact ROL from the filtered scope without marking a bypass", () => {
  const scoped = [{ rol: "234-189", areaHa: 24.5 }, { rol: "209-44", areaHa: 18 }]
  const areaUnscoped = [{ rol: "234-189", areaHa: 24.5 }]

  const resolved = resolveExactRolProspects("234-189", scoped, areaUnscoped)

  assert.equal(resolved.areaFilterBypassed, false)
  assert.equal(resolved.targets.length, 1)
  assert.equal(resolved.targets[0]?.areaHa, 24.5)
})

test("never substitutes another ROL from the area-unscoped fallback", () => {
  const scoped = [{ rol: "209-44" }]
  const areaUnscoped = [{ rol: "231-119" }, { rol: "233-279" }]

  const resolved = resolveExactRolProspects("234-189", scoped, areaUnscoped)

  assert.equal(resolved.areaFilterBypassed, false)
  assert.deepEqual(resolved.targets, [])
})

test("prefers the scoped exact match over fallback data", () => {
  const scoped = [{ rol: "234-189", source: "scoped" }]
  const areaUnscoped = [{ rol: "234-189", source: "fallback" }]

  const resolved = resolveExactRolProspects("234-189", scoped, areaUnscoped)

  assert.equal(resolved.areaFilterBypassed, false)
  assert.deepEqual(resolved.targets, [{ rol: "234-189", source: "scoped" }])
})

test("returns every exact matching parcel record and excludes unrelated records", () => {
  const scoped: Array<{ rol: string; id: number }> = []
  const areaUnscoped = [
    { rol: "234-189", id: 1 },
    { rol: "209-44", id: 2 },
    { rol: "234-189", id: 3 },
  ]

  const resolved = resolveExactRolProspects("234-189", scoped, areaUnscoped)

  assert.equal(resolved.areaFilterBypassed, true)
  assert.deepEqual(resolved.targets.map((item) => item.id), [1, 3])
})
