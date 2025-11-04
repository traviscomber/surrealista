"use client"

import { useState, useEffect, useCallback, useRef } from "react"

interface UseSpeechToTextOptions {
  continuous?: boolean
  interimResults?: boolean
  lang?: string
  onResult?: (transcript: string) => void
  onError?: (error: string) => void
  silenceTimeout?: number
}

export function useSpeechToText(options: UseSpeechToTextOptions = {}) {
  const {
    continuous = false,
    interimResults = true,
    lang = "es-CL",
    onResult,
    onError,
    silenceTimeout = 3000,
  } = options

  const [isListening, setIsListening] = useState(false)
  const [transcript, setTranscript] = useState("")
  const [interimTranscript, setInterimTranscript] = useState("")
  const [isSupported, setIsSupported] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const recognitionRef = useRef<any>(null)
  const retryCountRef = useRef(0)
  const maxRetries = 3
  const isManualStopRef = useRef(false)
  const hasReceivedSpeechRef = useRef(false)
  const restartTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const silenceTimerRef = useRef<NodeJS.Timeout | null>(null)
  const currentSentenceRef = useRef<string>("")

  const onResultRef = useRef(onResult)
  const onErrorRef = useRef(onError)

  useEffect(() => {
    onResultRef.current = onResult
    onErrorRef.current = onError
  }, [onResult, onError])

  const clearSilenceTimer = useCallback(() => {
    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current)
      silenceTimerRef.current = null
    }
  }, [])

  const startSilenceTimer = useCallback(() => {
    clearSilenceTimer()

    if (continuous && silenceTimeout > 0) {
      console.log(`[v0] ⏱️ Starting ${silenceTimeout}ms silence timer...`)
      silenceTimerRef.current = setTimeout(() => {
        console.log("[v0] ⏱️ Silence timeout reached - auto-stopping")
        if (recognitionRef.current && isListening) {
          isManualStopRef.current = true
          recognitionRef.current.stop()
        }
      }, silenceTimeout)
    }
  }, [continuous, silenceTimeout, isListening, clearSilenceTimer])

  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition

    if (SpeechRecognition) {
      console.log("[v0] Speech Recognition API is supported")
      setIsSupported(true)
      recognitionRef.current = new SpeechRecognition()

      recognitionRef.current.continuous = continuous
      recognitionRef.current.interimResults = true
      recognitionRef.current.lang = lang
      recognitionRef.current.maxAlternatives = 1

      console.log("[v0] Speech Recognition configured:", {
        continuous,
        interimResults: true,
        lang,
        silenceTimeout,
      })

      recognitionRef.current.onstart = () => {
        console.log("[v0] 🎤 Speech recognition STARTED - Listening for speech...")
        setIsListening(true)
        setError(null)
        hasReceivedSpeechRef.current = false
        currentSentenceRef.current = ""
        clearSilenceTimer()
      }

      recognitionRef.current.onresult = (event: any) => {
        console.log("[v0] ✓ Speech result received:", event.results.length, "results")
        hasReceivedSpeechRef.current = true
        retryCountRef.current = 0
        clearSilenceTimer()

        let interimText = ""
        let finalText = ""

        for (let i = 0; i < event.results.length; i++) {
          const transcriptPart = event.results[i][0].transcript

          if (event.results[i].isFinal) {
            finalText = transcriptPart
            console.log("[v0] ✓ Final text:", transcriptPart)
          } else {
            interimText += transcriptPart
          }
        }

        if (finalText) {
          currentSentenceRef.current = finalText
          setInterimTranscript("")
          startSilenceTimer()
        } else if (interimText) {
          setInterimTranscript(interimText)
        }
      }

      recognitionRef.current.onerror = (event: any) => {
        console.error("[v0] ✗ Speech recognition ERROR:", event.error)
        clearSilenceTimer()

        if (event.error === "no-speech") {
          if (retryCountRef.current < maxRetries && !isManualStopRef.current) {
            retryCountRef.current++
            console.log(`[v0] ↻ No speech detected, auto-retrying... (${retryCountRef.current}/${maxRetries})`)

            const retryMessage = `Escuchando... Habla ahora (${retryCountRef.current}/${maxRetries})`
            setError(retryMessage)

            setTimeout(() => {
              if (recognitionRef.current && !isManualStopRef.current) {
                try {
                  recognitionRef.current.start()
                  console.log("[v0] ↻ Auto-restarted after no-speech")
                } catch (err) {
                  console.log("[v0] Could not restart:", err)
                  setIsListening(false)
                }
              }
            }, 100)
            return
          } else {
            const errorMessage = "No se detectó voz. Asegúrate de que el micrófono esté funcionando y habla más cerca."
            setError(errorMessage)
            onErrorRef.current?.(errorMessage)
            setIsListening(false)
            return
          }
        }

        const errorMessages: Record<string, string> = {
          "not-allowed": "Permiso denegado. Permite el acceso al micrófono en la configuración del navegador.",
          "permission-denied": "Permiso denegado. Permite el acceso al micrófono en la configuración del navegador.",
          network: "Error de red. Verifica tu conexión a internet.",
          aborted: "Reconocimiento cancelado.",
          "audio-capture": "No se pudo capturar audio. Verifica que el micrófono esté conectado.",
          "service-not-allowed": "Servicio no permitido. Intenta usar HTTPS o localhost.",
        }

        const errorMessage = errorMessages[event.error] || `Error: ${event.error}`
        setError(errorMessage)
        onErrorRef.current?.(errorMessage)
        setIsListening(false)
      }

      recognitionRef.current.onend = () => {
        console.log("[v0] Speech recognition ENDED")
        clearSilenceTimer()

        if (currentSentenceRef.current.trim()) {
          const newText = currentSentenceRef.current.trim()
          console.log("[v0] ✓ Adding complete sentence to transcript:", newText)

          setTranscript((prev) => {
            const updated = prev ? `${prev} ${newText}` : newText
            onResultRef.current?.(updated.trim())
            return updated
          })

          currentSentenceRef.current = ""
        }

        if (!isManualStopRef.current && !hasReceivedSpeechRef.current && retryCountRef.current < maxRetries) {
          retryCountRef.current++
          console.log(`[v0] ↻ Ended without speech, auto-restarting... (${retryCountRef.current}/${maxRetries})`)

          const retryMessage = `Escuchando... Habla ahora (${retryCountRef.current}/${maxRetries})`
          setError(retryMessage)

          restartTimeoutRef.current = setTimeout(() => {
            if (recognitionRef.current && !isManualStopRef.current) {
              try {
                recognitionRef.current.start()
                console.log("[v0] ↻ Auto-restarted after premature end")
              } catch (err) {
                console.log("[v0] Could not restart:", err)
                setIsListening(false)
              }
            }
          }, 100)
        } else {
          setIsListening(false)
          setInterimTranscript("")
          if (hasReceivedSpeechRef.current) {
            console.log("[v0] ✓ Recognition completed successfully")
            setError(null)
          }
        }
      }

      recognitionRef.current.onspeechstart = () => {
        console.log("[v0] 🗣️ Speech detected - user is speaking")
        hasReceivedSpeechRef.current = true
        retryCountRef.current = 0
        setError(null)
        clearSilenceTimer()
      }

      recognitionRef.current.onspeechend = () => {
        console.log("[v0] Speech ended - user stopped speaking")
        startSilenceTimer()
      }

      recognitionRef.current.onaudiostart = () => {
        console.log("[v0] 🎵 Audio capture started")
      }

      recognitionRef.current.onaudioend = () => {
        console.log("[v0] Audio capture ended")
      }
    } else {
      console.warn("[v0] ✗ Speech Recognition not supported in this browser")
      setIsSupported(false)
    }

    return () => {
      if (restartTimeoutRef.current) {
        clearTimeout(restartTimeoutRef.current)
      }
      if (silenceTimerRef.current) {
        clearTimeout(silenceTimerRef.current)
      }
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop()
        } catch (e) {
          // Ignore cleanup errors
        }
      }
    }
  }, [continuous, interimResults, lang, silenceTimeout, clearSilenceTimer, startSilenceTimer])

  const startListening = useCallback(() => {
    console.log("[v0] 🎤 startListening called")

    if (typeof window !== "undefined") {
      const isSecureContext =
        window.isSecureContext || window.location.protocol === "https:" || window.location.hostname === "localhost"

      if (!isSecureContext) {
        const httpsError =
          "Se requiere HTTPS para usar el micrófono. Accede desde un dominio seguro o usa un dispositivo móvil."
        console.error("[v0] ✗ HTTPS required")
        setError(httpsError)
        onErrorRef.current?.(httpsError)
        return
      }
    }

    if (recognitionRef.current && !isListening) {
      try {
        console.log("[v0] Starting speech recognition...")
        retryCountRef.current = 0
        isManualStopRef.current = false
        hasReceivedSpeechRef.current = false
        currentSentenceRef.current = ""
        setError(null)
        setTranscript("")
        setInterimTranscript("")
        clearSilenceTimer()

        recognitionRef.current.start()
        console.log("[v0] ✓ Speech recognition started successfully")
      } catch (error: any) {
        console.error("[v0] ✗ Error starting:", error)

        if (error.message?.includes("already started")) {
          console.log("[v0] Already started, restarting...")
          recognitionRef.current.stop()
          setTimeout(() => {
            try {
              recognitionRef.current.start()
            } catch (e) {
              console.error("[v0] ✗ Restart failed:", e)
              setError("Error al iniciar. Intenta nuevamente.")
            }
          }, 100)
        } else {
          const errorMsg = `Error: ${error.message || "Error desconocido"}`
          setError(errorMsg)
          onErrorRef.current?.(errorMsg)
        }
      }
    }
  }, [isListening, clearSilenceTimer])

  const stopListening = useCallback(() => {
    console.log("[v0] 🛑 stopListening called")
    clearSilenceTimer()
    if (restartTimeoutRef.current) {
      clearTimeout(restartTimeoutRef.current)
    }
    if (recognitionRef.current && isListening) {
      try {
        isManualStopRef.current = true
        recognitionRef.current.stop()
        setError(null)
        console.log("[v0] ✓ Stopped successfully")
      } catch (error) {
        console.error("[v0] ✗ Error stopping:", error)
      }
    }
  }, [isListening, clearSilenceTimer])

  const resetTranscript = useCallback(() => {
    setTranscript("")
    setInterimTranscript("")
    setError(null)
    hasReceivedSpeechRef.current = false
    currentSentenceRef.current = ""
    clearSilenceTimer()
  }, [clearSilenceTimer])

  return {
    isListening,
    transcript,
    interimTranscript,
    isSupported,
    error,
    startListening,
    stopListening,
    resetTranscript,
  }
}
