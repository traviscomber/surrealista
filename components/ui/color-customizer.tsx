'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu'
import { Palette } from 'lucide-react'

type ThemeColor = 'green' | 'blue' | 'red' | 'purple' | 'orange'

const THEME_COLORS: Record<ThemeColor, { label: string; css: string }> = {
  green: { label: 'Verde (Default)', css: '--primary-color: #16a34a; --forest: #15803d;' },
  blue: { label: 'Azul', css: '--primary-color: #2563eb; --forest: #1d4ed8;' },
  red: { label: 'Rojo', css: '--primary-color: #dc2626; --forest: #b91c1c;' },
  purple: { label: 'Púrpura', css: '--primary-color: #7c3aed; --forest: #6d28d9;' },
  orange: { label: 'Naranja', css: '--primary-color: #ea580c; --forest: #c2410c;' },
}

export function ColorCustomizer() {
  const [currentTheme, setCurrentTheme] = useState<ThemeColor>('green')
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    // Load saved theme from localStorage
    const savedTheme = localStorage.getItem('theme-color') as ThemeColor
    if (savedTheme && savedTheme in THEME_COLORS) {
      setCurrentTheme(savedTheme)
      applyTheme(savedTheme)
    }
  }, [])

  const applyTheme = (theme: ThemeColor) => {
    const root = document.documentElement
    const colors = THEME_COLORS[theme]
    root.style.cssText = colors.css

    // Also update CSS variables for Tailwind
    root.style.setProperty('--color-primary', theme === 'green' ? '22, 163, 74' : '')
    
    localStorage.setItem('theme-color', theme)
  }

  const handleThemeChange = (theme: ThemeColor) => {
    setCurrentTheme(theme)
    applyTheme(theme)
  }

  if (!mounted) {
    return (
      <Button variant="ghost" size="icon" className="w-9 h-9">
        <Palette className="w-4 h-4" />
      </Button>
    )
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="w-9 h-9">
          <Palette className="w-4 h-4" />
          <span className="sr-only">Personalizar colores</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel>Tema de Color</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {Object.entries(THEME_COLORS).map(([key, { label }]) => (
          <DropdownMenuItem
            key={key}
            onClick={() => handleThemeChange(key as ThemeColor)}
            className="cursor-pointer"
          >
            <div
              className="w-3 h-3 rounded-full mr-2"
              style={{
                backgroundColor:
                  key === 'green'
                    ? '#16a34a'
                    : key === 'blue'
                      ? '#2563eb'
                      : key === 'red'
                        ? '#dc2626'
                        : key === 'purple'
                          ? '#7c3aed'
                          : '#ea580c',
              }}
            />
            <span>{label}</span>
            {currentTheme === key && <span className="ml-auto">✓</span>}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
