import Link from 'next/link'
import Image from 'next/image'
import { ArrowLeft } from 'lucide-react'

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center px-4">
      <div className="w-full max-w-md bg-card border border-border rounded-2xl p-6 text-center">
        <Image
          src="/icons/icon-192.png"
          width={56}
          height={56}
          alt="WBS Admin"
          className="mx-auto rounded-2xl glow-orange"
          priority
        />
        <h1 className="mt-4 font-display text-xl font-bold">Page not found</h1>
        <p className="mt-2 text-sm text-muted-foreground">This page does not exist.</p>
        <Link
          href="/admin"
          className="mt-6 inline-flex items-center justify-center gap-2 w-full h-11 rounded-lg bg-secondary hover:bg-secondary/80 border border-border text-foreground"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to dashboard
        </Link>
      </div>
    </div>
  )
}
