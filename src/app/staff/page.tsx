'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { QrCode, Search, LogOut, CheckCircle2, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useConfirm } from '@/components/confirm-provider'
import { Badge } from '@/components/ui/badge'

export default function StaffPortal() {
  const router = useRouter()
  const supabase = createClient()
  const confirm = useConfirm()

  const [events, setEvents] = useState<any[]>([])
  const [selectedEventId, setSelectedEventId] = useState<string>('')
  const [stats, setStats] = useState({ checkedIn: 0, pending: 0 })
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<any[]>([])
  const [recentActivity, setRecentActivity] = useState<any[]>([])
  const [message, setMessage] = useState<{type: 'success'|'error'|'warning', text: string} | null>(null)
  const [isOnline, setIsOnline] = useState(true)

  useEffect(() => {
    setIsOnline(navigator.onLine)
    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)
    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  const syncOfflineCheckins = async () => {
    if (!navigator.onLine) return
    const queue = JSON.parse(localStorage.getItem('offlineCheckins') || '[]')
    if (queue.length === 0) return

    const { data: { user } } = await supabase.auth.getUser()
    
    let successCount = 0
    for (const item of queue) {
      const { error } = await supabase.from('checkins').insert({
        event_id: item.eventId,
        guest_id: item.guestId,
        rsvp_id: item.rsvpId,
        checked_in_by: user?.id,
        method: 'name_search_offline',
        checked_in_at: item.timestamp
      })
      if (!error || error.code === '23505') { // 23505 is unique violation, meaning already checked in, so we can consider it "processed"
        successCount++
      }
    }
    
    localStorage.removeItem('offlineCheckins')
    if (successCount > 0) {
      setMessage({ type: 'success', text: `Synced ${successCount} offline check-ins!` })
      setTimeout(() => setMessage(null), 3000)
    }
  }

  useEffect(() => {
    if (isOnline) {
      syncOfflineCheckins()
    }
  }, [isOnline])

  useEffect(() => {
    const fetchEvents = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/staff/login')
        return
      }

      const { data: accessData } = await supabase
        .from('event_access')
        .select('event_id, events(id, title)')
        .eq('user_id', user.id)
        .eq('role', 'staff')

      if (accessData && accessData.length > 0) {
        const staffEvents = accessData.map((a: any) => a.events)
        setEvents(staffEvents)
        setSelectedEventId(staffEvents[0].id)
      }
    }
    fetchEvents()
  }, [supabase])

  useEffect(() => {
    if (!selectedEventId) return

    const fetchData = async () => {
      // 1. Get stats
      const { count: checkedIn } = await supabase.from('checkins').select('*', { count: 'exact', head: true }).eq('event_id', selectedEventId)
      const { count: totalConfirmed } = await supabase.from('rsvp_responses').select('*', { count: 'exact', head: true }).eq('event_id', selectedEventId).eq('status', 'confirmed')
      
      setStats({
        checkedIn: checkedIn || 0,
        pending: Math.max(0, (totalConfirmed || 0) - (checkedIn || 0))
      })

      // 2. Get recent activity
      const { data: recent } = await supabase
        .from('checkins')
        .select('id, checked_in_at, guests(full_name)')
        .eq('event_id', selectedEventId)
        .order('checked_in_at', { ascending: false })
        .limit(5)

      if (recent) {
        setRecentActivity(recent.map(r => ({
          id: r.id,
          name: (r.guests as any)?.full_name || 'Unknown',
          time: new Date(r.checked_in_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        })))
      }
    }

    fetchData()

    const channel = supabase.channel('staff-updates')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'checkins', filter: `event_id=eq.${selectedEventId}` }, fetchData)
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [selectedEventId, supabase])

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!searchQuery.trim() || !selectedEventId) return

    const { data } = await supabase
      .from('rsvp_responses')
      .select('id, status, guest_id, respondent_name')
      .eq('event_id', selectedEventId)
      .ilike('respondent_name', `%${searchQuery}%`)
      .limit(5)

    if (data) setSearchResults(data)
  }

  const handleCheckIn = async (rsvpId: string, guestId: string) => {
    setMessage(null)

    if (!isOnline) {
      const queue = JSON.parse(localStorage.getItem('offlineCheckins') || '[]')
      // Simple duplicate check in queue
      if (queue.some((q: any) => q.rsvpId === rsvpId)) {
        setMessage({ type: 'error', text: 'Already queued for check-in.' })
        return
      }
      
      queue.push({ rsvpId, guestId, eventId: selectedEventId, timestamp: new Date().toISOString() })
      localStorage.setItem('offlineCheckins', JSON.stringify(queue))
      
      setMessage({ type: 'warning', text: 'Saved offline. Will sync when connected.' })
      setSearchQuery('')
      setSearchResults([])
      
      // Optimistically update recent activity
      const guestName = searchResults.find(r => r.id === rsvpId)?.respondent_name || 'Guest'
      setRecentActivity(prev => [{
        id: `temp-${Date.now()}`,
        name: guestName,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }, ...prev].slice(0, 5))
      
      setStats(prev => ({ ...prev, checkedIn: prev.checkedIn + 1, pending: Math.max(0, prev.pending - 1) }))

      setTimeout(() => setMessage(null), 3000)
      return
    }

    const { data: { user } } = await supabase.auth.getUser()

    // Verify they aren't already checked in
    const { data: existing } = await supabase.from('checkins').select('id').eq('rsvp_id', rsvpId).single()
    
    if (existing) {
      setMessage({ type: 'error', text: 'Guest is already checked in.' })
      return
    }

    const { error } = await supabase.from('checkins').insert({
      event_id: selectedEventId,
      guest_id: guestId,
      rsvp_id: rsvpId,
      checked_in_by: user?.id,
      method: 'name_search'
    })

    if (error) {
      setMessage({ type: 'error', text: 'Failed to check in.' })
    } else {
      setMessage({ type: 'success', text: 'Check-in successful!' })
      setSearchQuery('')
      setSearchResults([])
      setTimeout(() => setMessage(null), 3000)
    }
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/staff/login')
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-background">
      <div className="pointer-events-none absolute inset-0 dot-pattern opacity-35" />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-72 bg-[linear-gradient(180deg,rgba(145,9,30,0.08),rgba(90,122,107,0.045)_42%,transparent)]" />

      <header className="border-b border-border/60 sticky top-0 bg-white/80 backdrop-blur-md z-10">
        <div className="max-w-md mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/staff" className="font-heading text-xl font-semibold tracking-tight flex items-center gap-2">
            <div>
              Addis<span className="text-primary">Events</span>
              <span className="ml-2 text-xs font-normal text-muted-foreground uppercase tracking-widest bg-muted px-2 py-1 rounded">Staff</span>
            </div>
            {!isOnline && (
              <span className="text-[9px] bg-red-100 text-red-600 px-2 py-0.5 rounded-full font-sans uppercase tracking-[0.2em] font-bold">
                Offline
              </span>
            )}
          </Link>
          <Button variant="ghost" size="icon" onClick={handleLogout} className="text-muted-foreground hover:text-destructive hover:bg-destructive/5 rounded-xl transition-colors">
            <LogOut className="w-4 h-4" />
          </Button>
        </div>
      </header>

      <main className="max-w-md mx-auto px-4 py-8 space-y-8 relative z-10">
        <div className="space-y-1">
          <h2 className="text-2xl font-heading font-bold tracking-tight">Staff Portal</h2>
          <p className="text-sm text-muted-foreground">Select an event to start check-ins.</p>
        </div>

        {events.length > 0 && (
          <Select value={selectedEventId} onValueChange={(val: string | null) => setSelectedEventId(val || '')}>
            <SelectTrigger className="bg-white border-border/60 h-16 rounded-2xl text-base font-semibold shadow-sm focus:ring-primary/20">
              <SelectValue placeholder="Select Event" />
            </SelectTrigger>
            <SelectContent className="rounded-2xl border-border/60 shadow-xl">
              {events.map(e => (
                <SelectItem key={e.id} value={e.id} className="py-3 focus:bg-primary/5">{e.title}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}

        <div className="grid grid-cols-2 gap-4">
          <Card className="bg-white border-border/60 shadow-sm rounded-2xl overflow-hidden group">
            <CardContent className="p-5 text-center relative">
              <div className="absolute top-0 left-0 w-full h-1 bg-primary scale-x-0 group-hover:scale-x-100 transition-transform origin-left" />
              <p className="text-3xl font-bold text-primary font-heading">{stats.checkedIn}</p>
              <p className="text-[10px] uppercase tracking-[0.2em] font-bold text-muted-foreground mt-2">Checked In</p>
            </CardContent>
          </Card>
          <Card className="bg-white border-border/60 shadow-sm rounded-2xl overflow-hidden group">
            <CardContent className="p-5 text-center relative">
              <div className="absolute top-0 left-0 w-full h-1 bg-foreground/10 scale-x-0 group-hover:scale-x-100 transition-transform origin-left" />
              <p className="text-3xl font-bold font-heading">{stats.pending}</p>
              <p className="text-[10px] uppercase tracking-[0.2em] font-bold text-muted-foreground mt-2">Remaining</p>
            </CardContent>
          </Card>
        </div>

        {message && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`p-4 rounded-2xl flex items-center gap-3 text-sm font-medium shadow-sm ${
              message.type === 'success' ? 'bg-green-50 text-green-700 border border-green-100' : 
              message.type === 'warning' ? 'bg-amber-50 text-amber-700 border border-amber-100' : 
              'bg-red-50 text-red-600 border border-red-100'
            }`}
          >
            {message.type === 'success' ? <CheckCircle2 className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
            {message.text}
          </motion.div>
        )}

        <div className="space-y-6">
          <motion.div 
            whileTap={{ scale: 0.98 }}
            className="aspect-[4/3] bg-white rounded-[2.5rem] border-2 border-dashed border-border/80 flex flex-col items-center justify-center text-center p-10 group active:bg-primary/5 transition-all cursor-pointer shadow-sm hover:border-primary/40" 
            onClick={() => confirm({ title: "Scan QR", description: "Camera integration would open here.", confirmText: "OK", cancelText: "" })}
          >
            <div className="w-20 h-20 rounded-3xl bg-primary/5 flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
              <QrCode className="w-10 h-10 text-primary" strokeWidth={1.5} />
            </div>
            <p className="font-bold text-xl tracking-tight">Scan Guest Ticket</p>
            <p className="text-sm text-muted-foreground mt-2 max-w-[200px]">Use the camera to scan and check-in guests automatically.</p>
          </motion.div>

          <div className="space-y-3">
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.3em] ml-1">Manual Search</p>
            <form onSubmit={handleSearch} className="relative group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
              <Input 
                placeholder="Search by guest name..." 
                className="pl-12 h-14 bg-white border-border/60 rounded-2xl text-base shadow-sm focus:ring-primary/20 transition-all"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </form>
          </div>

          {searchResults.length > 0 && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="bg-white border border-border/60 rounded-[2rem] overflow-hidden divide-y divide-border/60 shadow-lg"
            >
              {searchResults.map(res => (
                <div key={res.id} className="flex items-center justify-between p-5 hover:bg-primary/5 transition-colors">
                  <div>
                    <p className="font-bold text-base tracking-tight">{res.respondent_name}</p>
                    <Badge variant="outline" className={`text-[9px] uppercase tracking-widest mt-1 border-0 px-0 ${res.status === 'confirmed' ? 'text-green-600' : 'text-amber-600'}`}>
                      {res.status}
                    </Badge>
                  </div>
                  {res.status === 'confirmed' ? (
                    <Button size="sm" onClick={() => handleCheckIn(res.id, res.guest_id)} className="rounded-xl px-5 h-10 shadow-md shadow-primary/10">
                      Check In
                    </Button>
                  ) : (
                    <span className="text-[10px] bg-muted/50 px-3 py-1.5 rounded-lg text-muted-foreground font-bold uppercase tracking-wider">Blocked</span>
                  )}
                </div>
              ))}
            </motion.div>
          )}
        </div>

        {recentActivity.length > 0 && (
          <div className="space-y-4 pb-12 pt-4">
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.3em] ml-1">Latest Arrivals</p>
            <div className="space-y-3">
              {recentActivity.map((item, i) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="flex items-center justify-between p-4 bg-white border border-border/50 rounded-2xl shadow-sm group hover:border-primary/20 transition-all"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-green-50 flex items-center justify-center group-hover:scale-110 transition-transform">
                      <CheckCircle2 className="w-5 h-5 text-green-600" />
                    </div>
                    <div>
                      <p className="text-sm font-bold tracking-tight">{item.name}</p>
                      <p className="text-[10px] text-muted-foreground uppercase font-medium mt-0.5">{item.time}</p>
                    </div>
                  </div>
                  <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                </motion.div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
