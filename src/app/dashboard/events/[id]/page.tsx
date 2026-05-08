'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { ArrowLeft, Calendar, MapPin, Users, Clock, Globe, Lock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'

const statusStyle: Record<string, string> = {
  draft: 'bg-muted text-muted-foreground',
  published: 'bg-blue-50 text-blue-600',
  live: 'bg-green-50 text-green-600',
  completed: 'bg-stone-100 text-stone-600',
}

type EventRecord = {
  id: string
  title: string
  slug: string
  status: string
  is_public: boolean
  venue_name?: string | null
  venue_address?: string | null
  start_date: string
  updated_at: string
  description?: string | null
  client_id?: string | null
  capacity?: number | null
  event_type: string
  is_ticketed: boolean
}

export default function EventDetailsPage() {
  const { id } = useParams()
  const supabase = createClient()
  const [event, setEvent] = useState<EventRecord | null>(null)
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState(false)

  useEffect(() => {
    const fetchEvent = async () => {
      const { data } = await supabase.from('events').select('*').eq('id', id).single()
      if (data) setEvent(data)
      setLoading(false)
    }
    fetchEvent()
  }, [id, supabase])

  const handleStatusChange = async (newStatus: string) => {
    setUpdating(true)
    const isPublic = newStatus === 'published' || newStatus === 'live'
    const { error } = await supabase
      .from('events')
      .update({ status: newStatus, is_public: isPublic })
      .eq('id', id)
    
    if (!error) {
      setEvent((current) => current ? { ...current, status: newStatus, is_public: isPublic } : current)
    }
    setUpdating(false)
  }

  if (loading) return <div className="p-8 text-center text-muted-foreground">Loading event details...</div>
  if (!event) return <div className="p-8 text-center text-muted-foreground">Event not found.</div>

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/dashboard/events">
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <ArrowLeft className="w-4 h-4" />
            </Button>
          </Link>
          <h1 className="text-2xl font-semibold">{event.title}</h1>
        </div>
        <div className="flex items-center gap-3">
          <Select value={event.status} onValueChange={(v) => handleStatusChange(v || 'draft')} disabled={updating}>
            <SelectTrigger className="w-32 bg-white">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="draft">Draft</SelectItem>
              <SelectItem value="published">Published</SelectItem>
              <SelectItem value="live">Live</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
            </SelectContent>
          </Select>
          <Link href={`/e/${event.slug}`} target="_blank">
            <Button variant="outline" disabled={!event.is_public}><Globe className="w-4 h-4 mr-2" /> View RSVP</Button>
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Event Overview</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Venue</p>
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-primary" />
                  <span className="text-sm font-medium">{event.venue_name || 'No venue set'}</span>
                </div>
                <p className="text-xs text-muted-foreground ml-6">{event.venue_address}</p>
              </div>
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Date & Time</p>
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-primary" />
                  <span className="text-sm font-medium">
                    {new Date(event.start_date).toLocaleDateString(undefined, { dateStyle: 'long' })}
                  </span>
                </div>
                <div className="flex items-center gap-2 ml-6 text-xs text-muted-foreground">
                  <Clock className="w-3 h-3" />
                  {new Date(event.start_date).toLocaleTimeString(undefined, { timeStyle: 'short' })}
                </div>
              </div>
            </div>

            <Separator />

            <div className="space-y-2">
              <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Description</p>
              <p className="text-sm leading-relaxed text-muted-foreground">
                {event.description || 'No description provided.'}
              </p>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-base">Access Control</CardTitle>
              <Button variant="ghost" size="sm" className="h-7 text-xs" asChild>
                <Link href={`/dashboard/events/${event.id}/access`}>Manage</Link>
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground uppercase tracking-wider font-semibold">Clients</span>
                  <Badge variant="secondary" className="text-[10px]">{event.client_id ? '1 Assigned' : '0 Assigned'}</Badge>
                </div>
                {event.client_id ? (
                  <div className="flex items-center gap-2 text-sm p-2 bg-muted/30 rounded-lg">
                    <Users className="w-3.5 h-3.5 text-primary" />
                    <span className="truncate flex-1">Assigned Client</span>
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground italic">No client assigned yet.</p>
                )}
              </div>
              
              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground uppercase tracking-wider font-semibold">Staff PINs</span>
                  <Badge variant="outline" className="text-[10px]">Event-wide</Badge>
                </div>
                <div className="flex items-center gap-2 text-sm p-2 bg-muted/30 rounded-lg group">
                  <Lock className="w-3.5 h-3.5 text-amber-600" />
                  <span className="font-mono text-xs flex-1">Check-in PIN: ****</span>
                  <Link href={`/checkin/${event.id}`} target="_blank" className="text-[10px] text-primary opacity-0 group-hover:opacity-100 transition-opacity">Open Screen</Link>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-base text-center">Status</CardTitle></CardHeader>
            <CardContent className="text-center pb-6">
              <Badge className={`text-xs px-3 py-1 uppercase tracking-wider border-0 ${statusStyle[event.status]}`}>
                {event.status}
              </Badge>
              <p className="text-[10px] text-muted-foreground mt-2">
                Last updated: {new Date(event.updated_at).toLocaleDateString()}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-base text-center">Quick Stats</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center text-sm">
                <span className="text-muted-foreground">Capacity</span>
                <span className="font-semibold">{event.capacity}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-muted-foreground">Type</span>
                <span className="font-semibold capitalize">{event.event_type}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-muted-foreground">Ticketing</span>
                <span className="font-semibold">{event.is_ticketed ? 'Enabled' : 'Disabled'}</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

function Separator() {
  return <div className="h-px bg-border w-full" />
}
