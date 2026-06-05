'use client'

import { useEffect } from 'react'
import { setUser } from '@/lib/sentry-init'

export function SentryInit() {
  useEffect(() => {
    // Initialize Sentry user if authenticated
    const token = sessionStorage.getItem('site_access_token')
    if (token) {
      setUser('anonymous-user', { authenticated: true })
    }
  }, [])

  return null
}
