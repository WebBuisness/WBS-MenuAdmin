'use client'

import { useEffect, useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import {
  Phone,
  Store,
  Clock,
  Copy,
  Save,
  Loader2,
  AlertCircle,
  Smartphone,
  MessageSquare,
  Building2,
  CalendarDays,
  Info
} from 'lucide-react'
import { toast } from 'sonner'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

export default function SettingsPage() {
  const supabase = createClient()
  const [whatsapp, setWhatsapp] = useState('')
  const [isOpen, setIsOpen] = useState(true)
  const [restaurantName, setRestaurantName] = useState('')
  const [loading, setLoading] = useState(true)
  const [whatsappTemplate, setWhatsappTemplate] = useState('')
  const [saving, setSaving] = useState(false)
  const [openingHours, setOpeningHours] = useState({})
  const [activeTab, setActiveTab] = useState('general')

  const load = useCallback(async () => {
    try {
      const { data: settings, error } = await supabase.from('settings').select('*')
      if (error) throw error

      const map = {}
      ;(settings || []).forEach((s) => { map[s.key] = s.value })

      setWhatsapp(map.whatsapp_number || '')
      setIsOpen(map.restaurant_open === true || map.restaurant_open === 'true' || map.restaurant_open === undefined)
      setRestaurantName(map.restaurant_name || 'WBS Menu')

      let hours = {}
      if (typeof map.opening_hours === 'string') {
        try {
          hours = JSON.parse(map.opening_hours)
        } catch (e) {
          hours = {}
        }
      } else {
        hours = map.opening_hours || {}
      }
      setOpeningHours(hours)
      setWhatsappTemplate(map.whatsapp_template || '')
    } catch (error) {
      toast.error('Failed to load settings')
      console.error(error)
    } finally {
      setLoading(false)
    }
  }, [supabase])

  useEffect(() => { load() }, [load])

  const saveSetting = async (key, value) => {
    const { error } = await supabase.from('settings').upsert({
      key,
      value,
      updated_at: new Date().toISOString()
    })
    if (error) throw error
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      await Promise.all([
        saveSetting('whatsapp_number', whatsapp),
        saveSetting('restaurant_name', restaurantName),
        saveSetting('restaurant_open', isOpen),
        saveSetting('opening_hours', openingHours),
        saveSetting('whatsapp_template', whatsappTemplate),
      ])
      toast.success('All settings saved successfully')
    } catch (e) {
      toast.error(e.message)
    } finally {
      setSaving(false)
    }
  }

  const handleToggleClosed = (key) => {
    const next = { ...openingHours }
    const current = next[key]
    if (current === 'closed') {
      next[key] = ['09:00', '22:00']
    } else {
      next[key] = 'closed'
    }
    setOpeningHours(next)
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

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
        <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
        <p className="text-muted-foreground animate-pulse">Loading configurations...</p>
      </div>
    )
  }

  const days = [
    { label: 'Monday', key: '1' },
    { label: 'Tuesday', key: '2' },
    { label: 'Wednesday', key: '3' },
    { label: 'Thursday', key: '4' },
    { label: 'Friday', key: '5' },
    { label: 'Saturday', key: '6' },
    { label: 'Sunday', key: '0' },
  ]

  return (
    <div className="max-w-4xl mx-auto pb-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
        <div>
          <h1 className="text-4xl font-extrabold tracking-tight">Settings</h1>
          <p className="text-muted-foreground text-lg">Manage your restaurant preferences and configurations.</p>
        </div>
        <Button
          onClick={handleSave}
          disabled={saving}
          size="lg"
          className="bg-orange-500 hover:bg-orange-600 text-white shadow-lg shadow-orange-500/20"
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
          Save Changes
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-3 h-12 bg-muted/50 p-1">
          <TabsTrigger value="general" className="data-[state=active]:bg-background data-[state=active]:shadow-sm">
            <Building2 className="w-4 h-4 mr-2 hidden sm:inline" />
            General
          </TabsTrigger>
          <TabsTrigger value="hours" className="data-[state=active]:bg-background data-[state=active]:shadow-sm">
            <CalendarDays className="w-4 h-4 mr-2 hidden sm:inline" />
            Opening Hours
          </TabsTrigger>
          <TabsTrigger value="whatsapp" className="data-[state=active]:bg-background data-[state=active]:shadow-sm">
            <Smartphone className="w-4 h-4 mr-2 hidden sm:inline" />
            WhatsApp
          </TabsTrigger>
        </TabsList>

        <AnimatePresence mode="wait">
          <TabsContent value="general" key="general">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="space-y-6"
            >
              <Card className="overflow-hidden border-2 border-muted">
                <CardHeader className="bg-muted/30">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-orange-500/10 rounded-lg">
                      <Store className="w-5 h-5 text-orange-500" />
                    </div>
                    <div>
                      <CardTitle>Restaurant Identity</CardTitle>
                      <CardDescription>Basic information about your business.</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-6 space-y-6">
                  <div className="grid gap-2">
                    <Label htmlFor="name" className="text-sm font-semibold">Restaurant Name</Label>
                    <Input
                      id="name"
                      value={restaurantName}
                      onChange={(e) => setRestaurantName(e.target.value)}
                      placeholder="Enter restaurant name"
                      className="h-11"
                    />
                  </div>

                  <Separator />

                  <div className="flex items-center justify-between p-4 rounded-xl bg-orange-50/50 dark:bg-orange-950/10 border border-orange-100 dark:border-orange-900/30">
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <Label className="text-base font-semibold">Accepting Orders</Label>
                        <Badge variant={isOpen ? "default" : "destructive"} className={isOpen ? "bg-green-500 hover:bg-green-500" : ""}>
                          {isOpen ? "Online" : "Offline"}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {isOpen
                          ? "Customers can browse and place orders."
                          : "Orders are currently disabled. Customers will see a 'Closed' message."}
                      </p>
                    </div>
                    <Switch
                      checked={isOpen}
                      onCheckedChange={setIsOpen}
                      className="data-[state=checked]:bg-green-500"
                    />
                  </div>
                </CardContent>
              </Card>

              <Card className="border-2 border-muted">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Info className="w-4 h-4 text-muted-foreground" />
                    Quick Info
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-sm text-muted-foreground">
                  The restaurant name and status are visible to all customers visiting your menu page.
                  Make sure to keep your status updated to manage customer expectations.
                </CardContent>
              </Card>
            </motion.div>
          </TabsContent>

          <TabsContent value="hours" key="hours">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              <Card className="border-2 border-muted">
                <CardHeader className="bg-muted/30">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-orange-500/10 rounded-lg">
                      <Clock className="w-5 h-5 text-orange-500" />
                    </div>
                    <div>
                      <CardTitle>Operating Schedule</CardTitle>
                      <CardDescription>Set your weekly opening and closing times.</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-6">
                  <div className="grid gap-3">
                    {days.map((day) => {
                      const times = openingHours[day.key] || ['09:00', '22:00']
                      const isClosed = times === 'closed'

                      return (
                        <div
                          key={day.key}
                          className={`group flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 rounded-xl border transition-all duration-200 ${
                            isClosed
                            ? 'bg-muted/20 border-dashed opacity-75'
                            : 'bg-card hover:border-orange-200 dark:hover:border-orange-900/50 shadow-sm'
                          }`}
                        >
                          <div className="flex items-center gap-3 min-w-[120px]">
                            <span className="font-bold text-sm tracking-tight">{day.label}</span>
                            {isClosed && <Badge variant="secondary" className="text-[10px]">CLOSED</Badge>}
                          </div>

                          <div className="flex items-center gap-2 w-full sm:w-auto">
                            {!isClosed ? (
                              <div className="flex items-center gap-2 bg-muted/50 p-1 rounded-lg border">
                                <Input
                                  className="w-[100px] h-8 bg-transparent border-none focus-visible:ring-0 text-center font-mono text-sm"
                                  type="time"
                                  value={times[0]}
                                  onChange={(e) => setOpeningHours({
                                    ...openingHours,
                                    [day.key]: [e.target.value, times[1]]
                                  })}
                                />
                                <span className="text-[10px] font-bold text-muted-foreground px-1 uppercase">to</span>
                                <Input
                                  className="w-[100px] h-8 bg-transparent border-none focus-visible:ring-0 text-center font-mono text-sm"
                                  type="time"
                                  value={times[1]}
                                  onChange={(e) => setOpeningHours({
                                    ...openingHours,
                                    [day.key]: [times[0], e.target.value]
                                  })}
                                />
                              </div>
                            ) : (
                              <div className="flex-1 sm:flex-none h-10 flex items-center px-8 rounded-lg bg-red-500/5 text-red-500/70 text-xs font-semibold uppercase tracking-wider border border-red-500/10">
                                Not Operating
                              </div>
                            )}
                          </div>

                          <div className="flex items-center gap-2 ml-auto">
                            <TooltipProvider>
                              {!isClosed && (
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      onClick={() => handleApplyToAll(day.key)}
                                      className="h-9 w-9 rounded-full hover:bg-orange-500/10 hover:text-orange-600 transition-colors"
                                    >
                                      <Copy className="w-4 h-4" />
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>Apply these hours to all days</TooltipContent>
                                </Tooltip>
                              )}
                            </TooltipProvider>

                            <Button
                              variant={isClosed ? "outline" : "ghost"}
                              size="sm"
                              onClick={() => handleToggleClosed(day.key)}
                              className={`h-9 px-4 rounded-full text-xs font-bold uppercase tracking-wider transition-all ${
                                isClosed
                                ? 'text-green-600 border-green-200 hover:bg-green-50'
                                : 'text-red-500 hover:bg-red-50'
                              }`}
                            >
                              {isClosed ? 'Open' : 'Close'}
                            </Button>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </TabsContent>

          <TabsContent value="whatsapp" key="whatsapp">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="space-y-6"
            >
              <Card className="border-2 border-muted overflow-hidden">
                <CardHeader className="bg-muted/30">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-green-500/10 rounded-lg">
                      <Phone className="w-5 h-5 text-green-600" />
                    </div>
                    <div>
                      <CardTitle>WhatsApp Integration</CardTitle>
                      <CardDescription>Configure how orders are received on WhatsApp.</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-6 space-y-6">
                  <div className="grid gap-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="whatsapp" className="text-sm font-semibold">WhatsApp Number</Label>
                      <span className="text-[10px] text-muted-foreground bg-muted px-2 py-0.5 rounded-full font-mono uppercase">International Format</span>
                    </div>
                    <div className="relative">
                      <Smartphone className="absolute left-3 top-3 w-5 h-5 text-muted-foreground/50" />
                      <Input 
                        id="whatsapp"
                        value={whatsapp}
                        onChange={(e) => setWhatsapp(e.target.value)}
                        className="pl-10 h-11 font-mono"
                        placeholder="+966500000000"
                      />
                    </div>
                    <p className="text-[11px] text-muted-foreground flex items-center gap-1.5 mt-1">
                      <AlertCircle className="w-3 h-3" />
                      Include country code without spaces (e.g., +966 for Saudi Arabia).
                    </p>
                  </div>

                  <Separator />

                  <div className="grid gap-3">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="template" className="text-sm font-semibold">Order Message Template</Label>
                      <Badge variant="outline" className="text-[10px] font-mono">TEXT-ONLY</Badge>
                    </div>
                    <Textarea
                      id="template"
                      value={whatsappTemplate}
                      onChange={(e) => setWhatsappTemplate(e.target.value)}
                      className="min-h-[200px] p-4 rounded-xl bg-muted/20 border-muted text-sm font-mono leading-relaxed resize-y focus:ring-orange-500"
                      placeholder="Compose your message..."
                    />

                    <div className="p-4 rounded-xl bg-blue-50 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900/30">
                      <h4 className="text-xs font-bold text-blue-700 dark:text-blue-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                        <MessageSquare className="w-3 h-3" />
                        Available Placeholders
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {['orderNo', 'items', 'total', 'name', 'phone', 'address'].map(p => (
                          <code key={p} className="text-[10px] bg-white dark:bg-black/40 px-2 py-1 rounded border border-blue-200 dark:border-blue-900/50 font-bold text-blue-600 dark:text-blue-300">
                            {`{{${p}}}`}
                          </code>
                        ))}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-2 border-muted">
                <CardHeader>
                  <CardTitle className="text-lg">Preview Example</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="bg-[#E5DDD5] dark:bg-zinc-900 rounded-2xl p-4 max-w-sm mx-auto shadow-inner">
                    <div className="bg-white dark:bg-zinc-800 p-3 rounded-lg rounded-tl-none shadow-sm relative border-l-4 border-l-green-500">
                      <p className="text-xs whitespace-pre-wrap font-sans leading-relaxed">
                        {whatsappTemplate
                          .replace('{{orderNo}}', '1234')
                          .replace('{{name}}', 'John Doe')
                          .replace('{{items}}', '• 2x Burger Special\n• 1x Cold Drink')
                          .replace('{{total}}', '$45.00')
                          .replace('{{address}}', '123 Street Name')
                          .replace('{{phone}}', '+966500000000') || "Your message will appear here..."
                        }
                      </p>
                      <span className="text-[9px] text-muted-foreground block text-right mt-1">10:45 AM</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </TabsContent>
        </AnimatePresence>
      </Tabs>
    </div>
  )
}
