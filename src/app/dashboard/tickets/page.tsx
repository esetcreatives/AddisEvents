'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Ticket, Plus, Tag, CreditCard } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { createClient } from '@/lib/supabase/client'

export default function TicketsPage() {
  const supabase = createClient()
  const [events, setEvents] = useState<any[]>([])
  const [selectedEventId, setSelectedEventId] = useState<string>('')
  
  const [tiers, setTiers] = useState<any[]>([])
  const [stats, setStats] = useState({ revenue: 0, sold: 0 })
  const [loading, setLoading] = useState(true)

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
    const fetchData = async () => {
      setLoading(true)
      
      const { data: ticketsData } = await supabase.from('tickets').select('*').eq('event_id', selectedEventId)
      
      if (ticketsData && ticketsData.length > 0) {
        const ticketIds = ticketsData.map(t => t.id)
        const { data: salesData } = await supabase.from('ticket_sales').select('*').in('ticket_id', ticketIds)
        
        let totalRevenue = 0
        let totalSold = 0

        const combinedTiers = ticketsData.map(t => {
          const salesForTier = salesData?.filter(s => s.ticket_id === t.id) || []
          const quantitySold = salesForTier.reduce((sum, s) => sum + s.quantity, 0)
          
          totalRevenue += (t.price * quantitySold)
          totalSold += quantitySold

          return {
            ...t,
            sold: quantitySold,
            total: t.quantity
          }
        })

        setTiers(combinedTiers)
        setStats({ revenue: totalRevenue, sold: totalSold })
      } else {
        setTiers([])
        setStats({ revenue: 0, sold: 0 })
      }

      setLoading(false)
    }

    fetchData()

    const channel = supabase.channel('tickets-updates')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tickets' }, fetchData)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'ticket_sales' }, fetchData)
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [selectedEventId, supabase])

  const handleAddTier = async () => {
    if (!selectedEventId) return
    const name = prompt("Enter ticket tier name (e.g. VIP):")
    const price = prompt("Enter ticket price:")
    const qty = prompt("Enter total quantity available:")
    if (!name || !price || !qty) return
    
    await supabase.from('tickets').insert({
      event_id: selectedEventId,
      name,
      price: parseInt(price),
      quantity: parseInt(qty)
    })
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Ticketing</h1>
          <p className="text-sm text-muted-foreground mt-1">Manage ticket tiers and track sales.</p>
        </div>
        <div className="flex gap-2 items-center">
          {events.length > 0 && (
            <Select value={selectedEventId} onValueChange={(val) => setSelectedEventId(val || '')}>
              <SelectTrigger className="w-48 bg-white h-10">
                <SelectValue placeholder="Select Event" />
              </SelectTrigger>
              <SelectContent>
                {events.map(e => <SelectItem key={e.id} value={e.id}>{e.title}</SelectItem>)}
              </SelectContent>
            </Select>
          )}
          <Button variant="outline"><Tag className="w-4 h-4 mr-2" />Promo Codes</Button>
          <Button onClick={handleAddTier}><Plus className="w-4 h-4 mr-2" />Add Tier</Button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: 'Total Revenue', value: `ETB ${stats.revenue.toLocaleString()}`, icon: CreditCard },
          { label: 'Tickets Sold', value: stats.sold.toString(), icon: Ticket },
          { label: 'Active Promos', value: '0', icon: Tag },
        ].map((stat) => (
          <Card key={stat.label}>
            <CardContent className="p-5">
              <stat.icon className="w-4 h-4 text-muted-foreground mb-3" strokeWidth={1.5} />
              <p className="text-2xl font-semibold font-heading">{stat.value}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{stat.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {loading ? (
        <div className="text-center py-12 text-muted-foreground">Loading ticket tiers...</div>
      ) : tiers.length === 0 ? (
        <div className="text-center py-12 border-2 border-dashed rounded-xl">
          <Ticket className="w-10 h-10 text-muted-foreground/30 mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">No ticket tiers created for this event.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {tiers.map((tier, i) => (
            <motion.div key={tier.name} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: i * 0.06 }}>
              <Card>
                <CardContent className="p-6">
                  <h3 className="font-semibold mb-1">{tier.name}</h3>
                  <p className="text-2xl font-heading font-semibold text-primary mb-4">ETB {tier.price.toLocaleString()}</p>
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-sm text-muted-foreground">
                      <span>Sold</span>
                      <span>{tier.sold}/{tier.total}</span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-1.5">
                      <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${tier.total > 0 ? (tier.sold / tier.total) * 100 : 0}%` }} />
                    </div>
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
