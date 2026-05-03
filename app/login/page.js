'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/client'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { Loader2 } from 'lucide-react'

export default function LoginPage() {
  const router = useRouter()
  const supabase = createClient()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [mode, setMode] = useState('signin') // signin | signup

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) router.replace('/admin')
    })
  }, [router, supabase.auth])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      if (mode === 'signup') {
        const res = await fetch('/api/admin/create', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password }),
        })
        const json = await res.json().catch(() => ({}))
        if (!res.ok) throw new Error(json.error || 'Signup failed')
        toast.success('Admin account created. Signing in...')
        const { error: signinErr } = await supabase.auth.signInWithPassword({ email, password })
        if (signinErr) throw signinErr
        router.replace('/admin')
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password })
        if (error) {
          if (error.status === 400) {
            throw new Error('Invalid email or password. Please check your credentials.')
          }
          throw error
        }
        toast.success('Welcome back')
        router.replace('/admin')
      }
    } catch (err) {
      toast.error(err?.message || 'Authentication failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0A0A0A] relative overflow-hidden px-4">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(249,115,22,0.15),transparent_50%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_80%,rgba(249,115,22,0.08),transparent_50%)]" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md relative z-10"
      >
        <div className="flex items-center gap-3 mb-8 justify-center">
          <Image
            src="/icons/icon-192.png"
            width={48}
            height={48}
            alt="WBS Admin"
            className="w-12 h-12 rounded-xl glow-orange"
            priority
          />
          <div>
            <h1 className="font-display text-2xl font-bold tracking-tight">WBS Menu Demo</h1>
            <p className="text-xs text-muted-foreground uppercase tracking-widest">Admin Panel</p>
          </div>
        </div>

        <div className="bg-card border border-border rounded-2xl p-8 shadow-2xl">
          <h2 className="font-display text-xl font-semibold mb-1">
            {mode === 'signin' ? 'Sign in' : 'Create admin account'}
          </h2>
          <p className="text-sm text-muted-foreground mb-6">
            {mode === 'signin' ? 'Enter your credentials to continue' : 'Set up the first admin account'}
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="email" className="text-xs uppercase tracking-wider text-muted-foreground">
                Email
              </Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="mt-1.5 bg-secondary border-border h-11"
                placeholder="admin@example.com"
                autoComplete="email"
              />
            </div>
            <div>
              <Label htmlFor="password" className="text-xs uppercase tracking-wider text-muted-foreground">
                Password
              </Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                className="mt-1.5 bg-secondary border-border h-11 font-mono"
                placeholder="********"
                autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
              />
            </div>
            <Button
              type="submit"
              disabled={loading}
              className="w-full h-11 bg-orange-500 hover:bg-orange-600 text-white font-medium"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : mode === 'signin' ? (
                'Sign in'
              ) : (
                'Create account'
              )}
            </Button>
          </form>

          <div className="mt-6 pt-6 border-t border-border text-center">
            <button
              onClick={() => setMode(mode === 'signin' ? 'signup' : 'signin')}
              className="text-xs text-muted-foreground hover:text-orange-500 transition-colors"
            >
              {mode === 'signin' ? 'First time? Create admin account ->' : '<- Back to sign in'}
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  )
}
