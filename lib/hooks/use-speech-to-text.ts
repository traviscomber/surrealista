"use client"

import { useState, useEffect, useCallback, useRef } from "react"

interface UseSpeechToTextOptions {
  continuous?: boolean
  interimResults?: boolean
  lang?: string
  onResult?: (transcript: string) => void
  onError?: (error: string) => void
}

export function useSpeechToText(options: UseSpeechToTextOptions = {}) {
  const { continuous = false, interimResults = true, lang = "es-CL", onResult, onError } = options

  const [isListening, setIsListening] = useState(false)
  const [transcript, setTranscript] = useState("")
  const [interimTranscript, setInterimTranscript] = useState("")
  const [isSupported, setIsSupported] = useState(false)
  const recognitionRef = useRef<any>(null)

  useEffect(() => {
    // Check if browser supports Speech Recognition
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition

    if (SpeechRecognition) {
      setIsSupported(true)
      recognitionRef.current = new SpeechRecognition()

      recognitionRef.current.continuous = continuous
      recognitionRef.current.interimResults = interimResults
      recognitionRef.current.lang = lang

      recognitionRef.current.onresult = (event: any) => {
        let interimText = ""
        let finalText = ""

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcriptPart = event.results[i][0].transcript
          if (event.results[i].isFinal) {
            finalText += transcriptPart + " "
          } else {
            interimText += transcriptPart
          }
        }

        if (finalText) {
          setTranscript((prev) => prev + finalText)
          onResult?.(finalText.trim())
        }

        setInterimTranscript(interimText)
      }

      recognitionRef.current.onerror = (event: any) => {
        console.error("[v0] Speech recognition error:", event.error)
        const errorMessage =
          event.error === "no-speech"
            ? "No se detectó voz. Intenta hablar más cerca del micrófono."
            : event.error === "not-allowed"
              ? "Permiso de micrófono denegado. Por favor, permite el acceso al micrófono."
              : `Error de reconocimiento de voz: ${event.error}`

        onError?.(errorMessage)
        setIsListening(false)
      }

      recognitionRef.current.onend = () => {
        setIsListening(false)
        setInterimTranscript("")
      }
    } else {
      console.warn("[v0] Speech Recognition not supported in this browser")
      setIsSupported(false)
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop()
      }
    }
  }, [continuous, interimResults, lang, onResult, onError])

  const startListening = useCallback(() => {
    if (recognitionRef.current && !isListening) {
      try {
        recognitionRef.current.start()
        setIsListening(true)
        console.log("[v0] Speech recognition started")
      } catch (error) {
        console.error("[v0] Error starting speech recognition:", error)
      }
    }
  }, [isListening])

  const stopListening = useCallback(() => {
    if (recognitionRef.current && isListening) {
      recognitionRef.current.stop()
      setIsListening(false)
      console.log("[v0] Speech recognition stopped")
    }
  }, [isListening])

  const resetTranscript = useCallback(() => {
    setTranscript("")
    setInterimTranscript("")
  }, [])

  return {
    isListening,
    transcript,
    interimTranscript,
    isSupported,
    startListening,
    stopListening,
    resetTranscript,
  }
}
