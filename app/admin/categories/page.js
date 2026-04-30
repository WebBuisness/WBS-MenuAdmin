'use client'
import { useEffect, useState, useCallback } from 'react'
import { motion } from 'framer-motion'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Plus, GripVertical, Pencil, Trash2, Loader2, AlertCircle } from 'lucide-react'
import { toast } from 'sonner'
import { validateData, categorySchema } from '@/lib/validations'
import { DndContext, closestCenter, PointerSensor, useSensor, useSensors } from '@dnd-kit/core'
import { arrayMove, SortableContext, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

function SortableRow({ cat, onEdit, onDelete, onToggle }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: cat.id })
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }
  return (
    <div ref={setNodeRef} style={style} className="flex items-center gap-3 p-4 bg-card border border-border rounded-xl group hover:border-orange-500/40">
      <button {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing text-muted-foreground hover:text-orange-500 touch-none">
        <GripVertical className="w-5 h-5" />
      </button>
      <div className="flex-1">
        <div className="font-medium">{cat.name_en}</div>
        <div className="text-xs text-muted-foreground" dir="rtl">{cat.name_ar || '—'}</div>
      </div>
      <div className="flex items-center gap-3">
        <Switch checked={cat.active} onCheckedChange={() => onToggle(cat)} className="data-[state=checked]:bg-orange-500" />
        <Button size="icon" variant="ghost" onClick={() => onEdit(cat)} className="h-8 w-8"><Pencil className="w-3.5 h-3.5" /></Button>
        <Button size="icon" variant="ghost" onClick={() => onDelete(cat)} className="h-8 w-8 hover:text-destructive"><Trash2 className="w-3.5 h-3.5" /></Button>
      </div>
    </div>
  )
}

export default function CategoriesPage() {
  const supabase = createClient()
  const [cats, setCats] = useState([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState({ name_en: '', name_ar: '', active: true })
  const [saving, setSaving] = useState(false)
  const [errors, setErrors] = useState({})
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }))

  const load = useCallback(async () => {
    const { data, error } = await supabase.from('categories').select('*').order('sort_order', { ascending: true })
    if (!error) setCats(data || [])
    setLoading(false)
  }, [supabase])

  useEffect(() => { load() }, [load])

  const handleDragEnd = async (ev) => {
    const { active, over } = ev
    if (!over || active.id === over.id) return
    const oldIdx = cats.findIndex((c) => c.id === active.id)
    const newIdx = cats.findIndex((c) => c.id === over.id)
    const reordered = arrayMove(cats, oldIdx, newIdx)
    setCats(reordered)
    // persist
    const updates = reordered.map((c, idx) =>
      supabase.from('categories').update({ sort_order: idx }).eq('id', c.id)
    )
    await Promise.all(updates)
    toast.success('Order updated')
  }

  const openNew = () => { setEditing(null); setForm({ name_en: '', name_ar: '', active: true }); setModal(true) }
  const openEdit = (c) => { setEditing(c); setForm(c); setModal(true) }

  const save = async () => {
    const { success, errors: validationErrors, data: validData } = validateData(categorySchema, form)
    if (!success) {
      setErrors(validationErrors)
      toast.error('Please fix validation errors')
      return
    }

    setSaving(true)
    setErrors({})

    try {
      let error
      if (editing) {
        ({ error } = await supabase.from('categories').update(validData).eq('id', editing.id))
      } else {
        ({ error } = await supabase.from('categories').insert({
          ...validData,
          sort_order: cats.length,
        }))
      }
      if (error) throw error
      toast.success(editing ? 'Category updated' : 'Category created')
      setModal(false)
      load()
    } catch (err) {
      toast.error(err.message || 'Failed to save category')
    } finally {
      setSaving(false)
    }
  }

  const remove = async (c) => {
    if (!confirm(`Delete "${c.name_en}"?`)) return
    const { error } = await supabase.from('categories').delete().eq('id', c.id)
    if (error) return toast.error(error.message)
    toast.success('Deleted')
    load()
  }

  const toggle = async (c) => {
    const { error } = await supabase.from('categories').update({ active: !c.active }).eq('id', c.id)
    if (error) return toast.error(error.message)
    setCats((prev) => prev.map((p) => p.id === c.id ? { ...p, active: !p.active } : p))
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl font-bold">Categories</h1>
          <p className="text-muted-foreground mt-1">Drag to reorder · {cats.length} total</p>
        </div>
        <Button onClick={openNew} className="bg-orange-500 hover:bg-orange-600 text-white gap-2">
          <Plus className="w-4 h-4" /> Add Category
        </Button>
      </div>

      {loading ? (
        <div className="text-center py-12"><Loader2 className="w-5 h-5 animate-spin mx-auto text-orange-500" /></div>
      ) : cats.length === 0 ? (
        <div className="text-center py-16 bg-card border border-border rounded-2xl">
          <p className="text-muted-foreground">No categories yet</p>
        </div>
      ) : (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={cats.map((c) => c.id)} strategy={verticalListSortingStrategy}>
            <div className="space-y-2">
              {cats.map((c, idx) => (
                <motion.div key={c.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: idx * 0.04 }}>
                  <SortableRow cat={c} onEdit={openEdit} onDelete={remove} onToggle={toggle} />
                </motion.div>
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}

      <Dialog open={modal} onOpenChange={setModal}>
        <DialogContent className="bg-card border-border">
          <DialogHeader><DialogTitle className="font-display">{editing ? 'Edit Category' : 'New Category'}</DialogTitle></DialogHeader>

          {Object.keys(errors).length > 0 && (
            <div className="p-3 bg-destructive/10 border border-destructive/30 rounded-lg flex gap-3">
              <AlertCircle className="w-4 h-4 text-destructive shrink-0 mt-0.5" />
              <ul className="text-xs text-destructive space-y-1">
                {Object.entries(errors).map(([key, msg]) => (
                  <li key={key}>• {msg}</li>
                ))}
              </ul>
            </div>
          )}

          <div className="space-y-4 pt-2">
            <div>
              <Label className="text-xs uppercase tracking-wider text-muted-foreground">Name (EN)</Label>
              <Input
                value={form.name_en}
                onChange={(e)=>setForm({...form, name_en: e.target.value})}
                className={`mt-1.5 bg-secondary border-border ${errors.name_en ? 'border-destructive' : ''}`}
              />
            </div>
            <div>
              <Label className="text-xs uppercase tracking-wider text-muted-foreground">Name (AR)</Label>
              <Input
                value={form.name_ar || ''}
                onChange={(e)=>setForm({...form, name_ar: e.target.value})}
                dir="rtl"
                className="mt-1.5 bg-secondary border-border"
              />
            </div>
            <div className="flex items-center justify-between p-3 rounded-lg bg-secondary">
              <Label className="font-medium text-sm">Active</Label>
              <Switch checked={form.active} onCheckedChange={(v)=>setForm({...form, active: v})} className="data-[state=checked]:bg-orange-500" />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-4 border-t border-border">
            <Button variant="outline" onClick={()=>setModal(false)}>Cancel</Button>
            <Button onClick={save} disabled={saving} className="bg-orange-500 hover:bg-orange-600 text-white min-w-[80px]">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Save'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
