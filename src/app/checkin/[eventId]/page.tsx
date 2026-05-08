'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { QrCode, Search, LogOut, CheckCircle2, AlertCircle, Lock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'

export default function EventCheckinPage() {
  const params = useParams()
  const eventId = params.eventId as string
  const router = useRouter()
  const supabase = createClient()

  const [event, setEvent] = useState<any>(null)
  const [stats, setStats] = useState({ checkedIn: 0, pending: 0 })
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<any[]>([])
  const [recentActivity, setRecentActivity] = useState<any[]>([])
  const [message, setMessage] = useState<{type: 'success'|'error'|'warning', text: string} | null>(null)
  const [isOnline, setIsOnline] = useState(true)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [pin, setPin] = useState('')
  const [pinError, setPinError] = useState('')
  const [loading, setLoading] = useState(true)

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

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      
      // If organizer is logged in, they bypass PIN
      if (user?.user_metadata?.role === 'organizer') {
        setIsAuthenticated(true)
      } else {
        // Check if PIN session exists in localStorage for this event
        const savedPin = localStorage.getItem(`checkin_auth_${eventId}`)
        if (savedPin) {
          setIsAuthenticated(true)
        }
      }
      
      // Fetch event details
      const { data: eventData } = await supabase
        .from('events')
        .select('*')
        .eq('id', eventId)
        .single()
      
      if (eventData) {
        setEvent(eventData)
      }
      setLoading(false)
    }
    checkAuth()
  }, [eventId, supabase])

  const handlePinSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setPinError('')
    
    const { data, error } = await supabase
      .from('event_access')
      .select('id')
      .eq('event_id', eventId)
      .eq('pin_code', pin)
      .eq('role', 'staff')
      .single()

    if (data && !error) {
      setIsAuthenticated(true)
      localStorage.setItem(`checkin_auth_${eventId}`, 'true')
    } else {
      setPinError('Invalid PIN code. Please try again.')
    }
  }

  useEffect(() => {
    if (!isAuthenticated || !eventId) return

    const fetchData = async () => {
      const { count: checkedIn } = await supabase.from('guests').select('id', { count: 'exact', head: true }).eq('event_id', eventId).eq('checkin_status', 'checked_in')
      const { count: totalConfirmed } = await supabase.from('guests').select('id', { count: 'exact', head: true }).eq('event_id', eventId).eq('rsvp_status', 'confirmed')
      
      setStats({
        checkedIn: checkedIn || 0,
        pending: Math.max(0, (totalConfirmed || 0) - (checkedIn || 0))
      })

      const { data: recent } = await supabase
        .from('guests')
        .select('id, checkin_timestamp, full_name')
        .eq('event_id', eventId)
        .eq('checkin_status', 'checked_in')
        .order('checkin_timestamp', { ascending: false })
        .limit(5)

      if (recent) {
        setRecentActivity(recent.map(r => ({
          id: r.id,
          name: r.full_name,
          time: r.checkin_timestamp ? new Date(r.checkin_timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Now'
        })))
      }
    }

    fetchData()
    const channel = supabase.channel(`event-${eventId}-checkins`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'checkins', filter: `event_id=eq.${eventId}` }, fetchData)
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [eventId, isAuthenticated, supabase])

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!searchQuery.trim() || !eventId) return

    const { data } = await supabase
      .from('guests')
      .select('id, rsvp_status, checkin_status, full_name')
      .eq('event_id', eventId)
      .ilike('full_name', `%${searchQuery}%`)
      .limit(5)

    if (data) setSearchResults(data)
  }

  const handleCheckIn = async (guestId: string) => {
    setMessage(null)
    
    const { error } = await supabase
      .from('guests')
      .update({
        checkin_status: 'checked_in',
        checkin_timestamp: new Date().toISOString()
      })
      .eq('id', guestId)

    if (error) {
      setMessage({ type: 'error', text: 'Failed to check in.' })
    } else {
      setMessage({ type: 'success', text: 'Check-in successful!' })
      setSearchQuery('')
      setSearchResults([])
      setTimeout(() => setMessage(null), 3000)
    }
  }

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-white font-heading">Loading...</div>

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#FAFAF9] flex items-center justify-center p-4">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-sm">
          <Card className="shadow-2xl border-0 overflow-hidden">
            <div className="bg-primary p-8 text-center text-white">
              <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-4 backdrop-blur-md">
                <Lock className="w-8 h-8" />
              </div>
              <h1 className="text-xl font-bold font-heading">Check-in Access</h1>
              <p className="text-sm text-white/70 mt-1">{event?.title || 'Event Restricted'}</p>
            </div>
            <CardContent className="p-8">
              <form onSubmit={handlePinSubmit} className="space-y-6">
                <div className="space-y-2">
                  <p className="text-sm font-medium text-center text-muted-foreground">Enter Event PIN</p>
                  <Input 
                    type="password" 
                    placeholder="••••" 
                    className="text-center text-2xl h-14 tracking-[1em] font-bold border-2 focus:border-primary rounded-xl"
                    value={pin}
                    onChange={(e) => setPin(e.target.value)}
                    maxLength={6}
                    autoFocus
                  />
                  {pinError && <p className="text-xs text-red-500 text-center animate-pulse">{pinError}</p>}
                </div>
                <Button className="w-full h-12 text-base" type="submit">Unlock Screen</Button>
                <p className="text-[10px] text-center text-muted-foreground uppercase tracking-widest">Authorized Personnel Only</p>
              </form>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white">
      <header className="border-b border-border sticky top-0 bg-white z-10">
        <div className="max-w-md mx-auto px-4 h-16 flex items-center justify-between">
          <div className="font-heading font-semibold text-primary flex items-center gap-2">
            STAFF<span className="text-foreground ml-1">CHECK-IN</span>
            {!isOnline && <span className="text-[10px] bg-red-100 text-red-600 px-2 py-0.5 rounded-full">Offline</span>}
          </div>
          <Button variant="ghost" size="icon" onClick={() => { localStorage.removeItem(`checkin_auth_${eventId}`); setIsAuthenticated(false); }} className="text-muted-foreground">
            <LogOut className="w-4 h-4" />
          </Button>
        </div>
      </header>

      <main className="max-w-md mx-auto px-4 py-6 space-y-6">
        <div className="text-center mb-2">
          <h1 className="text-lg font-bold font-heading">{event?.title}</h1>
          <p className="text-xs text-muted-foreground">Registration Desk</p>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Card className="bg-white border-0 shadow-sm bg-primary/5">
            <CardContent className="p-4 text-center">
              <p className="text-3xl font-bold text-primary font-heading">{stats.checkedIn}</p>
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground mt-1">Checked In</p>
            </CardContent>
          </Card>
          <Card className="bg-white border-0 shadow-sm">
            <CardContent className="p-4 text-center">
              <p className="text-3xl font-bold font-heading">{stats.pending}</p>
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground mt-1">Expected</p>
            </CardContent>
          </Card>
        </div>

        {message && (
          <div className={`p-4 rounded-2xl flex items-center gap-3 text-sm font-medium ${
            message.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-600'
          }`}>
            {message.type === 'success' ? <CheckCircle2 className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
            {message.text}
          </div>
        )}

        <div className="space-y-4">
          <div className="aspect-[4/3] bg-muted rounded-[2rem] border-2 border-dashed border-border flex flex-col items-center justify-center text-center p-8 active:scale-[0.98] transition-transform cursor-pointer overflow-hidden relative group">
            <div className="absolute inset-0 bg-primary/5 opacity-0 group-active:opacity-100 transition-opacity"></div>
            <QrCode className="w-16 h-16 text-primary/30 mb-4" />
            <p className="font-semibold text-lg">Scan Guest QR</p>
            <p className="text-xs text-muted-foreground mt-1">Position ticket code in frame</p>
          </div>

          <form onSubmit={handleSearch} className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input 
              placeholder="Search by name..." 
              className="pl-12 h-14 bg-[#FAFAF9] border-0 rounded-2xl text-base shadow-inner"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </form>

          {searchResults.length > 0 && (
            <AnimatePresence>
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="bg-white border rounded-2xl overflow-hidden divide-y">
                {searchResults.map(res => (
                  <div key={res.id} className="flex items-center justify-between p-4 hover:bg-muted/30 transition-colors">
                    <div>
                      <p className="font-bold text-sm">{res.full_name}</p>
                      <p className="text-[10px] text-muted-foreground uppercase tracking-wider">{res.checkin_status === 'checked_in' ? 'Already Checked In' : res.rsvp_status}</p>
                    </div>
                    {res.rsvp_status === 'confirmed' && res.checkin_status !== 'checked_in' ? (
                      <Button size="sm" onClick={() => handleCheckIn(res.id)} className="rounded-xl px-4">Check In</Button>
                    ) : (
                      <span className="text-[10px] bg-muted px-2 py-1 rounded text-muted-foreground">
                        {res.checkin_status === 'checked_in' ? 'Complete' : 'Not Confirmed'}
                      </span>
                    )}
                  </div>
                ))}
              </motion.div>
            </AnimatePresence>
          )}
        </div>

        {recentActivity.length > 0 && (
          <div className="space-y-3 pt-4">
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em] mb-4">Latest Arrivals</p>
            {recentActivity.map((item) => (
              <motion.div key={item.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} className="flex items-center justify-between p-4 bg-[#FAFAF9] rounded-2xl border border-border/50">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-green-100 flex items-center justify-center">
                    <CheckCircle2 className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm font-bold">{item.name}</p>
                    <p className="text-[10px] text-muted-foreground uppercase">{item.time}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
