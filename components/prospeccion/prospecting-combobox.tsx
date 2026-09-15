"use client"

import { useMemo, useState } from "react"
import { Check, ChevronsUpDown } from "lucide-react"

export type ProspectingComboboxOption = {
  value: string
  label: string
  keywords?: string[]
  group?: string
}

type Props = {
  value: string
  options: ProspectingComboboxOption[]
  placeholder: string
  emptyLabel?: string
  disabled?: boolean
  onChange: (value: string) => void
}

function normalize(value: unknown) {
  return String(value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase("es-CL")
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .replace(/\s+/g, " ")
}

function editDistance(a: string, b: string) {
  if (!a) return b.length
  if (!b) return a.length
  const previous = Array.from({ length: b.length + 1 }, (_, index) => index)
  for (let i = 1; i <= a.length; i += 1) {
    let diagonal = previous[0]
    previous[0] = i
    for (let j = 1; j <= b.length; j += 1) {
      const saved = previous[j]
      previous[j] = Math.min(
        previous[j] + 1,
        previous[j - 1] + 1,
        diagonal + (a[i - 1] === b[j - 1] ? 0 : 1),
      )
      diagonal = saved
    }
  }
  return previous[b.length]
}

function optionScore(option: ProspectingComboboxOption, rawQuery: string) {
  const query = normalize(rawQuery)
  if (!query) return 0
  const candidates = [option.label, option.value, ...(option.keywords ?? [])].map(normalize).filter(Boolean)
  let best = Number.POSITIVE_INFINITY
  for (const candidate of candidates) {
    if (candidate === query) return -100
    if (candidate.startsWith(query)) best = Math.min(best, -80 + candidate.length - query.length)
    else if (candidate.includes(query)) best = Math.min(best, -60 + candidate.length - query.length)
    else {
      const compactCandidate = candidate.replace(/\s+/g, "")
      const compactQuery = query.replace(/\s+/g, "")
      const distance = editDistance(compactQuery, compactCandidate.slice(0, Math.max(compactQuery.length, compactCandidate.length)))
      const tolerance = compactQuery.length <= 4 ? 1 : compactQuery.length <= 7 ? 2 : 3
      if (distance <= tolerance) best = Math.min(best, distance * 10 + Math.abs(compactCandidate.length - compactQuery.length))
    }
  }
  return best
}

export function ProspectingCombobox({ value, options, placeholder, emptyLabel = "Sin coincidencias", disabled, onChange }: Props) {
  const selected = useMemo(() => {
    const target = normalize(value)
    return options.find((option) => normalize(option.value) === target || normalize(option.label) === target) ?? null
  }, [options, value])
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState("")

  const visible = useMemo(() => {
    if (!query.trim()) return options.slice(0, 24)
    return options
      .map((option) => ({ option, score: optionScore(option, query) }))
      .filter((item) => Number.isFinite(item.score))
      .sort((a, b) => a.score - b.score || a.option.label.localeCompare(b.option.label, "es-CL"))
      .slice(0, 12)
      .map((item) => item.option)
  }, [options, query])

  const displayValue = open ? query : selected?.label ?? value

  return (
    <div className="relative">
      <div className="relative">
        <input
          role="combobox"
          aria-expanded={open}
          aria-autocomplete="list"
          disabled={disabled}
          value={displayValue}
          placeholder={placeholder}
          onFocus={() => {
            setQuery(selected?.label ?? value)
            setOpen(true)
          }}
          onChange={(event) => {
            setQuery(event.target.value)
            setOpen(true)
          }}
          onKeyDown={(event) => {
            if (event.key === "Escape") {
              setOpen(false)
              setQuery(selected?.label ?? value)
            }
            if (event.key === "Enter" && open && visible.length === 1) {
              event.preventDefault()
              onChange(visible[0].value)
              setQuery(visible[0].label)
              setOpen(false)
            }
          }}
          onBlur={() => {
            window.setTimeout(() => {
              setOpen(false)
              setQuery(selected?.label ?? value)
            }, 120)
          }}
          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 pr-9 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
        />
        <ChevronsUpDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
      </div>

      {open ? (
        <div role="listbox" className="absolute z-50 mt-1 max-h-72 w-full overflow-auto border border-border bg-popover p-1 shadow-lg">
          {visible.length ? visible.map((option) => {
            const active = selected?.value === option.value
            return (
              <button
                key={option.value}
                type="button"
                role="option"
                aria-selected={active}
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => {
                  onChange(option.value)
                  setQuery(option.label)
                  setOpen(false)
                }}
                className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-accent hover:text-accent-foreground"
              >
                <Check className={`h-4 w-4 shrink-0 ${active ? "opacity-100" : "opacity-0"}`} aria-hidden="true" />
                <span className="min-w-0 flex-1 truncate">{option.label}</span>
                {option.group ? <span className="text-[11px] text-muted-foreground">{option.group}</span> : null}
              </button>
            )
          }) : <p className="px-3 py-3 text-sm text-muted-foreground">{emptyLabel}. Elige una opción válida.</p>}
        </div>
      ) : null}
    </div>
  )
}
