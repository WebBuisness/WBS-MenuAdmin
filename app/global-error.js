'use client'

import { useEffect } from 'react'
import Image from 'next/image'
import { AlertTriangle, RefreshCw } from 'lucide-react'

export default function GlobalError({ error, reset }) {
  useEffect(() => {
    // eslint-disable-next-line no-console
    console.error(error)
  }, [error])

  return (
    <html lang="en" className="dark">
      <body className="min-h-screen bg-[#0A0A0A] text-foreground flex items-center justify-center px-4">
        <div className="w-full max-w-md bg-card border border-border rounded-2xl p-6">
          <div className="flex items-center gap-3">
            <Image
              src="/icons/icon-192.png"
              width={44}
              height={44}
              alt="WBS Admin"
              className="rounded-xl glow-orange"
              priority
            />
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-widest">WBS Admin</p>
              <h1 className="font-display text-lg font-bold">Something went wrong</h1>
            </div>
          </div>

          <div className="mt-4 flex items-start gap-3 text-sm text-muted-foreground">
            <AlertTriangle className="w-4 h-4 mt-0.5 text-orange-500" />
            <p>Try reloading this screen. If it keeps happening, check your connection and credentials.</p>
          </div>

          <button
            onClick={() => reset()}
            className="mt-6 w-full h-11 rounded-lg bg-orange-500 hover:bg-orange-600 text-white font-medium inline-flex items-center justify-center gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            Retry
          </button>
        </div>
      </body>
    </html>
  )
}
