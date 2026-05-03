'use client'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname, useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import {
  UtensilsCrossed,
  FolderTree,
  TicketPercent,
  Settings,
  LogOut,
  Menu,
  X,
  LayoutDashboard,
} from 'lucide-react'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'

const navItems = [
  { href: '/admin', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/admin/items', label: 'Menu Items', icon: UtensilsCrossed },
  { href: '/admin/categories', label: 'Categories', icon: FolderTree },
  { href: '/admin/promo-codes', label: 'Promo Codes', icon: TicketPercent },
  { href: '/admin/settings', label: 'Settings', icon: Settings },
]

export default function Sidebar({ userEmail }) {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()
  const [open, setOpen] = useState(false)

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.replace('/login')
  }

  const SidebarBody = (
    <div className="h-full flex flex-col bg-[#070707] border-r border-border">
      {/* Logo */}
      <div className="p-6 flex items-center gap-3 border-b border-border">
        <Image
          src="/icons/icon-192.png"
          width={36}
          height={36}
          alt="WBS Admin"
          className="w-9 h-9 rounded-lg glow-orange"
          priority
        />
        <div>
          <h1 className="font-display text-base font-bold leading-tight">WBS Menu Demo</h1>
          <p className="text-[10px] text-muted-foreground uppercase tracking-widest">Admin</p>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 p-3 space-y-1 overflow-y-auto scrollbar-thin">
        {navItems.map((item, idx) => {
          const Icon = item.icon
          const active =
            item.href === '/admin' ? pathname === '/admin' : pathname.startsWith(item.href)

          return (
            <motion.div
              key={item.href}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.04 }}
            >
              <Link
                href={item.href}
                onClick={() => setOpen(false)}
                className={cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all relative group',
                  active
                    ? 'bg-orange-500/10 text-orange-500'
                    : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
                )}
              >
                {active && (
                  <motion.div
                    layoutId="active-indicator"
                    className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-orange-500 rounded-r"
                  />
                )}
                <Icon className={cn('w-4 h-4 shrink-0', active && 'animate-pulse')} />
                <span className="font-medium">{item.label}</span>
              </Link>
            </motion.div>
          )
        })}
      </nav>

      {/* User footer */}
      <div className="p-3 border-t border-border">
        <div className="px-3 py-2 mb-2">
          <p className="text-[10px] text-muted-foreground uppercase tracking-widest">Signed in</p>
          <p className="text-xs font-mono truncate mt-0.5">{userEmail || '-'}</p>
        </div>
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
        >
          <LogOut className="w-4 h-4" />
          <span>Logout</span>
        </button>
      </div>
    </div>
  )

  return (
    <>
      {/* Mobile hamburger */}
      <button
        onClick={() => setOpen(true)}
        className="lg:hidden fixed top-4 left-4 z-40 w-10 h-10 rounded-lg bg-card border border-border flex items-center justify-center"
      >
        <Menu className="w-5 h-5" />
      </button>

      {/* Desktop */}
      <aside className="hidden lg:flex fixed left-0 top-0 bottom-0 w-64 z-30">{SidebarBody}</aside>

      {/* Mobile drawer */}
      <AnimatePresence>
        {open && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setOpen(false)}
              className="lg:hidden fixed inset-0 bg-black/60 z-40"
            />
            <motion.aside
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25 }}
              className="lg:hidden fixed left-0 top-0 bottom-0 w-64 z-50"
            >
              <button
                onClick={() => setOpen(false)}
                className="absolute top-4 right-4 w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground"
              >
                <X className="w-5 h-5" />
              </button>
              {SidebarBody}
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  )
}
