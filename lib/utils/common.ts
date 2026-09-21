import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

import { APP_LOCALE, APP_TIME_ZONE } from "@/lib/timezone"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(amount: number, currency = "CLP"): string {
  return new Intl.NumberFormat(APP_LOCALE, {
    style: "currency",
    currency,
  }).format(amount)
}

export function formatDate(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date
  return new Intl.DateTimeFormat(APP_LOCALE, { timeZone: APP_TIME_ZONE }).format(d)
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
}
