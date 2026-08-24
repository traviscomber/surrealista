const encoder = new TextEncoder()

export const INTERNAL_ACCESS_COOKIE = "sur_realista_internal_access"
export const INTERNAL_ACCESS_MAX_AGE_SECONDS = 12 * 60 * 60

function getInternalPassword() {
  return process.env.INTERNAL_APP_PASSWORD?.trim() || process.env.NEXT_PUBLIC_APP_PASSWORD?.trim() || "srmagica"
}

function getSigningSecret() {
  return process.env.INTERNAL_ACCESS_SECRET?.trim() || process.env.SUPABASE_SERVICE_ROLE_KEY?.trim() || null
}

async function hmacHex(value: string, secret: string) {
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  )
  const signature = await crypto.subtle.sign("HMAC", key, encoder.encode(value))
  return Array.from(new Uint8Array(signature), (byte) => byte.toString(16).padStart(2, "0")).join("")
}

function constantTimeEqual(left: string, right: string) {
  if (left.length !== right.length) return false
  let difference = 0
  for (let index = 0; index < left.length; index += 1) {
    difference |= left.charCodeAt(index) ^ right.charCodeAt(index)
  }
  return difference === 0
}

async function expectedInternalAccessToken() {
  const signingSecret = getSigningSecret()
  if (!signingSecret) return null
  return hmacHex(`sur-realista:${getInternalPassword()}`, signingSecret)
}

export async function createInternalAccessToken(password: string) {
  if (password !== getInternalPassword()) return null
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
