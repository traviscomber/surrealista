export const APP_TIME_ZONE = "America/Santiago"
export const APP_LOCALE = "es-CL"

type DateInput = Date | string | number

function asDate(value: DateInput) {
  return value instanceof Date ? value : new Date(value)
}

export function formatAppDate(
  value: DateInput,
  options: Intl.DateTimeFormatOptions = {},
) {
  return new Intl.DateTimeFormat(APP_LOCALE, {
    timeZone: APP_TIME_ZONE,
    ...options,
  }).format(asDate(value))
}

export function formatAppDateTime(
  value: DateInput,
  options: Intl.DateTimeFormatOptions = {},
) {
  return new Intl.DateTimeFormat(APP_LOCALE, {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: APP_TIME_ZONE,
    ...options,
  }).format(asDate(value))
}

export function formatAppTime(
  value: DateInput,
  options: Intl.DateTimeFormatOptions = {},
) {
  return new Intl.DateTimeFormat(APP_LOCALE, {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: APP_TIME_ZONE,
    ...options,
  }).format(asDate(value))
}
