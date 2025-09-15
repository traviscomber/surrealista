export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

export function isValidRUT(rut: string): boolean {
  const cleanRUT = rut.replace(/[.-]/g, "")
  if (cleanRUT.length < 8 || cleanRUT.length > 9) return false

  const body = cleanRUT.slice(0, -1)
  const dv = cleanRUT.slice(-1).toLowerCase()

  let sum = 0
  let multiplier = 2

  for (let i = body.length - 1; i >= 0; i--) {
    sum += Number.parseInt(body[i]) * multiplier
    multiplier = multiplier === 7 ? 2 : multiplier + 1
  }

  const remainder = sum % 11
  const calculatedDV = remainder < 2 ? remainder.toString() : 11 - remainder === 10 ? "k" : (11 - remainder).toString()

  return dv === calculatedDV
}

export function isValidROL(rol: string): boolean {
  const cleanROL = rol.replace(/[.-]/g, "")
  return /^\d{5,8}$/.test(cleanROL)
}
