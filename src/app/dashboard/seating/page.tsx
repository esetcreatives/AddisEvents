'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { LayoutGrid, Plus, Download, ZoomIn, ZoomOut, Users } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { createClient } from '@/lib/supabase/client'
import { useRef } from 'react'
import { useConfirm } from '@/components/confirm-provider'

export default function SeatingPage() {
  const supabase = createClient()
  const confirm = useConfirm()
  const [events, setEvents] = useState<any[]>([])
  const [selectedEventId, setSelectedEventId] = useState<string>('')
  
  const [tables, setTables] = useState<any[]>([])
  const [guests, setGuests] = useState<any[]>([]) // All confirmed guests
  const [assignments, setAssignments] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddTable, setShowAddTable] = useState(false)
  const [newTable, setNewTable] = useState<{name: string, shape: string, capacity: number}>({ name: '', shape: 'round', capacity: 8 })
  const canvasRef = useRef<HTMLDivElement>(null)

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
      
      const { data: tablesData } = await supabase.from('seating_tables').select('*').eq('event_id', selectedEventId)
      if (tablesData) setTables(tablesData)

      // Fetch confirmed guests
      const { data: rsvps } = await supabase
        .from('rsvp_responses')
        .select('guest_id, guests(full_name)')
        .eq('event_id', selectedEventId)
        .eq('status', 'confirmed')
      
      if (rsvps) {
        setGuests(rsvps.map(r => ({
          id: r.guest_id,
          name: (r.guests as any)?.full_name || 'Unknown'
        })))
      }

      // Fetch assignments
      // The schema says table_id, guest_id, seat_number
      // But we will do a basic join through guests to see who is assigned
      const { data: assigns } = await supabase
        .from('seat_assignments')
        .select('*, seating_tables!inner(event_id)')
        .eq('seating_tables.event_id', selectedEventId)
      
      if (assigns) setAssignments(assigns)

      setLoading(false)
    }
    fetchData()
  }, [selectedEventId, supabase])

  const addTable = async () => {
    if (!selectedEventId || !newTable.name) return
    const { data, error } = await supabase.from('seating_tables').insert({
      event_id: selectedEventId,
      table_name: newTable.name,
      table_shape: newTable.shape,
      capacity: newTable.capacity,
      position_x: 50, // Default start position
      position_y: 50
    }).select().single()

    if (data && !error) {
      setTables([...tables, data])
      setShowAddTable(false)
      setNewTable({ name: '', shape: 'round', capacity: 8 })
    }
  }

  const updateTablePosition = async (id: string, x: number, y: number) => {
    await supabase.from('seating_tables').update({ position_x: x, position_y: y }).eq('id', id)
    setTables(prev => prev.map(t => t.id === id ? { ...t, position_x: x, position_y: y } : t))
  }

  const handleDragStart = (e: React.DragEvent, guestId: string) => {
    e.dataTransfer.setData('guestId', guestId)
  }

  const handleDrop = async (e: React.DragEvent, tableId: string) => {
    e.preventDefault()
    const guestId = e.dataTransfer.getData('guestId')
    if (!guestId) return

    // Find current assignments for this table to get next seat number
    const tableAssigns = assignments.filter(a => a.table_id === tableId)
    const seatNumber = tableAssigns.length + 1

    const tableInfo = tables.find(t => t.id === tableId)
    if (tableInfo && tableAssigns.length >= tableInfo.capacity) {
      await confirm({
        title: "Table Full",
        description: "This table has reached its maximum capacity.",
        confirmText: "OK",
        cancelText: ""
      })
      return
    }

    // Check if guest is already assigned elsewhere and remove
    const existing = assignments.find(a => a.guest_id === guestId)
    if (existing) {
      await supabase.from('seat_assignments').delete().eq('id', existing.id)
    }

    const { data, error } = await supabase.from('seat_assignments').insert({
      table_id: tableId,
      guest_id: guestId,
      seat_number: seatNumber
    }).select().single()

    if (data && !error) {
      setAssignments(prev => [...prev.filter(a => a.guest_id !== guestId), data])
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
  }

  const unassignedGuests = guests.filter(g => !assignments.some(a => a.guest_id === g.id))

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Seating Chart</h1>
          <p className="text-sm text-muted-foreground mt-1">Drag and drop guests to assign seats.</p>
        </div>
        <div className="flex gap-2">
          {events.length > 0 && (
            <Select value={selectedEventId} onValueChange={(val) => setSelectedEventId(val || '')}>
              <SelectTrigger className="w-48 bg-white">
                <SelectValue placeholder="Select Event" />
              </SelectTrigger>
              <SelectContent>
                {events.map(e => <SelectItem key={e.id} value={e.id}>{e.title}</SelectItem>)}
              </SelectContent>
            </Select>
          )}
          <Button variant="outline" onClick={() => window.print()}><Download className="w-4 h-4 mr-2" />Export PDF</Button>
          <Button onClick={() => setShowAddTable(true)}><Plus className="w-4 h-4 mr-2" />Add Table</Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="lg:col-span-3">
          <Card className="h-full min-h-[500px]">
            <CardHeader className="flex flex-row items-center justify-between pb-2 border-b">
              <CardTitle className="text-base">Floor Plan</CardTitle>
            </CardHeader>
            <CardContent className="p-0 overflow-hidden">
              <div 
                ref={canvasRef}
                className="relative h-[600px] w-full bg-[#f8f8f7] bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:20px_20px] overflow-hidden"
              >
                {tables.length === 0 ? (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center">
                      <LayoutGrid className="w-12 h-12 text-muted-foreground/20 mx-auto mb-3" strokeWidth={1.5} />
                      <p className="text-sm text-muted-foreground">Canvas is empty.</p>
                      <p className="text-xs text-muted-foreground mt-0.5">Add tables to design your layout.</p>
                    </div>
                  </div>
                ) : (
                  tables.map(table => {
                    const assignedHere = assignments.filter(a => a.table_id === table.id)
                    return (
                      <motion.div
                        key={table.id}
                        drag
                        dragMomentum={false}
                        dragConstraints={canvasRef}
                        initial={{ x: table.position_x, y: table.position_y }}
                        onDragEnd={(_, info) => {
                          const newX = table.position_x + info.offset.x
                          const newY = table.position_y + info.offset.y
                          updateTablePosition(table.id, newX, newY)
                        }}
                        onDrop={(e) => handleDrop(e, table.id)}
                        onDragOver={handleDragOver}
                        className={`absolute cursor-move select-none p-4 text-center bg-white shadow-sm hover:shadow-md border-2 border-border hover:border-primary/50 transition-shadow
                          ${table.table_shape === 'round' ? 'rounded-full aspect-square w-40 h-40' : 'rounded-xl w-48 h-32'}
                        `}
                      >
                        <h3 className="font-semibold text-sm truncate">{table.table_name}</h3>
                        <p className="text-[10px] text-muted-foreground mb-2">{assignedHere.length}/{table.capacity} seats</p>
                        <div className="flex flex-col gap-1 w-full px-2 overflow-y-auto max-h-16 text-[10px]">
                          {assignedHere.map(a => {
                            const g = guests.find(g => g.id === a.guest_id)
                            return <div key={a.id} className="bg-muted py-0.5 px-1.5 rounded truncate">{g?.name}</div>
                          })}
                        </div>
                      </motion.div>
                    )
                  })
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.05 }}>
          <Card className="h-full min-h-[500px]">
            <CardHeader className="pb-3 border-b"><CardTitle className="text-base flex items-center gap-2"><Users className="w-4 h-4"/> Unassigned ({unassignedGuests.length})</CardTitle></CardHeader>
            <CardContent className="p-4 space-y-2 overflow-y-auto max-h-[600px]">
              {loading ? (
                <p className="text-xs text-muted-foreground text-center">Loading...</p>
              ) : unassignedGuests.length === 0 ? (
                <p className="text-xs text-muted-foreground text-center pt-4">All guests seated!</p>
              ) : (
                unassignedGuests.map((guest) => (
                  <div 
                    key={guest.id} 
                    draggable
                    onDragStart={(e) => handleDragStart(e, guest.id)}
                    className="p-3 bg-white border rounded-lg hover:border-primary/50 shadow-sm transition-colors cursor-grab active:cursor-grabbing text-sm flex items-center"
                  >
                    <div className="w-2 h-2 rounded-full bg-primary/20 mr-2 shrink-0" />
                    <span className="truncate">{guest.name}</span>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>

      <Dialog open={showAddTable} onOpenChange={setShowAddTable}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add New Table</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Table Name</Label>
              <Input 
                placeholder="e.g., VIP Table 1" 
                value={newTable.name}
                onChange={e => setNewTable({...newTable, name: e.target.value})}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Shape</Label>
                <Select value={newTable.shape} onValueChange={(val: string | null) => setNewTable({...newTable, shape: val || 'round'})}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="round">Round</SelectItem>
                    <SelectItem value="rectangular">Rectangular</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Capacity</Label>
                <Input 
                  type="number" 
                  value={newTable.capacity}
                  onChange={e => setNewTable({...newTable, capacity: parseInt(e.target.value)})}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddTable(false)}>Cancel</Button>
            <Button onClick={addTable} disabled={!newTable.name}>Create Table</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
