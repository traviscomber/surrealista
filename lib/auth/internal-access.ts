const encoder = new TextEncoder()

export const INTERNAL_ACCESS_COOKIE = "sur_realista_internal_access"
export const INTERNAL_ACCESS_MAX_AGE_SECONDS = 12 * 60 * 60

export const INTERNAL_OPERATOR = {
  id: "juan-navarro",
  name: "Juan Navarro",
  role: "operator-admin",
} as const

// v5 invalidates all previously issued internal-access cookies after the
// September 2026 credential rotation.
const TOKEN_VERSION = "v5"
const PASSWORD_SALT_HEX = "cc4e803359b54ce9d9bc8b6dc4dbb3e3"
const PASSWORD_ITERATIONS = 310_000
const PASSWORD_VERIFIER_HEX = "f0c0303702d08ac6e42d87e4adb4c3d60ba88c80ec26dccfa83e924a355fb32d"

function getSigningSecret() {
  return process.env.INTERNAL_ACCESS_SECRET?.trim() || process.env.SUPABASE_SERVICE_ROLE_KEY?.trim() || null
}

function hexToBytes(hex: string) {
  const bytes = new Uint8Array(hex.length / 2)
  for (let index = 0; index < bytes.length; index += 1) {
    bytes[index] = Number.parseInt(hex.slice(index * 2, index * 2 + 2), 16)
  }
  return bytes
}

function bytesToHex(bytes: ArrayBuffer | Uint8Array) {
  const view = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes)
  return Array.from(view, (byte) => byte.toString(16).padStart(2, "0")).join("")
}

function constantTimeEqual(left: string, right: string) {
  if (left.length !== right.length) return false
  let difference = 0
  for (let index = 0; index < left.length; index += 1) {
    difference |= left.charCodeAt(index) ^ right.charCodeAt(index)
  }
  return difference === 0
}

function randomHex(byteLength: number) {
  const bytes = new Uint8Array(byteLength)
  crypto.getRandomValues(bytes)
  return bytesToHex(bytes)
}

async function passwordMatches(password: string) {
  const baseKey = await crypto.subtle.importKey("raw", encoder.encode(password), "PBKDF2", false, ["deriveBits"])
  const derived = await crypto.subtle.deriveBits(
    {
      name: "PBKDF2",
      hash: "SHA-256",
      salt: hexToBytes(PASSWORD_SALT_HEX),
      iterations: PASSWORD_ITERATIONS,
    },
    baseKey,
    256,
  )
  return constantTimeEqual(bytesToHex(derived), PASSWORD_VERIFIER_HEX)
}

async function hmacHex(value: string, secret: string) {
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  )
  return bytesToHex(await crypto.subtle.sign("HMAC", key, encoder.encode(value)))
}

function tokenPayload(issuedAt: number, expiresAt: number, nonce: string) {
  return `${TOKEN_VERSION}:${INTERNAL_OPERATOR.id}:${issuedAt}:${expiresAt}:${nonce}`
}

export async function createInternalAccessToken(password: string) {
  if (!(await passwordMatches(password))) return null

  const signingSecret = getSigningSecret()
  if (!signingSecret) throw new Error("Internal access signing secret unavailable")

  const issuedAt = Math.floor(Date.now() / 1000)
  const expiresAt = issuedAt + INTERNAL_ACCESS_MAX_AGE_SECONDS
  const nonce = randomHex(16)
  const signature = await hmacHex(tokenPayload(issuedAt, expiresAt, nonce), signingSecret)

  return `${TOKEN_VERSION}.${issuedAt}.${expiresAt}.${nonce}.${signature}`
}

export async function verifyInternalAccessToken(token?: string | null) {
  if (!token) return false

  const [version, issuedAtRaw, expiresAtRaw, nonce, signature, ...extra] = token.split(".")
  if (extra.length > 0 || version !== TOKEN_VERSION) return false
  if (!/^\d+$/.test(issuedAtRaw || "") || !/^\d+$/.test(expiresAtRaw || "")) return false
  if (!/^[0-9a-f]{32}$/.test(nonce || "") || !/^[0-9a-f]{64}$/.test(signature || "")) return false

  const issuedAt = Number(issuedAtRaw)
  const expiresAt = Number(expiresAtRaw)
  const now = Math.floor(Date.now() / 1000)

  if (!Number.isSafeInteger(issuedAt) || !Number.isSafeInteger(expiresAt)) return false
  if (issuedAt > now + 60 || expiresAt <= now) return false
  if (expiresAt - issuedAt !== INTERNAL_ACCESS_MAX_AGE_SECONDS) return false

  const signingSecret = getSigningSecret()
  if (!signingSecret) return false

  const expected = await hmacHex(tokenPayload(issuedAt, expiresAt, nonce), signingSecret)
  return constantTimeEqual(signature, expected)
}
