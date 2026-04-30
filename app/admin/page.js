'use client'
import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { createClient } from '@/lib/supabase/client'
import StatsCard from '@/components/admin/stats-card'
import {
  UtensilsCrossed,
  FolderTree,
  TicketPercent,
  TrendingUp,
  Clock,
  CheckCircle2,
  AlertCircle
} from 'lucide-react'
import { TableSkeleton } from '@/components/Skeletons'
import { format } from 'date-fns'

export default function Dashboard() {
  const supabase = createClient()
  const [stats, setStats] = useState({
    items: 0,
    categories: 0,
    promos: 0,
    activeItems: 0
  })
  const [recentOrders, setRecentOrders] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadDashboard = async () => {
      try {
        const [items, cats, promos, orders] = await Promise.all([
          supabase.from('items').select('id, available'),
          supabase.from('categories').select('id'),
          supabase.from('promo_codes').select('id'),
          supabase.from('orders').select('*').order('created_at', { ascending: false }).limit(5)
        ])

        setStats({
          items: items.data?.length || 0,
          categories: cats.data?.length || 0,
          promos: promos.data?.length || 0,
          activeItems: items.data?.filter(i => i.available).length || 0
        })
        setRecentOrders(orders.data || [])
      } catch (err) {
        console.error('Error loading dashboard:', err)
      } finally {
        setLoading(false)
      }
    }
    loadDashboard()
  }, [supabase])

  if (loading) {
    return (
      <div className="space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-32 bg-card animate-pulse rounded-2xl border border-border" />
          ))}
        </div>
        <TableSkeleton />
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-3xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground mt-1">Overview of your restaurant's performance</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard
          icon={UtensilsCrossed}
          label="Total Items"
          value={stats.items}
          subtext={`${stats.activeItems} items available`}
          delay={0.1}
        />
        <StatsCard
          icon={FolderTree}
          label="Categories"
          value={stats.categories}
          delay={0.2}
        />
        <StatsCard
          icon={TicketPercent}
          label="Promo Codes"
          value={stats.promos}
          delay={0.3}
        />
        <StatsCard
          icon={TrendingUp}
          label="Growth"
          value={12}
          suffix="%"
          accent
          delay={0.4}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold font-display">Recent Orders</h2>
            <button className="text-orange-500 text-sm hover:underline">View all</button>
          </div>
          <div className="bg-card border border-border rounded-2xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs uppercase tracking-wider text-muted-foreground border-b border-border">
                    <th className="px-6 py-4 font-medium">Order ID</th>
                    <th className="px-6 py-4 font-medium">Customer</th>
                    <th className="px-6 py-4 font-medium">Status</th>
                    <th className="px-6 py-4 font-medium text-right">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {recentOrders.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-6 py-8 text-center text-muted-foreground italic">
                        No orders yet
                      </td>
                    </tr>
                  ) : recentOrders.map((order) => (
                    <tr key={order.id} className="hover:bg-secondary/30 transition-colors">
                      <td className="px-6 py-4 font-mono text-xs">#{order.id.slice(0, 8)}</td>
                      <td className="px-6 py-4 font-medium">{order.customer_name}</td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                          order.status === 'pending' ? 'bg-orange-500/10 text-orange-500' :
                          order.status === 'completed' ? 'bg-green-500/10 text-green-500' :
                          'bg-secondary text-muted-foreground'
                        }`}>
                          {order.status === 'pending' && <Clock className="w-3 h-3" />}
                          {order.status === 'completed' && <CheckCircle2 className="w-3 h-3" />}
                          {order.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right font-mono font-bold text-orange-500">
                        ${Number(order.total).toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <h2 className="text-xl font-bold font-display">System Status</h2>
          <div className="bg-card border border-border rounded-2xl p-6 space-y-6">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-green-500/10 flex items-center justify-center text-green-500">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <div>
                <p className="text-sm font-bold">API Status</p>
                <p className="text-xs text-muted-foreground">Operational</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-green-500/10 flex items-center justify-center text-green-500">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <div>
                <p className="text-sm font-bold">Database</p>
                <p className="text-xs text-muted-foreground">Healthy</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-orange-500/10 flex items-center justify-center text-orange-500">
                <AlertCircle className="w-5 h-5" />
              </div>
              <div>
                <p className="text-sm font-bold">Storage</p>
                <p className="text-xs text-muted-foreground">84% Capacity</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
