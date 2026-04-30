'use client';
import { useEffect, useState, useMemo, useCallback } from 'react';
import { motion } from 'framer-motion';
import Image from 'next/image';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Plus, Search, Pencil, Trash2, ImageOff, Star, Loader2, AlertCircle, Filter, ChevronDown } from 'lucide-react';
import { toast } from 'sonner';
import { validateData, itemSchema } from '@/lib/validations';
import { TableSkeleton } from '@/components/Skeletons';

const emptyItem = {
  name_en: '',
  name_ar: '',
  desc_en: '',
  desc_ar: '',
  category_id: null,
  price: 0,
  image_url: '',
  has_combo: false,
  combo_price: 0,
  combo_desc_en: '',
  combo_desc_ar: '',
  available: true,
  rating: 0,
};

export default function ItemsPage() {
  const supabase = createClient();
  const [items, setItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterCat, setFilterCat] = useState('all');
  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyItem);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    try {
      setError(null);
      const [itemsRes, catsRes] = await Promise.all([
        supabase
          .from('items')
          .select('*')
          .order('created_at', { ascending: false }),
        supabase.from('categories').select('*').order('sort_order'),
      ]);

      if (itemsRes.error) throw itemsRes.error;
      if (catsRes.error) throw catsRes.error;

      setItems(itemsRes.data || []);
      setCategories(catsRes.data || []);
    } catch (err) {
      console.error('Error loading data:', err);
      setError(err.message || 'Failed to load items');
      toast.error('Failed to load items');
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  useEffect(() => {
    load();
  }, [load]);

  const filtered = useMemo(() => {
    return items.filter((i) => {
      if (filterCat !== 'all' && i.category_id !== filterCat) return false
      if (search && !`${i.name_en} ${i.name_ar}`.toLowerCase().includes(search.toLowerCase())) return false
      return true
    })
  }, [items, search, filterCat])

  const openNew = () => { setEditing(null); setForm(emptyItem); setModal(true) }
  const openEdit = (it) => { setEditing(it); setForm({ ...emptyItem, ...it }); setModal(true) }

  const save = async () => {
    // Validate form
    const { success, errors: validationErrors, data: validData } = validateData(
      itemSchema,
      {
        ...form,
        price: Number(form.price) || 0,
        combo_price: form.has_combo ? Number(form.combo_price) || 0 : null,
        rating: Number(form.rating) || 0,
      }
    );

    if (!success) {
      setErrors(validationErrors);
      toast.error('Please fix validation errors');
      return;
    }

    setSaving(true);
    setErrors({});

    try {
      const payload = {
        ...validData,
        category_id: form.category_id || null,
      };

      let response;
      if (editing) {
        response = await supabase.from('items').update(payload).eq('id', editing.id);
      } else {
        response = await supabase.from('items').insert(payload);
      }

      if (response.error) throw response.error;

      toast.success(editing ? 'Item updated' : 'Item added');
      setModal(false);
      setForm(emptyItem);
      load();
    } catch (err) {
      console.error('Error saving item:', err);
      toast.error(err.message || 'Failed to save item');
    } finally {
      setSaving(false);
    }
  };

  const remove = async (id) => {
    if (!confirm('Delete this item?')) return
    const { error } = await supabase.from('items').delete().eq('id', id)
    if (error) return toast.error(error.message)
    toast.success('Deleted')
    load()
  }

  const toggleAvail = async (it) => {
    const { error } = await supabase.from('items').update({ available: !it.available }).eq('id', it.id)
    if (error) return toast.error(error.message)
    setItems((prev) => prev.map((p) => p.id === it.id ? { ...p, available: !p.available } : p))
  }

  const catName = (id) => categories.find((c) => c.id === id)?.name_en || '—'

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold">Menu Items</h1>
          <p className="text-muted-foreground mt-1">{items.length} items · {items.filter(i=>i.available).length} available</p>
        </div>
        <Button onClick={openNew} className="bg-orange-500 hover:bg-orange-600 text-white gap-2">
          <Plus className="w-4 h-4" /> Add Item
        </Button>
      </div>

      <div className="bg-card/50 p-1 rounded-2xl border border-border flex flex-wrap gap-2 items-center">
        <div className="relative flex-1 min-w-[300px]">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name or description..."
            className="pl-10 h-11 bg-transparent border-none focus-visible:ring-0 focus-visible:ring-offset-0"
          />
        </div>

        <div className="flex items-center gap-2 pr-1">
          <div className="h-8 w-[1px] bg-border mx-2 hidden sm:block" />
          <Select value={filterCat} onValueChange={setFilterCat}>
            <SelectTrigger className="w-[180px] h-9 bg-secondary border-none text-xs font-medium focus:ring-orange-500">
              <div className="flex items-center gap-2">
                <Filter className="w-3 h-3 text-orange-500" />
                <SelectValue placeholder="All Categories" />
              </div>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {categories.map((c) => (
                <SelectItem key={c.id} value={c.id}>{c.name_en}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-destructive/10 border border-destructive/30 rounded-lg flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-destructive flex-shrink-0" />
          <div className="flex-1">
            <p className="text-sm font-medium text-destructive">{error}</p>
            <button
              onClick={load}
              className="text-xs text-destructive hover:underline mt-1"
            >
              Try again
            </button>
          </div>
        </div>
      )}

      {loading ? (
        <TableSkeleton />
      ) : (
        <div className="bg-card border border-border rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs uppercase tracking-wider text-muted-foreground border-b border-border">
                  <th className="px-6 py-3 font-medium">Image</th>
                  <th className="px-6 py-3 font-medium">Name</th>
                  <th className="px-6 py-3 font-medium">Category</th>
                  <th className="px-6 py-3 font-medium">Price</th>
                  <th className="px-6 py-3 font-medium">Rating</th>
                  <th className="px-6 py-3 font-medium">Available</th>
                  <th className="px-6 py-3 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center text-muted-foreground">
                      No items
                    </td>
                  </tr>
                )}
                {filtered.map((it, idx) => (
                  <motion.tr
                    key={it.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: Math.min(idx, 10) * 0.03 }}
                    className={`border-b border-border hover:bg-secondary/30 transition-colors ${!it.available ? 'opacity-60 grayscale-[0.5]' : ''}`}
                  >
                    <td className="px-6 py-3">
                      {it.image_url ? (
                        <Image
                          src={it.image_url}
                          alt=""
                          width={40}
                          height={40}
                          unoptimized
                          className="w-10 h-10 rounded-lg object-cover"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center">
                          <ImageOff className="w-4 h-4 text-muted-foreground" />
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-3">
                      <div className="font-medium">{it.name_en}</div>
                      <div className="text-xs text-muted-foreground">{it.name_ar}</div>
                    </td>
                    <td className="px-6 py-3 text-muted-foreground">{catName(it.category_id)}</td>
                    <td className="px-6 py-3 font-mono font-semibold text-orange-500">
                      ${Number(it.price).toFixed(2)}
                    </td>
                    <td className="px-6 py-3">
                      <span className="inline-flex items-center gap-1 font-mono text-xs">
                        <Star className="w-3 h-3 text-orange-500 fill-orange-500" />
                        {Number(it.rating || 0).toFixed(1)}
                      </span>
                    </td>
                    <td className="px-6 py-3">
                      <Switch
                        checked={it.available}
                        onCheckedChange={() => toggleAvail(it)}
                        className="data-[state=checked]:bg-orange-500"
                      />
                    </td>
                    <td className="px-6 py-3 text-right">
                      <div className="inline-flex gap-1">
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => openEdit(it)}
                          className="h-8 w-8"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => remove(it.id)}
                          className="h-8 w-8 hover:text-destructive"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <Dialog open={modal} onOpenChange={setModal}>
        <DialogContent className="max-w-2xl bg-card border-border max-h-[90vh] overflow-y-auto scrollbar-thin">
          <DialogHeader>
            <DialogTitle className="font-display text-xl">
              {editing ? 'Edit Item' : 'Add New Item'}
            </DialogTitle>
          </DialogHeader>
          {Object.keys(errors).length > 0 && (
            <div className="p-3 bg-destructive/10 border border-destructive/30 rounded-lg">
              <p className="text-sm font-medium text-destructive mb-2">Please fix the following errors:</p>
              <ul className="text-xs text-destructive space-y-1">
                {Object.entries(errors).map(([key, msg]) => (
                  <li key={key}>• {msg}</li>
                ))}
              </ul>
            </div>
          )}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
            <div>
              <Label className="text-xs uppercase tracking-wider text-muted-foreground">Name (EN)</Label>
              <Input
                value={form.name_en}
                onChange={(e) => setForm({ ...form, name_en: e.target.value })}
                className="mt-1.5 bg-secondary border-border"
              />
            </div>
            <div><Label className="text-xs uppercase tracking-wider text-muted-foreground">Name (AR)</Label><Input value={form.name_ar || ''} onChange={(e)=>setForm({...form, name_ar: e.target.value})} className="mt-1.5 bg-secondary border-border" dir="rtl" /></div>
            <div className="md:col-span-2"><Label className="text-xs uppercase tracking-wider text-muted-foreground">Description (EN)</Label><Textarea value={form.desc_en || ''} onChange={(e)=>setForm({...form, desc_en: e.target.value})} className="mt-1.5 bg-secondary border-border" rows={2} /></div>
            <div className="md:col-span-2"><Label className="text-xs uppercase tracking-wider text-muted-foreground">Description (AR)</Label><Textarea value={form.desc_ar || ''} onChange={(e)=>setForm({...form, desc_ar: e.target.value})} className="mt-1.5 bg-secondary border-border" rows={2} dir="rtl" /></div>
            <div><Label className="text-xs uppercase tracking-wider text-muted-foreground">Category</Label>
              <Select value={form.category_id || ''} onValueChange={(v) => setForm({...form, category_id: v})}>
                <SelectTrigger className="mt-1.5 bg-secondary border-border"><SelectValue placeholder="Select category" /></SelectTrigger>
                <SelectContent>{categories.map((c)=><SelectItem key={c.id} value={c.id}>{c.name_en}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><Label className="text-xs uppercase tracking-wider text-muted-foreground">Price</Label><Input type="number" step="0.01" value={form.price} onChange={(e)=>setForm({...form, price: e.target.value})} className="mt-1.5 bg-secondary border-border font-mono" /></div>
            <div className="md:col-span-2"><Label className="text-xs uppercase tracking-wider text-muted-foreground">Image URL</Label><Input value={form.image_url || ''} onChange={(e)=>setForm({...form, image_url: e.target.value})} className="mt-1.5 bg-secondary border-border" placeholder="https://..." /></div>

            <div className="md:col-span-2 flex items-center justify-between p-3 rounded-lg bg-secondary">
              <div>
                <Label className="font-medium">Has Combo</Label>
                <p className="text-xs text-muted-foreground">Offer a combo meal option</p>
              </div>
              <Switch checked={form.has_combo} onCheckedChange={(v)=>setForm({...form, has_combo: v})} className="data-[state=checked]:bg-orange-500" />
            </div>
            {form.has_combo && (
              <>
                <div><Label className="text-xs uppercase tracking-wider text-muted-foreground">Combo Price</Label><Input type="number" step="0.01" value={form.combo_price || ''} onChange={(e)=>setForm({...form, combo_price: e.target.value})} className="mt-1.5 bg-secondary border-border font-mono" /></div>
                <div></div>
                <div><Label className="text-xs uppercase tracking-wider text-muted-foreground">Combo Desc (EN)</Label><Input value={form.combo_desc_en || ''} onChange={(e)=>setForm({...form, combo_desc_en: e.target.value})} className="mt-1.5 bg-secondary border-border" /></div>
                <div><Label className="text-xs uppercase tracking-wider text-muted-foreground">Combo Desc (AR)</Label><Input value={form.combo_desc_ar || ''} onChange={(e)=>setForm({...form, combo_desc_ar: e.target.value})} className="mt-1.5 bg-secondary border-border" dir="rtl" /></div>
              </>
            )}

            <div className="md:col-span-2 flex items-center justify-between p-3 rounded-lg bg-secondary">
              <div>
                <Label className="font-medium">Available</Label>
                <p className="text-xs text-muted-foreground">Show on customer menu</p>
              </div>
              <Switch checked={form.available} onCheckedChange={(v)=>setForm({...form, available: v})} className="data-[state=checked]:bg-orange-500" />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-4 border-t border-border">
            <Button variant="outline" onClick={() => setModal(false)}>Cancel</Button>
            <Button onClick={save} disabled={saving || !form.name_en} className="bg-orange-500 hover:bg-orange-600 text-white min-w-[100px]">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : (editing ? 'Update' : 'Create')}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
