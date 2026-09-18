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
