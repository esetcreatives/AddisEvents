'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Calendar, Users, FileText, LogOut, CheckCircle2, Clock, MapPin } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { VenueMap } from '@/components/venue-map'
import { GuestList } from '@/components/GuestList'

export default function ClientPortal() {
  const router = useRouter()
  const supabase = createClient()
  const [vendors, setVendors] = useState<any[]>([])
  const [assets, setAssets] = useState<any[]>([])
  const [event, setEvent] = useState<any>(null)
  const [stats, setStats] = useState({ totalInvited: 0, totalConfirmed: 0 })
  const [guests, setGuests] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchClientData = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: accessData } = await supabase
        .from('event_access')
        .select('event_id, events(*)')
        .eq('user_id', user.id)
        .eq('role', 'client')
        .single()

      if (accessData && accessData.events) {
        const eventData = accessData.events as any
        setEvent(eventData)

        // Concurrent fetching
        const [guestCountRes, confirmedCountRes, vendorsRes, assetsRes, guestsRes] = await Promise.all([
          supabase.from('guests').select('id', { count: 'exact', head: true }).eq('event_id', eventData.id),
          supabase.from('guests').select('id', { count: 'exact', head: true }).eq('event_id', eventData.id).eq('rsvp_status', 'confirmed'),
          supabase.from('event_vendors').select('*, vendors(*)').eq('event_id', eventData.id),
          supabase.from('client_assets').select('*').eq('event_id', eventData.id).order('created_at', { ascending: false }),
          supabase.from('guests').select('id, full_name, rsvp_status, seat_assignment').eq('event_id', eventData.id)
        ])

        setStats({
          totalInvited: guestCountRes.count || 0,
          totalConfirmed: confirmedCountRes.count || 0
        })
        setVendors(vendorsRes.data || [])
        setAssets(assetsRes.data || [])
        setGuests(guestsRes.data || [])
      }
      setLoading(false)
    }

    fetchClientData()
  }, [supabase])

  const handleApproveVendor = async (assignmentId: string) => {
    await supabase.from('event_vendors').update({ status: 'confirmed' }).eq('id', assignmentId)
    setVendors(prev => prev.map(v => v.id === assignmentId ? { ...v, status: 'confirmed' } : v))
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  const confirmedPercentage = stats.totalInvited > 0 
    ? (stats.totalConfirmed / stats.totalInvited) * 100 
    : 0

  return (
    <div className="min-h-screen bg-[#FAFAF9]">
      <header className="bg-white border-b border-border sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Link href="/portal" className="font-heading text-xl font-semibold tracking-tight">
              Addis<span className="text-primary">Events</span>
              <span className="ml-2 text-xs font-normal text-muted-foreground uppercase tracking-widest bg-muted px-2 py-1 rounded">Portal</span>
            </Link>
          </div>
          <Button variant="ghost" size="sm" onClick={handleLogout} className="text-muted-foreground hover:text-destructive">
            <LogOut className="w-4 h-4 mr-2" /> Sign Out
          </Button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-2xl font-semibold font-heading">Welcome, {event?.title ? 'to your portal' : 'to Addis Events'}</h1>
          <p className="text-sm text-muted-foreground mt-1">Review your event progress, guest list, and seating charts.</p>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-32 space-y-4">
            <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
            <p className="text-muted-foreground animate-pulse">Designing your portal...</p>
          </div>
        ) : !event ? (
          <div className="text-center py-20 border-2 border-dashed rounded-3xl bg-white shadow-sm max-w-2xl mx-auto mt-12">
            <Calendar className="w-16 h-16 text-muted-foreground/20 mx-auto mb-6" />
            <h3 className="font-heading text-xl font-semibold">No active event found</h3>
            <p className="text-sm text-muted-foreground max-w-sm mx-auto mt-2 leading-relaxed">
              It looks like you haven't been assigned to an event yet. Please contact your organizer to get access.
            </p>
          </div>
        ) : (
          <>
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="relative overflow-hidden rounded-[2.5rem] bg-[#0F0F0F] text-white p-8 sm:p-12 mb-12 shadow-2xl"
            >
              <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-primary/20 to-transparent opacity-50 blur-3xl pointer-events-none"></div>
              <div className="relative z-10 flex flex-col md:flex-row md:items-end justify-between gap-8">
                <div className="space-y-4">
                  <Badge variant="outline" className="text-primary-foreground/70 border-white/20 uppercase tracking-[0.2em] text-[10px] px-4 py-1">
                    Event Overview
                  </Badge>
                  <h1 className="text-4xl sm:text-5xl font-heading font-bold tracking-tight">{event.title}</h1>
                  <div className="flex flex-wrap items-center gap-6 text-primary-foreground/60 text-sm">
                    <div className="flex items-center gap-2"><Calendar className="w-4 h-4" /> {new Date(event.start_date).toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' })}</div>
                    <div className="flex items-center gap-2"><Clock className="w-4 h-4" /> {new Date(event.start_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                    <div className="flex items-center gap-2"><MapPin className="w-4 h-4" /> {event.venue_name || 'Venue TBD'}</div>
                  </div>
                </div>
                <div className="flex flex-col items-center gap-3">
                  <div className="relative w-28 h-28">
                    <svg className="w-full h-full transform -rotate-90">
                      <circle cx="56" cy="56" r="50" fill="transparent" stroke="rgba(255,255,255,0.1)" strokeWidth="6" />
                      <circle 
                        cx="56" cy="56" r="50" fill="transparent" stroke="var(--color-primary, #91091E)" strokeWidth="6" 
                        strokeDasharray={314}
                        strokeDashoffset={314 - (314 * confirmedPercentage) / 100}
                        strokeLinecap="round"
                        className="transition-all duration-1000 ease-out"
                      />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <span className="text-2xl font-bold">{Math.round(confirmedPercentage)}%</span>
                      <span className="text-[8px] uppercase tracking-tighter opacity-60">RSVPs</span>
                    </div>
                  </div>
                  <p className="text-[10px] uppercase tracking-widest text-white/40">Response Progress</p>
                </div>
              </div>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[
                { label: 'Confirmed Guests', value: stats.totalConfirmed, total: stats.totalInvited, icon: Users, color: 'text-green-500' },
                { label: 'Files & Assets', value: assets.length, total: 'files', icon: FileText, color: 'text-blue-500' },
                { label: 'Vendor Status', value: vendors.filter(v => v.status === 'confirmed').length, total: vendors.length, icon: CheckCircle2, color: 'text-amber-500' },
              ].map((item, i) => (
                <motion.div key={item.label} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: i * 0.1 }}>
                  <Card className="hover:border-primary/30 transition-all hover:shadow-lg border-0 shadow-sm bg-white overflow-hidden group">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between mb-4">
                        <div className={`p-2 rounded-xl bg-muted/50 ${item.color}`}>
                          <item.icon className="w-5 h-5" />
                        </div>
                        <div className="h-1 w-12 bg-muted rounded-full overflow-hidden">
                          <div className={`h-full bg-current ${item.color}`} style={{ width: item.total === 'files' ? '100%' : `${(item.value / (item.total as number || 1)) * 100}%` }}></div>
                        </div>
                      </div>
                      <p className="text-2xl font-bold font-heading">{item.value}</p>
                      <div className="flex items-center justify-between mt-1">
                        <p className="text-xs text-muted-foreground">{item.label}</p>
                        <p className="text-[10px] text-muted-foreground font-mono">/ {item.total}</p>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-12">
              <div className="lg:col-span-2">
                <Card className="shadow-sm overflow-hidden mb-8">
                  <CardHeader className="border-b bg-white">
                    <CardTitle className="text-base flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-primary" />
                      Venue & Location
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-6">
                    <VenueMap 
                      address={event.venue_address} 
                      venueName={event.venue_name} 
                    />
                  </CardContent>
                </Card>

                <Card className="shadow-sm overflow-hidden">
                  <CardHeader className="border-b bg-white flex flex-row items-center justify-between">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Users className="w-4 h-4 text-primary" />
                      Guest List
                    </CardTitle>
                    <Badge variant="outline">{guests.length} Total</Badge>
                  </CardHeader>
                  <CardContent className="p-0">
                    <GuestList guests={guests} />
                  </CardContent>
                </Card>
              </div>

              <div className="space-y-8">
                <Card className="shadow-sm">
                  <CardHeader className="border-b bg-white"><CardTitle className="text-base">Event Assets</CardTitle></CardHeader>
                  <CardContent className="p-0">
                    <div className="divide-y divide-border max-h-[240px] overflow-y-auto">
                      {assets.length === 0 ? (
                        <div className="p-8 text-center text-muted-foreground text-sm">No assets uploaded yet.</div>
                      ) : assets.map(asset => (
                        <div key={asset.id} className="flex items-center justify-between p-4 hover:bg-muted/30 transition-colors">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-primary/5 flex items-center justify-center">
                              <FileText className="w-4 h-4 text-primary" />
                            </div>
                            <div>
                              <p className="text-xs font-medium truncate max-w-[120px]">{asset.file_name}</p>
                              <p className="text-[9px] text-muted-foreground uppercase">{new Date(asset.created_at).toLocaleDateString()}</p>
                            </div>
                          </div>
                          <Button variant="ghost" size="sm" asChild className="h-7 text-[10px]">
                            <a href={asset.file_url} target="_blank" rel="noopener noreferrer">View</a>
                          </Button>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <Card className="shadow-sm">
                  <CardHeader className="border-b bg-white"><CardTitle className="text-base">Vendor Status</CardTitle></CardHeader>
                  <CardContent className="p-0">
                    <div className="divide-y divide-border max-h-[240px] overflow-y-auto">
                      {vendors.length === 0 ? (
                        <div className="p-8 text-center text-muted-foreground text-sm">No vendors assigned yet.</div>
                      ) : vendors.map(v => (
                        <div key={v.id} className="flex items-center justify-between p-4 hover:bg-muted/30 transition-colors">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-primary/5 flex items-center justify-center font-heading font-bold text-primary text-xs">
                              {(v.vendors as any)?.name?.[0]}
                            </div>
                            <div>
                              <p className="text-xs font-medium">{(v.vendors as any)?.name}</p>
                              <div className={`text-[9px] uppercase font-bold ${v.status === 'confirmed' ? 'text-green-600' : 'text-orange-600'}`}>
                                {v.status === 'confirmed' ? 'Approved' : 'Pending'}
                              </div>
                            </div>
                          </div>
                          {v.status === 'pending' && (
                            <Button size="sm" variant="outline" onClick={() => handleApproveVendor(v.id)} className="h-7 text-[10px]">
                              Approve
                            </Button>
                          )}
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  )
}
