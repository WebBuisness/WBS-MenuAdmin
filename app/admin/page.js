'use client'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2 } from 'lucide-react'

export default function Dashboard() {
  const router = useRouter()

  useEffect(() => {
    router.replace('/admin/items')
  }, [router])

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
      <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
      <p className="text-muted-foreground animate-pulse">Redirecting to Menu Items...</p>
    </div>
  )
}
