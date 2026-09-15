import assert from "node:assert/strict"
import test from "node:test"

import { CHILEAN_REGIONS } from "../lib/chile-locations"
import {
  canonicalCommuneName,
  canonicalRegionName,
  normalizeProspectingCriteria,
  normalizeSearchText,
  sameNormalizedLocation,
} from "../lib/prospeccion/normalization"

function stripDiacritics(value: string) {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "")
}

test("normalizes accents, punctuation, case and whitespace for matching", () => {
  assert.equal(normalizeSearchText("  Curicó  "), "curico")
  assert.equal(normalizeSearchText("ÑUBLE"), "nuble")
  assert.equal(normalizeSearchText("O'Higgins"), "o higgins")
  assert.equal(sameNormalizedLocation("Biobío", "biobio"), true)
  assert.equal(sameNormalizedLocation("La Araucanía", "la araucania"), true)
})

test("catalog covers all Chilean regions and communes", () => {
  assert.equal(CHILEAN_REGIONS.length, 16)
  assert.equal(
    CHILEAN_REGIONS.flatMap((region) => region.provincias.flatMap((province) => province.comunas)).length,
    346,
  )
})

test("canonicalizes representative Chilean regions", () => {
  assert.equal(canonicalRegionName("Region del Maule"), "Maule")
  assert.equal(canonicalRegionName("Región del Maule"), "Maule")
  assert.equal(canonicalRegionName("Nuble"), "Ñuble")
  assert.equal(canonicalRegionName("Biobio"), "Biobío")
  assert.equal(canonicalRegionName("Araucania"), "La Araucanía")
  assert.equal(canonicalRegionName("Valparaiso"), "Valparaíso")
  assert.equal(canonicalRegionName("OHiggins"), "O'Higgins")
})

test("canonicalizes representative communes with and without accents", () => {
  assert.equal(canonicalCommuneName("Curico", "Maule"), "Curicó")
  assert.equal(canonicalCommuneName("Nunoa", "Metropolitana"), "Ñuñoa")
  assert.equal(canonicalCommuneName("Penalolen", "Metropolitana"), "Peñalolén")
  assert.equal(canonicalCommuneName("Quellon", "Los Lagos"), "Quellón")
})

test("normalizes every canonical region short name after removing accents", () => {
  for (const region of CHILEAN_REGIONS) {
    const unaccented = stripDiacritics(region.shortName)
    assert.equal(
      canonicalRegionName(unaccented),
      region.shortName,
      `region failed: ${unaccented} -> ${region.shortName}`,
    )
  }
})

test("normalizes every Chilean commune after removing accents when region is known", () => {
  for (const region of CHILEAN_REGIONS) {
    for (const province of region.provincias) {
      for (const commune of province.comunas) {
        const unaccented = stripDiacritics(commune.name)
        assert.equal(
          canonicalCommuneName(unaccented, region.shortName),
          commune.name,
          `commune failed: ${unaccented} in ${region.shortName} -> ${commune.name}`,
        )
      }
    }
  }
})

test("keeps region scoping and does not canonicalize a commune from another region", () => {
  assert.equal(canonicalCommuneName("Curico", "Los Lagos"), "Curico")
})

test("normalizes full prospecting criteria without changing numeric filters", () => {
  assert.deepEqual(
    normalizeProspectingCriteria({
      region: " region del maule ",
      commune: "curico",
      species: "  cerezos  ",
      minHa: 15,
      maxHa: 80,
    }),
    {
      region: "Maule",
      commune: "Curicó",
      species: "cerezos",
      minHa: 15,
      maxHa: 80,
    },
  )
})

test("preserves unknown user-entered locations instead of fabricating a canonical match", () => {
  assert.equal(canonicalRegionName("Región Inventada"), "Región Inventada")
  assert.equal(canonicalCommuneName("Sector Experimental", "Maule"), "Sector Experimental")
})
