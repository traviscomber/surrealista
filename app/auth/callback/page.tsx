"use client"

import { useEffect, useState } from "react"
import { useSearchParams } from "next/navigation"

export default function AuthCallback() {
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading")
  const [message, setMessage] = useState("")
  const [instructions, setInstructions] = useState("")
  const searchParams = useSearchParams()

  useEffect(() => {
    const code = searchParams.get("code")
    const error = searchParams.get("error")

    // Check if this is a popup-based flow (no URL parameters)
    if (!code && !error) {
      setStatus("success")
      setMessage("OAuth flow completed successfully!")
      setInstructions("This page is no longer needed with popup-based authentication. You can close this window.")

      // Auto-close after 2 seconds for popup flow
      setTimeout(() => {
        window.close()
      }, 2000)
      return
    }

    if (error) {
      setStatus("error")

      if (error === "redirect_uri_mismatch") {
        setMessage("OAuth Configuration Error: Redirect URI Mismatch")
        setInstructions(`
          The system has been updated to use popup-based authentication to avoid this error.
          
          If you're still seeing this error, try refreshing the main page.
          The new authentication method doesn't require redirect URI configuration.
        `)
      } else {
        setMessage(`Authentication failed: ${error}`)
        setInstructions("Please check your OAuth configuration and try again.")
      }

      if (window.opener) {
        window.opener.postMessage(
          {
            type: "oauth_error",
            error: error,
            redirectUri: `${window.location.origin}/auth/callback`,
          },
          "*",
        )
      }

      return
    }

    if (code) {
      handleAuthCode(code)
    } else {
      setStatus("error")
      setMessage("No authorization code received")
      setInstructions("The OAuth flow did not complete successfully.")
    }
  }, [searchParams])

  const handleAuthCode = async (code: string) => {
    try {
      console.log("[v0] Received OAuth code:", code)

      // Store the code in localStorage for the parent window to access
      if (typeof window !== "undefined") {
        localStorage.setItem("oauth_code", code)
        localStorage.setItem("oauth_timestamp", Date.now().toString())

        // Notify parent window
        if (window.opener) {
          window.opener.postMessage({ type: "oauth_success", code }, "*")
        }
      }

      setStatus("success")
      setMessage("Authentication successful! You can close this window.")

      // Auto-close after 2 seconds
      setTimeout(() => {
        window.close()
      }, 2000)
    } catch (error) {
      console.error("[v0] Error handling auth code:", error)
      setStatus("error")
      setMessage("Failed to process authentication")
      setInstructions("An unexpected error occurred during authentication processing.")
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="max-w-2xl w-full bg-white rounded-lg shadow-md p-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Google Drive Authentication</h1>

          {status === "loading" && (
            <div className="flex flex-col items-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-4"></div>
              <p className="text-gray-600">Processing authentication...</p>
            </div>
          )}

          {status === "success" && (
            <div className="flex flex-col items-center">
              <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center mb-4">
                <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <p className="text-green-600 font-medium">{message}</p>
              <p className="text-sm text-gray-500 mt-2">Using popup-based OAuth flow</p>
            </div>
          )}

          {status === "error" && (
            <div className="flex flex-col items-center">
              <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center mb-4">
                <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
              <p className="text-red-600 font-medium mb-4">{message}</p>

              {instructions && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-left max-w-lg">
                  <h3 className="font-semibold text-yellow-800 mb-2">Updated Authentication Method:</h3>
                  <pre className="text-sm text-yellow-700 whitespace-pre-wrap font-mono">{instructions}</pre>
                </div>
              )}

              <button
                onClick={() => window.close()}
                className="mt-4 px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300"
              >
                Close Window
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
