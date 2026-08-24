const encoder = new TextEncoder()

export const INTERNAL_ACCESS_COOKIE = "sur_realista_internal_access"
export const INTERNAL_ACCESS_MAX_AGE_SECONDS = 12 * 60 * 60

function getConfiguredPassword() {
  return process.env.INTERNAL_APP_PASSWORD?.trim() || null
}

function getSigningSecret() {
  return process.env.INTERNAL_ACCESS_SECRET?.trim() || process.env.SUPABASE_SERVICE_ROLE_KEY?.trim() || null
}

function bytesToHex(bytes: ArrayBuffer) {
  return Array.from(new Uint8Array(bytes), (byte) => byte.toString(16).padStart(2, "0")).join("")
}

function constantTimeEqual(left: string, right: string) {
  if (left.length !== right.length) return false
  let difference = 0
  for (let index = 0; index < left.length; index += 1) {
    difference |= left.charCodeAt(index) ^ right.charCodeAt(index)
  }
  return difference === 0
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

async function expectedInternalAccessToken() {
  const signingSecret = getSigningSecret()
  if (!signingSecret) return null
  return hmacHex("sur-realista:internal-access:v1", signingSecret)
}

export async function createInternalAccessToken(password: string) {
  const configuredPassword = getConfiguredPassword()
  if (!configuredPassword) throw new Error("INTERNAL_APP_PASSWORD is not configured")
  if (!constantTimeEqual(password, configuredPassword)) return null

  const expected = await expectedInternalAccessToken()
  if (!expected) throw new Error("Internal access signing secret unavailable")
  return expected
}

export async function verifyInternalAccessToken(token?: string | null) {
  if (!token) return false
  const expected = await expectedInternalAccessToken()
  if (!expected) return false
  return constantTimeEqual(token, expected)
}
