'use client'
import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { createClient } from '@/lib/supabase/client'
import StatsCard from '@/components/admin/stats-card'
import StatusBadge from '@/components/admin/status-badge'
import { ShoppingBag, DollarSign, Clock, Star, AlertCircle, Database, TicketPercent } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, CartesianGrid } from 'recharts'
import { format, startOfDay, subDays, startOfToday } from 'date-fns'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

export default function Dashboard() {
  const supabase = createClient()
  const [loading, setLoading] = useState(true)
  const [needsSetup, setNeedsSetup] = useState(false)
  const [stats, setStats] = useState({ todayOrders: 0, pending: 0, topItem: null, activePromos: 0 })
  const [recent, setRecent] = useState([])
  const [chartData, setChartData] = useState([])

  const load = async () => {
    const today = startOfToday().toISOString()

    const { data: orders, error } = await supabase
      .from('orders')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(500)

    if (error) {
      if (error.code === '42P01' || error.message?.includes('does not exist') || error.message?.includes('schema cache')) {
        setNeedsSetup(true)
        setLoading(false)
        return
      }
      setLoading(false)
      return
    }

    const todayOrders = orders.filter((o) => new Date(o.created_at) >= new Date(today))
    const pending = orders.filter((o) => o.status === 'pending').length

    // most ordered item
    const counts = {}
    orders.forEach((o) => {
      ;(o.items || []).forEach((it) => {
        const name = it.name_en || it.name || 'Item'
        counts[name] = (counts[name] || 0) + (it.qty || it.quantity || 1)
      })
    })
    const topItem = Object.entries(counts).sort((a, b) => b[1] - a[1])[0]?.[0] || null

    const { data: promos } = await supabase.from('promo_codes').select('id').eq('active', true)
    const activePromos = promos?.length || 0

    setStats({ todayOrders: todayOrders.length, pending, topItem, activePromos })
    setRecent(orders.slice(0, 10))

    // chart: last 7 days
    const days = []
    for (let i = 6; i >= 0; i--) {
      const day = startOfDay(subDays(new Date(), i))
      const next = startOfDay(subDays(new Date(), i - 1))
      const count = orders.filter((o) => {
        const d = new Date(o.created_at)
        return d >= day && d < next
      }).length
      days.push({ day: format(day, 'MMM d'), orders: count })
    }
    setChartData(days)
    setLoading(false)
  }

  useEffect(() => {
    load()
    const channel = supabase
      .channel('dashboard-orders')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, () => load())
      .subscribe()
    return () => supabase.removeChannel(channel)
  }, [])

  if (needsSetup) {
    return (
      <div className="max-w-2xl mx-auto mt-20">
        <div className="bg-card border border-orange-500/40 rounded-2xl p-8 text-center">
          <div className="w-14 h-14 mx-auto rounded-xl bg-orange-500/10 flex items-center justify-center mb-4">
            <Database className="w-7 h-7 text-orange-500" />
          </div>
          <h2 className="font-display text-2xl font-bold mb-2">Database not initialized</h2>
          <p className="text-muted-foreground mb-6">Run the one-time SQL setup to create the required tables.</p>
          <Link href="/admin/setup">
            <Button className="bg-orange-500 hover:bg-orange-600 text-white">Go to Setup →</Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <div className="flex items-end justify-between flex-wrap gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground mt-1">Live overview — updates in realtime</p>
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
          Realtime connected
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard icon={ShoppingBag} label="Today's Orders" value={stats.todayOrders} delay={0} accent />
        <StatsCard icon={Clock} label="Pending Orders" value={stats.pending} delay={0.1} />
        <StatsCard icon={TicketPercent} label="Active Promos" value={stats.activePromos} delay={0.2} accent />
        <StatsCard icon={Star} label="Top Item" value={stats.topItem || '—'} delay={0.3} />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="bg-card border border-border rounded-2xl p-6"
      >
        <h3 className="font-display text-lg font-semibold mb-4">Orders — Last 7 Days</h3>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1a1a1a" />
              <XAxis dataKey="day" stroke="#666" fontSize={12} />
              <YAxis stroke="#666" fontSize={12} allowDecimals={false} />
              <Tooltip
                contentStyle={{ background: '#0A0A0A', border: '1px solid #F97316', borderRadius: 8 }}
                cursor={{ fill: 'rgba(249,115,22,0.1)' }}
              />
              <Bar dataKey="orders" fill="#F97316" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="bg-card border border-border rounded-2xl overflow-hidden"
      >
        <div className="p-6 border-b border-border flex items-center justify-between">
          <h3 className="font-display text-lg font-semibold">Recent Orders</h3>
          <Link href="/admin/orders" className="text-xs text-orange-500 hover:underline">View all →</Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs uppercase tracking-wider text-muted-foreground border-b border-border">
                <th className="px-6 py-3 font-medium">Order</th>
                <th className="px-6 py-3 font-medium">Customer</th>
                <th className="px-6 py-3 font-medium">Total</th>
                <th className="px-6 py-3 font-medium">Status</th>
                <th className="px-6 py-3 font-medium">Time</th>
              </tr>
            </thead>
            <tbody>
              {recent.length === 0 && (
                <tr><td colSpan={5} className="px-6 py-12 text-center text-muted-foreground">No orders yet</td></tr>
              )}
              {recent.map((o, idx) => (
                <motion.tr
                  key={o.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.04 }}
                  className="border-b border-border hover:bg-secondary/30"
                >
                  <td className="px-6 py-3 font-mono text-xs">#{String(o.id).slice(0, 8)}</td>
                  <td className="px-6 py-3">{o.customer_name || '—'}</td>
                  <td className="px-6 py-3 font-mono font-semibold">${Number(o.total || 0).toFixed(2)}</td>
                  <td className="px-6 py-3"><StatusBadge status={o.status} /></td>
                  <td className="px-6 py-3 text-muted-foreground text-xs">{format(new Date(o.created_at), 'MMM d, HH:mm')}</td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </motion.div>
    </div>
  )
}
