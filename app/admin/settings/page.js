'use client'
import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Phone, Store, KeyRound, Loader2, Check, Clock, Copy, Ban } from 'lucide-react'
import { toast } from 'sonner'

export default function SettingsPage() {
  const supabase = createClient()
  const [whatsapp, setWhatsapp] = useState('')
  const [isOpen, setIsOpen] = useState(true)
  const [restaurantName, setRestaurantName] = useState('')
  const [loading, setLoading] = useState(true)
  const [whatsappTemplate, setWhatsappTemplate] = useState('')
  const [savingGeneral, setSavingGeneral] = useState(false)
  const [openingHours, setOpeningHours] = useState({})
  const [newPassword, setNewPassword] = useState('')
  const [savingPwd, setSavingPwd] = useState(false)
  const [user, setUser] = useState(null)

  const load = async () => {
    const [{ data: settings }, { data: userData }] = await Promise.all([
      supabase.from('settings').select('*'),
      supabase.auth.getUser(),
    ])
    setUser(userData.user)
    const map = {}
    ;(settings || []).forEach((s) => { map[s.key] = s.value })
    setWhatsapp(typeof map.whatsapp_number === 'string' ? map.whatsapp_number : (map.whatsapp_number || ''))
    setIsOpen(map.restaurant_open === true || map.restaurant_open === 'true' || map.restaurant_open === undefined ? (map.restaurant_open !== false) : false)
    setRestaurantName(typeof map.restaurant_name === 'string' ? map.restaurant_name : (map.restaurant_name || 'Döner House'))
    setOpeningHours(typeof map.opening_hours === 'string' ? JSON.parse(map.opening_hours) : (map.opening_hours || {}))
    setWhatsappTemplate(typeof map.whatsapp_template === 'string' ? map.whatsapp_template : (map.whatsapp_template || ''))
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  const saveSetting = async (key, value) => {
    const { error } = await supabase.from('settings').upsert({ key, value, updated_at: new Date().toISOString() })
    if (error) throw error
  }

  const saveGeneral = async () => {
    setSavingGeneral(true)
    try {
      await saveSetting('whatsapp_number', whatsapp)
      await saveSetting('restaurant_name', restaurantName)
      await saveSetting('restaurant_open', isOpen)
      await saveSetting('opening_hours', openingHours)
      await saveSetting('whatsapp_template', whatsappTemplate)
      toast.success('Settings saved')
    } catch (e) {
      toast.error(e.message)
    }
    setSavingGeneral(false)
  }

  const toggleOpen = async (val) => {
    setIsOpen(val)
    try {
      await saveSetting('restaurant_open', val)
      toast.success(val ? 'Restaurant OPEN' : 'Restaurant CLOSED')
    } catch (e) { toast.error(e.message) }
  }

  const changePassword = async () => {
    if (!newPassword || newPassword.length < 6) return toast.error('Password must be 6+ chars')
    setSavingPwd(true)
    const { error } = await supabase.auth.updateUser({ password: newPassword })
    setSavingPwd(false)
    if (error) return toast.error(error.message)
    toast.success('Password updated')
    setNewPassword('')
  }

  const handleToggleClosed = (key) => {
    const current = openingHours[key]
    if (current === 'closed') {
      setOpeningHours({ ...openingHours, [key]: ['09:00', '22:00'] })
    } else {
      setOpeningHours({ ...openingHours, [key]: 'closed' })
    }
  }

  const handleApplyToAll = (key) => {
    const source = openingHours[key]
    if (!source) return
    const next = { ...openingHours }
    ;['0', '1', '2', '3', '4', '5', '6'].forEach(k => {
      next[k] = Array.isArray(source) ? [...source] : source
    })
    setOpeningHours(next)
    toast.success('Applied to all days')
  }

  if (loading) return <div className="text-center py-20"><Loader2 className="w-5 h-5 animate-spin mx-auto text-orange-500" /></div>

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="font-display text-3xl font-bold">Settings</h1>
        <p className="text-muted-foreground mt-1">Configure your restaurant</p>
      </div>

      <motion.div initial={{opacity:0,y:10}} animate={{opacity:1,y:0}} className="bg-card border border-border rounded-2xl p-6">
        <div className="flex items-center gap-2 mb-4">
          <Store className="w-4 h-4 text-orange-500" />
          <h3 className="font-display text-lg font-semibold">Restaurant Status</h3>
        </div>
        <div className={`flex items-center justify-between p-4 rounded-xl border ${isOpen ? 'border-green-500/30 bg-green-500/5' : 'border-red-500/30 bg-red-500/5'}`}>
          <div>
            <div className="font-medium">{isOpen ? 'Currently OPEN' : 'Currently CLOSED'}</div>
            <p className="text-xs text-muted-foreground mt-0.5">{isOpen ? 'Customer app accepts orders' : 'Customer app shows closed banner'}</p>
          </div>
          <Switch checked={isOpen} onCheckedChange={toggleOpen} className="data-[state=checked]:bg-orange-500" />
        </div>
      </motion.div>

      <motion.div initial={{opacity:0,y:10}} animate={{opacity:1,y:0}} transition={{delay:0.1}} className="bg-card border border-border rounded-2xl p-6">
        <div className="flex items-center gap-2 mb-6">
          <Clock className="w-4 h-4 text-orange-500" />
          <h3 className="font-display text-lg font-semibold">Opening Hours</h3>
        </div>
        <div className="grid grid-cols-1 gap-3">
          {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day, i) => {
            const key = ((i + 1) % 7).toString() // Sunday is 0
            const times = openingHours[key] || ['09:00', '22:00']
            const isClosed = times === 'closed'

            return (
              <div key={day} className={`flex flex-wrap items-center justify-between gap-3 p-4 rounded-xl border transition-all ${isClosed ? 'bg-secondary/20 border-border/50 opacity-60' : 'bg-secondary/50 border-border shadow-sm'}`}>
                <div className="flex items-center gap-3 w-20">
                  <span className="text-sm font-bold tracking-tight">{day}</span>
                </div>

                <div className="flex items-center gap-2">
                  {isClosed ? (
                    <div className="h-9 flex items-center px-4 rounded-lg bg-red-500/10 border border-red-500/20 text-red-500 text-xs font-bold uppercase tracking-wider">
                      Closed
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <Input 
                        className="w-[100px] h-9 bg-card border-border text-xs font-medium focus:ring-orange-500" 
                        type="time" 
                        value={times[0]} 
                        onChange={(e) => setOpeningHours({...openingHours, [key]: [e.target.value, times[1]]})}
                      />
                      <span className="text-muted-foreground text-[10px] uppercase font-bold px-1">to</span>
                      <Input 
                        className="w-[100px] h-9 bg-card border-border text-xs font-medium focus:ring-orange-500" 
                        type="time" 
                        value={times[1]} 
                        onChange={(e) => setOpeningHours({...openingHours, [key]: [times[0], e.target.value]})}
                      />
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-1.5 ml-auto">
                  {!isClosed && (
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      onClick={() => handleApplyToAll(key)}
                      className="h-8 w-8 text-muted-foreground hover:text-orange-500 hover:bg-orange-500/10"
                      title="Apply to all days"
                    >
                      <Copy className="w-3.5 h-3.5" />
                    </Button>
                  )}
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => handleToggleClosed(key)}
                    className={`h-8 px-3 text-[10px] uppercase font-bold tracking-wider ${isClosed ? 'text-green-500 hover:text-green-600 hover:bg-green-500/10' : 'text-red-500 hover:text-red-600 hover:bg-red-500/10'}`}
                  >
                    {isClosed ? 'Open' : 'Close'}
                  </Button>
                </div>
              </div>
            )
          })}
        </div>
      </motion.div>

      <motion.div initial={{opacity:0,y:10}} animate={{opacity:1,y:0}} transition={{delay:0.1}} className="bg-card border border-border rounded-2xl p-6">
        <div className="flex items-center gap-2 mb-4">
          <Phone className="w-4 h-4 text-orange-500" />
          <h3 className="font-display text-lg font-semibold">General</h3>
        </div>
        <div className="space-y-4">
          <div><Label className="text-xs uppercase tracking-wider text-muted-foreground">Restaurant Name</Label><Input value={restaurantName} onChange={(e)=>setRestaurantName(e.target.value)} className="mt-1.5 bg-secondary border-border" /></div>
          <div><Label className="text-xs uppercase tracking-wider text-muted-foreground">WhatsApp Number</Label><Input value={whatsapp} onChange={(e)=>setWhatsapp(e.target.value)} className="mt-1.5 bg-secondary border-border font-mono" placeholder="+966500000000" /></div>
          <div>
            <Label className="text-xs uppercase tracking-wider text-muted-foreground">Order Message Template</Label>
            <textarea 
              value={whatsappTemplate} 
              onChange={(e)=>setWhatsappTemplate(e.target.value)} 
              className="mt-1.5 w-full min-h-[160px] p-3 rounded-lg bg-secondary border border-border text-sm font-mono scrollbar-thin resize-y focus:outline-none focus:ring-1 focus:ring-orange-500"
              placeholder="Use {{orderNo}}, {{items}}, {{total}}, {{name}}, {{address}}"
            />
            <p className="text-[10px] text-muted-foreground mt-1 tracking-tight">Available: {'{{orderNo}}, {{items}}, {{total}}, {{name}}, {{phone}}, {{address}}'}</p>
          </div>
          <Button onClick={saveGeneral} disabled={savingGeneral} className="bg-orange-500 hover:bg-orange-600 text-white gap-2">
            {savingGeneral ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
            Save changes
          </Button>
        </div>
      </motion.div>

      <motion.div initial={{opacity:0,y:10}} animate={{opacity:1,y:0}} transition={{delay:0.2}} className="bg-card border border-border rounded-2xl p-6">
        <div className="flex items-center gap-2 mb-4">
          <KeyRound className="w-4 h-4 text-orange-500" />
          <h3 className="font-display text-lg font-semibold">Admin Password</h3>
        </div>
        <p className="text-xs text-muted-foreground mb-3">Signed in as <span className="font-mono text-foreground">{user?.email}</span></p>
        <div className="flex gap-2">
          <Input type="password" value={newPassword} onChange={(e)=>setNewPassword(e.target.value)} className="bg-secondary border-border font-mono" placeholder="New password (6+ chars)" />
          <Button onClick={changePassword} disabled={savingPwd} className="bg-orange-500 hover:bg-orange-600 text-white whitespace-nowrap">
            {savingPwd ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Update'}
          </Button>
        </div>
      </motion.div>
    </div>
  )
}
