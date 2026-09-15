import test from "node:test"
import assert from "node:assert/strict"

import {
  evidenceMatchesRolAndCommune,
  normalizeOwnerRol,
  normalizeOwnerSearchText,
  ownerRolVariants,
} from "../lib/prospeccion/owner-intelligence"

test("normaliza ROL con slash, puntos y espacios", () => {
  assert.equal(normalizeOwnerRol(" 507/45 "), "507-45")
  assert.equal(normalizeOwnerRol("507.45"), "50745")
  assert.equal(normalizeOwnerRol(" 507 - 45 "), "507-45")
})

test("genera variantes equivalentes de ROL", () => {
  assert.deepEqual(ownerRolVariants("507/45"), ["507-45", "507/45", "50745"])
})

test("normaliza acentos y puntuación para evidencia", () => {
  assert.equal(normalizeOwnerSearchText("Curicó, Región del Maule"), "curico region del maule")
})

test("acepta evidencia sólo cuando ROL y comuna coinciden", () => {
  assert.equal(
    evidenceMatchesRolAndCommune("Fundo Bellavista, Curicó, ROL 507/45, productor Agrizano S.A.", "507-45", "Curicó"),
    true,
  )
  assert.equal(
    evidenceMatchesRolAndCommune("Fundo Bellavista, Talca, ROL 507/45, productor Agrizano S.A.", "507-45", "Curicó"),
    false,
  )
})

test("rechaza homónimos de ROL en otra comuna", () => {
  assert.equal(
    evidenceMatchesRolAndCommune("Florida 2978, Calama. ROL 551-6.", "551-6", "Curicó"),
    false,
  )
})

test("soporta ROL compacto en snippet si la comuna coincide", () => {
  assert.equal(
    evidenceMatchesRolAndCommune("Predio agrícola en Curico, identificación SII 50745", "507-45", "Curicó"),
    true,
  )
})
