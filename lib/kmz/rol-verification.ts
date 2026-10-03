export function verifiedSiiRol(value: unknown, siiCode: string) {
  const code = String(siiCode || "").trim()
  if (!/^\d{5}$/.test(code)) return null

  const rol = String(value || "").trim().toUpperCase()
  if (!new RegExp(`^${code}-\\d{1,5}-\\d{1,5}(?:-[A-Z])?$`).test(rol)) return null

  return rol
}
