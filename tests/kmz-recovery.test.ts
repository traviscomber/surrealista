import test from "node:test"
import assert from "node:assert/strict"

import { verifiedSiiRol } from "../lib/kmz/rol-verification"
import { normalizeCommuneName, parseSiiCommuneTable } from "../lib/sii/sii-comuna-code-resolver"
import { buildKmlHierarchySummary } from "../lib/kmz/kmz-hierarchy"

test("strict SII ROL verifier only accepts matching commune code", () => {
  assert.equal(verifiedSiiRol("06209-123-45", "06209"), "06209-123-45")
  assert.equal(verifiedSiiRol("06209-123-45-A", "06209"), "06209-123-45-A")
  assert.equal(verifiedSiiRol("05401-123-45", "06209"), null)
})

test("strict SII ROL verifier rejects dates and UUID fragments", () => {
  assert.equal(verifiedSiiRol("02-2020", "06209"), null)
  assert.equal(verifiedSiiRol("2026-08", "06209"), null)
  assert.equal(verifiedSiiRol("8802-4816", "06209"), null)
  assert.equal(verifiedSiiRol("not-a-role", "06209"), null)
})

test("SII commune table parser resolves official codes", () => {
  const html = `
    <table>
      <tr><td>06209</td><td>CHEPICA</td><td>132</td></tr>
      <tr><td>09204</td><td>CUNCO</td><td>230</td></tr>
      <tr><td>10302</td><td>COCHAMO</td><td>262</td></tr>
      <tr><td>11401</td><td>COYHAIQUE</td><td>284</td></tr>
    </table>
  `
  const codes = parseSiiCommuneTable(html)
  assert.equal(codes.get(normalizeCommuneName("Chépica")), "06209")
  assert.equal(codes.get(normalizeCommuneName("Cunco")), "09204")
  assert.equal(codes.get(normalizeCommuneName("Cochamó")), "10302")
  assert.equal(codes.get(normalizeCommuneName("Coihaique")), "11401")
})

test("KML hierarchy summary preserves nested folder paths", () => {
  const summary = buildKmlHierarchySummary([
    { properties: { folderPath: ["Cliente A", "Campo Norte"] } },
    { properties: { folderPath: ["Cliente A", "Campo Norte"] } },
    { properties: { folderPath: ["Cliente A", "Campo Sur", "Lote 2"] } },
    { properties: {} },
  ])

  assert.equal(summary.hasHierarchy, true)
  assert.equal(summary.folderCount, 4)
  assert.equal(summary.maxDepth, 3)
  assert.deepEqual(summary.rootFolders, ["Cliente A"])
  assert.deepEqual(summary.paths[0], {
    path: ["Cliente A", "Campo Norte"],
    placemarkCount: 2,
  })
})
