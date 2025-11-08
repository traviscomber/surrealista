"use client"

import type React from "react"

import { useState } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Search, Check, X, Loader2 } from "lucide-react"
import { lookupCompanyByRut } from "@/app/actions/rut-lookup"
import { useToast } from "@/hooks/use-toast"

interface RutInputWithLookupProps {
  value: string
  onChange: (value: string) => void
  onCompanyDataFound?: (data: {
    name: string
    businessName?: string
    activities?: string[]
    address?: string
  }) => void
  placeholder?: string
  disabled?: boolean
  className?: string
}

export function RutInputWithLookup({
  value,
  onChange,
  onCompanyDataFound,
  placeholder = "12345678-9",
  disabled = false,
  className = "",
}: RutInputWithLookupProps) {
  const [isLookingUp, setIsLookingUp] = useState(false)
  const [lookupStatus, setLookupStatus] = useState<"idle" | "success" | "error">("idle")
  const { toast } = useToast()

  const handleLookup = async () => {
    if (!value || value.trim().length < 8) {
      toast({
        title: "RUT inválido",
        description: "Ingresa un RUT válido para buscar",
        variant: "destructive",
      })
      return
    }

    setIsLookingUp(true)
    setLookupStatus("idle")

    try {
      const result = await lookupCompanyByRut(value)

      if (result.success && result.data) {
        setLookupStatus("success")
        toast({
          title: "Empresa encontrada",
          description: result.data.name,
        })

        // Pass the data back to parent component
        if (onCompanyDataFound) {
          onCompanyDataFound(result.data)
        }
      } else {
        setLookupStatus("error")
        toast({
          title: "No encontrado",
          description: result.error || "No se encontró información para este RUT en el SII",
          variant: "destructive",
        })
      }
    } catch (error) {
      setLookupStatus("error")
      toast({
        title: "Error",
        description: "Error al consultar el RUT",
        variant: "destructive",
      })
    } finally {
      setIsLookingUp(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault()
      handleLookup()
    }
  }

  return (
    <div className="relative flex gap-2 items-start">
      <div className="flex-1 relative">
        <Input
          type="text"
          value={value}
          onChange={(e) => {
            onChange(e.target.value)
            setLookupStatus("idle")
          }}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={disabled}
          className={className}
        />
        {lookupStatus === "success" && <Check className="absolute right-3 top-3 h-4 w-4 text-green-600" />}
        {lookupStatus === "error" && <X className="absolute right-3 top-3 h-4 w-4 text-red-600" />}
      </div>

      <Button
        type="button"
        variant="outline"
        size="icon"
        onClick={handleLookup}
        disabled={disabled || isLookingUp || !value || value.trim().length < 8}
        title="Buscar empresa en SII"
      >
        {isLookingUp ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
      </Button>
    </div>
  )
}
