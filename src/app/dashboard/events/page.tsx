'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { Calendar, Plus, Search, Users, MapPin, Clock, ArrowUpRight, MoreHorizontal } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { createClient } from '@/lib/supabase/client'
import { useConfirm } from '@/components/confirm-provider'

const statusStyle: Record<string, string> = {
  draft: 'bg-muted text-muted-foreground',
  published: 'bg-blue-50 text-blue-600',
  live: 'bg-green-50 text-green-600',
  completed: 'bg-stone-100 text-stone-600',
}

export default function EventsPage() {
  const supabase = createClient()
  const [events, setEvents] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [activeTab, setActiveTab] = useState('all')

  useEffect(() => {
    const fetchEvents = async () => {
      setLoading(true)
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // Fetch events and confirmed counts in a more optimized way if possible
      // For now, let's at least parallelize better or use a single query if schema allows
      // PostgREST 11+ supports aggregate functions in select, but let's stick to a robust approach
      const { data: eventsData, error } = await supabase
        .from('events')
        .select(`
          *,
          rsvp_responses(id)
        `)
        .eq('organizer_id', user.id)
        .eq('rsvp_responses.status', 'confirmed')
        .order('start_date', { ascending: false })

      if (eventsData) {
        const eventsWithCounts = eventsData.map((event: any) => ({
          ...event,
          confirmed: event.rsvp_responses?.length || 0
        }))
        setEvents(eventsWithCounts)
      }
      setLoading(false)
    }

    fetchEvents()

    const channel = supabase.channel('events-page-updates')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'events' }, fetchEvents)
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [supabase])

  const confirm = useConfirm()

  const handleDelete = async (id: string) => {
    const ok = await confirm({
      title: "Delete Event",
      description: "Are you sure you want to delete this event? This action cannot be undone.",
      confirmText: "Delete",
      variant: "destructive"
    })
    
    if (!ok) return
    
    const { error } = await supabase.from('events').delete().eq('id', id)
    if (error) {
      await confirm({
        title: "Error",
        description: "Failed to delete event: " + error.message,
        confirmText: "OK",
        cancelText: "" // Hide cancel
      })
    }
  }

  const handleDuplicate = async (event: any) => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { error } = await supabase.from('events').insert({
      ...event,
      id: undefined,
      created_at: undefined,
      updated_at: undefined,
      title: `${event.title} (Copy)`,
      slug: `${event.slug}-copy-${Math.random().toString(36).substring(2, 5)}`,
      organizer_id: user.id
    })
    
    if (error) {
      await confirm({
        title: "Error",
        description: "Failed to duplicate event: " + error.message,
        confirmText: "OK",
        cancelText: ""
      })
    }
  }

  const filteredEvents = events.filter((event) => {
    const matchesSearch = event.title.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesTab = activeTab === 'all' || event.status === activeTab
    return matchesSearch && matchesTab
  })

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Events</h1>
          <p className="text-sm text-muted-foreground mt-1">Manage all your events.</p>
        </div>
        <Link href="/dashboard/events/new">
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            New Event
          </Button>
        </Link>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input 
            placeholder="Search events..." 
            value={searchQuery} 
            onChange={(e) => setSearchQuery(e.target.value)} 
            className="pl-10" 
          />
        </div>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="draft">Draft</TabsTrigger>
            <TabsTrigger value="published">Published</TabsTrigger>
            <TabsTrigger value="live">Live</TabsTrigger>
            <TabsTrigger value="completed">Done</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {loading ? (
        <div className="text-center py-20 text-muted-foreground text-sm">Loading events...</div>
      ) : filteredEvents.length === 0 ? (
        <div className="text-center py-20">
          <Calendar className="w-10 h-10 text-muted-foreground/40 mx-auto mb-3" strokeWidth={1.5} />
          <h3 className="font-semibold mb-1">No events found</h3>
          <p className="text-sm text-muted-foreground mb-4">
            {searchQuery ? 'Try a different search.' : 'Create your first event.'}
          </p>
          <Link href="/dashboard/events/new"><Button><Plus className="w-4 h-4 mr-2" />Create Event</Button></Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filteredEvents.map((event, i) => (
            <motion.div 
              key={event.id} 
              initial={{ opacity: 0, y: 8 }} 
              animate={{ opacity: 1, y: 0 }} 
              transition={{ duration: 0.3, delay: i * 0.05 }}
            >
              <Card className="group hover:shadow-md transition-shadow">
                <CardContent className="p-5">
                  <div className="flex items-start justify-between mb-3">
                    <Badge variant="outline" className={`text-[10px] uppercase border-0 ${statusStyle[event.status] || 'bg-muted'}`}>
                      {event.status}
                    </Badge>
                    <DropdownMenu>
                      <DropdownMenuTrigger className="p-1 rounded hover:bg-accent">
                        <MoreHorizontal className="w-4 h-4 text-muted-foreground" />
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <Link href={`/dashboard/events/${event.id}`}>
                          <DropdownMenuItem>Edit</DropdownMenuItem>
                        </Link>
                        <DropdownMenuItem onClick={() => handleDuplicate(event)}>Duplicate</DropdownMenuItem>
                        <DropdownMenuItem className="text-destructive" onClick={() => handleDelete(event.id)}>Delete</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>

                  <h3 className="font-semibold text-sm mb-0.5 line-clamp-1 group-hover:underline">{event.title}</h3>
                  <p className="text-xs text-muted-foreground mb-3 capitalize">{event.event_type}</p>

                  <div className="space-y-1.5 text-xs text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <MapPin className="w-3 h-3" />
                      {event.venue_name || 'No venue set'}
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="w-3 h-3" />
                      {event.start_date ? new Date(event.start_date).toLocaleDateString() : 'No date'}
                    </div>
                    <div className="flex items-center gap-2">
                      <Users className="w-3 h-3" />
                      {event.confirmed || 0}/{event.capacity || 0} confirmed
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-border">
                    <Link href={`/dashboard/events/${event.id}`} className="text-xs font-medium hover:underline flex items-center gap-1">
                      Open <ArrowUpRight className="w-3 h-3" />
                    </Link>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  )
}
