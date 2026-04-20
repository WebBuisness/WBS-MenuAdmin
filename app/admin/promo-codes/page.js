'use client'
import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Plus, Pencil, Trash2, Loader2, TicketPercent } from 'lucide-react'
import { toast } from 'sonner'

const empty = { code: '', discount_type: 'percent', value: 10, active: true, used_count: 0, usage_limit: null }

export default function PromoCodesPage() {
  const supabase = createClient()
  const [promos, setPromos] = useState([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState(empty)

  const load = async () => {
    const { data } = await supabase.from('promo_codes').select('*').order('created_at', { ascending: false })
    setPromos(data || [])
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  const save = async () => {
    if (!form.code) return
    const payload = {
      code: form.code.toUpperCase(),
      discount_type: form.discount_type,
      value: Number(form.value) || 0,
      active: form.active,
      usage_limit: form.usage_limit ? Number(form.usage_limit) : null,
    }
    let error
    if (editing) {
      ({ error } = await supabase.from('promo_codes').update(payload).eq('id', editing.id))
    } else {
      ({ error } = await supabase.from('promo_codes').insert(payload))
    }
    if (error) return toast.error(error.message)
    toast.success(editing ? 'Updated' : 'Created')
    setModal(false)
    load()
  }

  const remove = async (p) => {
    if (!confirm(`Delete "${p.code}"?`)) return
    const { error } = await supabase.from('promo_codes').delete().eq('id', p.id)
    if (error) return toast.error(error.message)
    toast.success('Deleted'); load()
  }

  const toggle = async (p) => {
    const { error } = await supabase.from('promo_codes').update({ active: !p.active }).eq('id', p.id)
    if (error) return toast.error(error.message)
    setPromos((prev) => prev.map((x) => x.id === p.id ? { ...x, active: !x.active } : x))
  }

  const openNew = () => { setEditing(null); setForm(empty); setModal(true) }
  const openEdit = (p) => { setEditing(p); setForm({ ...empty, ...p }); setModal(true) }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold">Promo Codes</h1>
          <p className="text-muted-foreground mt-1">{promos.length} total · {promos.filter(p=>p.active).length} active</p>
        </div>
        <Button onClick={openNew} className="bg-orange-500 hover:bg-orange-600 text-white gap-2">
          <Plus className="w-4 h-4" /> New Promo
        </Button>
      </div>

      <div className="bg-card border border-border rounded-2xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs uppercase tracking-wider text-muted-foreground border-b border-border">
              <th className="px-6 py-3 font-medium">Code</th>
              <th className="px-6 py-3 font-medium">Type</th>
              <th className="px-6 py-3 font-medium">Value</th>
              <th className="px-6 py-3 font-medium">Usage</th>
              <th className="px-6 py-3 font-medium">Active</th>
              <th className="px-6 py-3 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading && <tr><td colSpan={6} className="px-6 py-12 text-center"><Loader2 className="w-5 h-5 animate-spin mx-auto text-orange-500" /></td></tr>}
            {!loading && promos.length === 0 && <tr><td colSpan={6} className="px-6 py-12 text-center text-muted-foreground">No promo codes</td></tr>}
            {promos.map((p, idx) => (
              <motion.tr
                key={p.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: Math.min(idx, 10) * 0.04 }}
                className="border-b border-border hover:bg-secondary/30"
              >
                <td className="px-6 py-3 font-mono font-semibold text-orange-500">{p.code}</td>
                <td className="px-6 py-3">
                  <span className="px-2 py-0.5 rounded-md bg-secondary text-xs capitalize">{p.discount_type}</span>
                </td>
                <td className="px-6 py-3 font-mono">
                  {p.discount_type === 'percent' ? `${Number(p.value)}%` : `$${Number(p.value).toFixed(2)}`}
                </td>
                <td className="px-6 py-3 font-mono text-xs text-muted-foreground">
                  {p.used_count || 0}{p.usage_limit ? ` / ${p.usage_limit}` : ''}
                </td>
                <td className="px-6 py-3">
                  <Switch checked={p.active} onCheckedChange={() => toggle(p)} className="data-[state=checked]:bg-orange-500" />
                </td>
                <td className="px-6 py-3 text-right">
                  <div className="inline-flex gap-1">
                    <Button size="icon" variant="ghost" onClick={() => openEdit(p)} className="h-8 w-8"><Pencil className="w-3.5 h-3.5" /></Button>
                    <Button size="icon" variant="ghost" onClick={() => remove(p)} className="h-8 w-8 hover:text-destructive"><Trash2 className="w-3.5 h-3.5" /></Button>
                  </div>
                </td>
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>

      <Dialog open={modal} onOpenChange={setModal}>
        <DialogContent className="bg-card border-border">
          <DialogHeader><DialogTitle className="font-display flex items-center gap-2"><TicketPercent className="w-5 h-5 text-orange-500" />{editing ? 'Edit Promo' : 'New Promo'}</DialogTitle></DialogHeader>
          <div className="space-y-4 pt-2">
            <div><Label className="text-xs uppercase tracking-wider text-muted-foreground">Code</Label><Input value={form.code} onChange={(e)=>setForm({...form, code: e.target.value.toUpperCase()})} className="mt-1.5 bg-secondary border-border font-mono uppercase" placeholder="WELCOME10" /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label className="text-xs uppercase tracking-wider text-muted-foreground">Type</Label>
                <Select value={form.discount_type} onValueChange={(v) => setForm({...form, discount_type: v})}>
                  <SelectTrigger className="mt-1.5 bg-secondary border-border"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="percent">Percent (%)</SelectItem>
                    <SelectItem value="fixed">Fixed ($)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div><Label className="text-xs uppercase tracking-wider text-muted-foreground">Value</Label><Input type="number" step="0.01" value={form.value} onChange={(e)=>setForm({...form, value: e.target.value})} className="mt-1.5 bg-secondary border-border font-mono" /></div>
            </div>
            <div><Label className="text-xs uppercase tracking-wider text-muted-foreground">Usage Limit (optional)</Label><Input type="number" value={form.usage_limit || ''} onChange={(e)=>setForm({...form, usage_limit: e.target.value})} className="mt-1.5 bg-secondary border-border font-mono" placeholder="unlimited" /></div>
            <div className="flex items-center justify-between p-3 rounded-lg bg-secondary">
              <Label className="font-medium">Active</Label>
              <Switch checked={form.active} onCheckedChange={(v)=>setForm({...form, active: v})} className="data-[state=checked]:bg-orange-500" />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-4 border-t border-border">
            <Button variant="outline" onClick={()=>setModal(false)}>Cancel</Button>
            <Button onClick={save} className="bg-orange-500 hover:bg-orange-600 text-white">Save</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
