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
  const retryCountRef = useRef(0)
  const maxRetries = 2
  const isManualStopRef = useRef(false)

  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition

    if (SpeechRecognition) {
      console.log("[v0] Speech Recognition API is supported")
      setIsSupported(true)
      recognitionRef.current = new SpeechRecognition()

      // Configure recognition
      recognitionRef.current.continuous = continuous
      recognitionRef.current.interimResults = interimResults
      recognitionRef.current.lang = lang
      recognitionRef.current.maxAlternatives = 3

      console.log("[v0] Speech Recognition configured:", {
        continuous,
        interimResults,
        lang,
      })

      recognitionRef.current.onstart = () => {
        console.log("[v0] Speech recognition STARTED successfully")
        setIsListening(true)
        retryCountRef.current = 0
        isManualStopRef.current = false
      }

      recognitionRef.current.onresult = (event: any) => {
        console.log("[v0] Speech recognition result received:", event.results.length, "results")
        let interimText = ""
        let finalText = ""

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcriptPart = event.results[i][0].transcript
          const confidence = event.results[i][0].confidence
          console.log(
            `[v0] Result ${i}: "${transcriptPart}" (final: ${event.results[i].isFinal}, confidence: ${confidence})`,
          )

          if (event.results[i].isFinal) {
            finalText += transcriptPart + " "
          } else {
            interimText += transcriptPart
          }
        }

        if (finalText) {
          console.log("[v0] Final text captured:", finalText)
          setTranscript((prev) => prev + finalText)
          onResult?.(finalText.trim())
          retryCountRef.current = 0
        }

        if (interimText) {
          console.log("[v0] Interim text:", interimText)
        }

        setInterimTranscript(interimText)
      }

      recognitionRef.current.onerror = (event: any) => {
        console.error("[v0] Speech recognition ERROR:", event.error, event)

        if (event.error === "no-speech") {
          if (retryCountRef.current < maxRetries && !isManualStopRef.current) {
            retryCountRef.current++
            console.log(`[v0] No speech detected, auto-retrying... (${retryCountRef.current}/${maxRetries})`)

            onError?.(`Esperando que hables... (intento ${retryCountRef.current + 1}/${maxRetries + 1})`)

            setTimeout(() => {
              if (recognitionRef.current && !isManualStopRef.current) {
                try {
                  recognitionRef.current.start()
                  console.log("[v0] Auto-restarted recognition after no-speech")
                } catch (err) {
                  console.log("[v0] Could not auto-restart:", err)
                  setIsListening(false)
                }
              }
            }, 300)
            return
          } else {
            const errorMessage = "No se detectó voz después de varios intentos. Intenta hablar más cerca del micrófono."
            onError?.(errorMessage)
            setIsListening(false)
            return
          }
        }

        const errorMessage =
          event.error === "not-allowed" || event.error === "permission-denied"
            ? "Permiso de micrófono denegado. Por favor, permite el acceso al micrófono en la configuración del navegador."
            : event.error === "network"
              ? "Error de red. Verifica tu conexión a internet."
              : event.error === "aborted"
                ? "Reconocimiento de voz cancelado."
                : `Error de reconocimiento de voz: ${event.error}`

        onError?.(errorMessage)
        setIsListening(false)
      }

      recognitionRef.current.onend = () => {
        console.log("[v0] Speech recognition ENDED")
        if (retryCountRef.current >= maxRetries || isManualStopRef.current) {
          setIsListening(false)
          setInterimTranscript("")
        }
      }

      recognitionRef.current.onspeechstart = () => {
        console.log("[v0] Speech detected - user started speaking")
        retryCountRef.current = 0
      }

      recognitionRef.current.onspeechend = () => {
        console.log("[v0] Speech ended - user stopped speaking")
      }

      recognitionRef.current.onaudiostart = () => {
        console.log("[v0] Audio capture started")
      }

      recognitionRef.current.onaudioend = () => {
        console.log("[v0] Audio capture ended")
      }

      recognitionRef.current.onsoundstart = () => {
        console.log("[v0] Sound detected")
      }

      recognitionRef.current.onsoundend = () => {
        console.log("[v0] Sound ended")
      }
    } else {
      console.warn("[v0] Speech Recognition not supported in this browser")
      setIsSupported(false)
    }

    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop()
        } catch (e) {
          // Ignore errors on cleanup
        }
      }
    }
  }, [continuous, interimResults, lang, onResult, onError])

  const startListening = useCallback(() => {
    if (recognitionRef.current && !isListening) {
      try {
        console.log("[v0] Attempting to start speech recognition...")
        retryCountRef.current = 0
        isManualStopRef.current = false
        recognitionRef.current.start()
        console.log("[v0] Speech recognition start() called successfully")
      } catch (error: any) {
        console.error("[v0] Error starting speech recognition:", error)
        if (error.message?.includes("already started")) {
          console.log("[v0] Recognition already started, stopping and restarting...")
          recognitionRef.current.stop()
          setTimeout(() => {
            try {
              recognitionRef.current.start()
            } catch (e) {
              console.error("[v0] Error restarting:", e)
            }
          }, 100)
        }
      }
    } else {
      console.log("[v0] Cannot start - recognition not ready or already listening")
    }
  }, [isListening])

  const stopListening = useCallback(() => {
    if (recognitionRef.current && isListening) {
      try {
        console.log("[v0] Stopping speech recognition...")
        isManualStopRef.current = true
        recognitionRef.current.stop()
      } catch (error) {
        console.error("[v0] Error stopping speech recognition:", error)
      }
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
