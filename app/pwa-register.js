'use client'

import { useEffect } from 'react'

export default function PwaRegister() {
  useEffect(() => {
    if (typeof window === 'undefined') return
    if (process.env.NODE_ENV === 'development') return
    if (!('serviceWorker' in navigator)) return

    const onLoad = () => {
      navigator.serviceWorker.register('/sw.js').catch(() => {
        // Best-effort: PWA should not break the app if SW registration fails.
      })
    }

    window.addEventListener('load', onLoad)
    return () => window.removeEventListener('load', onLoad)
  }, [])

  return null
}

