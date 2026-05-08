'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { BarChart3, Download, Users, UserCheck, UserX } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { createClient } from '@/lib/supabase/client'

export default function AnalyticsPage() {
  const supabase = createClient()
  const [loading, setLoading] = useState(true)
  const [metrics, setMetrics] = useState({ invited: 0, confirmed: 0, checkedIn: 0, noShows: 0 })
  const [funnel, setFunnel] = useState({ rsvpRate: 0, attendanceRate: 0, noShowRate: 0 })
  const [eventMetrics, setEventMetrics] = useState<any[]>([])

  useEffect(() => {
    const fetchAnalytics = async () => {
      setLoading(true)
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // Fetch all events for organizer
      const { data: events } = await supabase.from('events').select('id, title').eq('organizer_id', user.id)
      if (!events || events.length === 0) {
        setLoading(false)
        return
      }

      const eventIds = events.map(e => e.id)

      // Fetch guests (invited)
      const { data: guests } = await supabase.from('guests').select('id, event_id').in('event_id', eventIds)
      
      // Fetch rsvps (confirmed)
      const { data: rsvps } = await supabase.from('rsvp_responses').select('id, event_id, status').in('event_id', eventIds).eq('status', 'confirmed')

      // Fetch checkins
      const { data: checkins } = await supabase.from('checkins').select('id, event_id').in('event_id', eventIds)

      const totalInvited = guests?.length || 0
      const totalConfirmed = rsvps?.length || 0
      const totalCheckedIn = checkins?.length || 0
      const totalNoShows = Math.max(0, totalConfirmed - totalCheckedIn)

      setMetrics({
        invited: totalInvited,
        confirmed: totalConfirmed,
        checkedIn: totalCheckedIn,
        noShows: totalNoShows
      })

      setFunnel({
        rsvpRate: totalInvited > 0 ? Math.round((totalConfirmed / totalInvited) * 100) : 0,
        attendanceRate: totalConfirmed > 0 ? Math.round((totalCheckedIn / totalConfirmed) * 100) : 0,
        noShowRate: totalConfirmed > 0 ? Math.round((totalNoShows / totalConfirmed) * 100) : 0
      })

      // Breakdown per event
      const breakdown = events.map(event => {
        const evInvited = guests?.filter(g => g.event_id === event.id).length || 0
        const evConfirmed = rsvps?.filter(r => r.event_id === event.id).length || 0
        const evCheckedIn = checkins?.filter(c => c.event_id === event.id).length || 0
        return {
          event: event.title,
          invited: evInvited,
          confirmed: evConfirmed,
          checkedIn: evCheckedIn,
          revenue: 0 // Ticket sales logic would go here
        }
      })
      setEventMetrics(breakdown)
      setLoading(false)
    }

    fetchAnalytics()
  }, [supabase])

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Analytics</h1>
          <p className="text-sm text-muted-foreground mt-1">Event performance at a glance.</p>
        </div>
        <Button variant="outline" onClick={() => window.print()}><Download className="w-4 h-4 mr-2" />Export PDF</Button>
        <style jsx global>{`
          @media print {
            header, .sidebar, .no-print, button { display: none !important; }
            main { margin: 0 !important; padding: 0 !important; }
            .grid { grid-template-columns: 1fr 1fr !important; }
            .Card { break-inside: avoid; }
          }
        `}</style>
      </div>

      {loading ? (
        <div className="text-center py-10 text-muted-foreground">Calculating analytics...</div>
      ) : (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: 'Invited', value: metrics.invited, icon: Users },
              { label: 'Confirmed', value: metrics.confirmed, icon: UserCheck },
              { label: 'Checked In', value: metrics.checkedIn, icon: UserCheck },
              { label: 'No-Shows', value: metrics.noShows, icon: UserX },
            ].map((metric, i) => (
              <motion.div key={metric.label} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: i * 0.06 }}>
                <Card>
                  <CardContent className="p-5">
                    <metric.icon className="w-4 h-4 text-muted-foreground mb-3" strokeWidth={1.5} />
                    <p className="text-2xl font-semibold font-heading">{metric.value}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{metric.label}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>

          <Card>
            <CardHeader><CardTitle className="text-base">Conversion Funnel</CardTitle></CardHeader>
            <CardContent className="space-y-5">
              {[
                { label: 'RSVP Rate', desc: 'Invited → Confirmed', value: funnel.rsvpRate },
                { label: 'Attendance', desc: 'Confirmed → Checked In', value: funnel.attendanceRate },
                { label: 'No-Show', desc: 'Confirmed but absent', value: funnel.noShowRate },
              ].map((f) => (
                <div key={f.label} className="space-y-1.5">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="text-sm font-medium">{f.label}</p>
                      <p className="text-xs text-muted-foreground">{f.desc}</p>
                    </div>
                    <span className="text-sm font-semibold">{f.value}%</span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-1.5">
                    <div className="h-full rounded-full bg-primary" style={{ width: `${f.value}%` }} />
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-base">Per-Event Breakdown</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              {eventMetrics.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">No events found.</p>
              ) : eventMetrics.map((event) => (
                <div key={event.event} className="p-4 rounded-lg bg-muted/50">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-sm font-medium">{event.event}</h4>
                    {event.revenue > 0 && <span className="text-sm font-semibold text-primary">ETB {event.revenue.toLocaleString()}</span>}
                  </div>
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div>
                      <p className="text-lg font-semibold font-heading">{event.invited}</p>
                      <p className="text-xs text-muted-foreground">Invited</p>
                    </div>
                    <div>
                      <p className="text-lg font-semibold font-heading">{event.confirmed}</p>
                      <p className="text-xs text-muted-foreground">Confirmed</p>
                    </div>
                    <div>
                      <p className="text-lg font-semibold font-heading">{event.checkedIn}</p>
                      <p className="text-xs text-muted-foreground">Checked In</p>
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  )
}
