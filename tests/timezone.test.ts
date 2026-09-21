import assert from "node:assert/strict"
import test from "node:test"

import { APP_TIME_ZONE, formatAppTime } from "../lib/timezone"

test("uses America/Santiago as the canonical application timezone", () => {
  assert.equal(APP_TIME_ZONE, "America/Santiago")
})

test("formats instants using Santiago civil time", () => {
  assert.equal(
    formatAppTime("2026-09-21T15:00:00.000Z", { hour12: false }),
    "12:00",
  )
})
