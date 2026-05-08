'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { QrCode, Search, Users, CheckCircle2, XCircle, Clock, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { createClient } from '@/lib/supabase/client'

export default function CheckinPage() {
  const supabase = createClient()
  const [events, setEvents] = useState<any[]>([])
  const [selectedEventId, setSelectedEventId] = useState<string>('')
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<any[]>([])
  const [stats, setStats] = useState({ total: 0, checkedIn: 0, pending: 0, noShow: 0 })
  const [loading, setLoading] = useState(true)
  const [searching, setSearching] = useState(false)

  useEffect(() => {
    const fetchEvents = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data } = await supabase.from('events').select('id, title').eq('organizer_id', user.id).order('start_date', { ascending: false })
      if (data && data.length > 0) {
        setEvents(data)
        setSelectedEventId(data[0].id)
      }
    }
    fetchEvents()
  }, [supabase])

  useEffect(() => {
    if (!selectedEventId) return
    
    const fetchStats = async () => {
      setLoading(true)
      
      // Fetch counts in parallel to minimize wait time
      const [guestsRes, checkinsRes, rsvpRes] = await Promise.all([
        supabase.from('guests').select('id', { count: 'exact', head: true }).eq('event_id', selectedEventId),
        supabase.from('checkins').select('id', { count: 'exact', head: true }).eq('event_id', selectedEventId),
        supabase.from('rsvp_responses').select('id', { count: 'exact', head: true }).eq('event_id', selectedEventId).eq('status', 'confirmed')
      ])
      
      const totalCount = guestsRes.count || 0
      const checkedInCount = checkinsRes.count || 0
      const confirmedCount = rsvpRes.count || 0
      
      setStats({
        total: totalCount,
        checkedIn: checkedInCount,
        pending: Math.max(0, confirmedCount - checkedInCount),
        noShow: Math.max(0, totalCount - confirmedCount)
      })
      setLoading(false)
    }

    fetchStats()

    const channel = supabase.channel('checkin-stats')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'checkins', filter: `event_id=eq.${selectedEventId}` }, fetchStats)
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [selectedEventId, supabase])

  useEffect(() => {
    if (!searchQuery || searchQuery.length < 2) {
      setSearchResults([])
      return
    }

    const searchGuests = async () => {
      setSearching(true)
      const { data } = await supabase
        .from('guests')
        .select(`
          id, 
          full_name, 
          seat_assignments (
            seating_tables (table_name)
          ),
          checkins(id)
        `)
        .eq('event_id', selectedEventId)
        .ilike('full_name', `%${searchQuery}%`)
        .limit(5)
      
      if (data) {
        const resultsWithCheckin = data.map((guest: any) => ({
          ...guest,
          isCheckedIn: (guest.checkins?.length || 0) > 0
        }))
        setSearchResults(resultsWithCheckin)
      }
      setSearching(false)
    }

    const timer = setTimeout(searchGuests, 300)
    return () => clearTimeout(timer)
  }, [searchQuery, selectedEventId, supabase])

  const handleCheckIn = async (guestId: string) => {
    const { error } = await supabase.from('checkins').insert({
      event_id: selectedEventId,
      guest_id: guestId
    })
    
    if (!error) {
      setSearchResults(prev => prev.map(g => g.id === guestId ? { ...g, isCheckedIn: true } : g))
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Check-in</h1>
          <p className="text-sm text-muted-foreground mt-1">Scan QR codes or search by name.</p>
        </div>
        {events.length > 0 && (
          <Select value={selectedEventId} onValueChange={(val) => setSelectedEventId(val || '')}>
            <SelectTrigger className="w-64 bg-white">
              <SelectValue placeholder="Select Event" />
            </SelectTrigger>
            <SelectContent>
              {events.map(e => <SelectItem key={e.id} value={e.id}>{e.title}</SelectItem>)}
            </SelectContent>
          </Select>
        )}
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Guests', value: stats.total, icon: Users },
          { label: 'Checked In', value: stats.checkedIn, icon: CheckCircle2 },
          { label: 'Remaining', value: stats.pending, icon: Clock },
          { label: 'Invited (Un-RSVPd)', value: stats.noShow, icon: XCircle },
        ].map((stat) => (
          <Card key={stat.label}>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <stat.icon className="w-4 h-4 text-muted-foreground" strokeWidth={1.5} />
                <div>
                  <p className="text-xl font-semibold font-heading">{loading ? '...' : stat.value}</p>
                  <p className="text-xs text-muted-foreground">{stat.label}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardContent className="p-5">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-medium">Attendance Progress</p>
            <span className="text-sm font-semibold text-primary">
              {stats.total > 0 ? Math.round((stats.checkedIn / stats.total) * 100) : 0}%
            </span>
          </div>
          <Progress value={stats.total > 0 ? (stats.checkedIn / stats.total) * 100 : 0} className="h-2" />
          <p className="text-xs text-muted-foreground mt-1.5">{stats.checkedIn} of {stats.total} guests</p>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
          <Card className="h-full">
            <CardHeader><CardTitle className="text-base">QR Scanner</CardTitle></CardHeader>
            <CardContent>
              <div className="aspect-square max-w-xs mx-auto rounded-xl border-2 border-dashed border-border flex flex-col items-center justify-center">
                <QrCode className="w-12 h-12 text-muted-foreground/30 mb-3" />
                <p className="text-sm text-muted-foreground text-center px-6 mb-3">Point camera at guest&apos;s QR code</p>
                <Button>Open Camera</Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.05 }}>
          <Card className="h-full">
            <CardHeader><CardTitle className="text-base">Name Search</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input 
                  placeholder="Search by name..." 
                  className="pl-10"
                  value={searchQuery} 
                  onChange={(e) => setSearchQuery(e.target.value)} 
                />
                {searching && <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin text-muted-foreground" />}
              </div>
              
              <div className="space-y-2 mt-4">
                {searchResults.length === 0 && searchQuery.length >= 2 && !searching && (
                  <p className="text-center text-sm text-muted-foreground py-4">No guests found.</p>
                )}
                {searchResults.map((guest) => (
                  <div key={guest.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/30 border border-transparent hover:border-primary/20 transition-all">
                    <div>
                      <p className="text-sm font-medium">{guest.full_name}</p>
                      <p className="text-xs text-muted-foreground">
                        {guest.seat_assignments?.[0]?.seating_tables?.table_name || 'No seat assigned'}
                      </p>
                    </div>
                    {guest.isCheckedIn ? (
                      <Badge variant="outline" className="bg-green-50 text-green-600 border-green-200">
                        <CheckCircle2 className="w-3 h-3 mr-1" /> Checked In
                      </Badge>
                    ) : (
                      <Button 
                        size="sm" 
                        variant="outline" 
                        className="text-primary hover:bg-primary/5"
                        onClick={() => handleCheckIn(guest.id)}
                      >
                        Check In
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  )
}
