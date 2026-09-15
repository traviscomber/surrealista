import test from "node:test"
import assert from "node:assert/strict"

import {
  normalizeOwnerWebRol,
  normalizeOwnerWebText,
  ownerWebRolVariants,
  webEvidenceMatchesTarget,
} from "../lib/prospeccion/owner-web-intelligence"

test("normaliza ROL y genera variantes", () => {
  assert.equal(normalizeOwnerWebRol("507/45"), "507-45")
  assert.deepEqual(ownerWebRolVariants("507/45"), ["507-45", "507/45", "50745"])
})

test("normaliza acentos de comuna", () => {
  assert.equal(normalizeOwnerWebText("Curicó"), "curico")
})

test("acepta evidencia sólo si coinciden ROL y comuna", () => {
  assert.equal(webEvidenceMatchesTarget("Fundo Bellavista, Curicó, ROL 507/45, Agrizano S.A.", "507-45", "Curicó"), true)
  assert.equal(webEvidenceMatchesTarget("Fundo Bellavista, Talca, ROL 507/45, Agrizano S.A.", "507-45", "Curicó"), false)
})

test("rechaza homónimo de ROL 551-6 en Calama para búsqueda Curicó", () => {
  assert.equal(webEvidenceMatchesTarget("Propiedad en Calama, ROL 551-6", "551-6", "Curicó"), false)
})

test("rechaza ROL correcto cuando falta la comuna objetivo", () => {
  assert.equal(webEvidenceMatchesTarget("ROL 546-30, propietario Comercial y Ganadera", "546-30", "Curicó"), false)
})
