'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/client'
import Sidebar from '@/components/admin/sidebar'
import { Loader2 } from 'lucide-react'

export default function AdminLayout({ children }) {
  const router = useRouter()
  const supabase = createClient()
  const [loading, setLoading] = useState(true)
  const [email, setEmail] = useState(null)

  useEffect(() => {
    const checkAuth = async () => {
      const { data } = await supabase.auth.getSession()
      if (!data.session) {
        router.replace('/login')
        return
      }
      setEmail(data.session.user.email)
      setLoading(false)
    }
    checkAuth()

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) router.replace('/login')
    })
    return () => listener.subscription.unsubscribe()
  }, [router, supabase.auth])

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Image
            src="/icons/icon-192.png"
            width={56}
            height={56}
            alt="WBS Admin"
            className="w-14 h-14 rounded-xl pulse-ring glow-orange"
            priority
          />
          <Loader2 className="w-5 h-5 animate-spin text-orange-500" />
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#050505]">
      <Sidebar userEmail={email} />
      <main className="lg:pl-64 min-h-screen">
        <div className="max-w-[1600px] mx-auto p-4 lg:p-10 pt-20 lg:pt-10">
          {children}
        </div>
      </main>
    </div>
  )
}
