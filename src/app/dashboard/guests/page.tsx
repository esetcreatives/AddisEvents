'use client'
import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Plus, Upload, Search, MoreHorizontal } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog"
import { ScrollArea } from "@/components/ui/scroll-area"
import { createClient } from '@/lib/supabase/client'
import { AlertCircle, CheckCircle2, Download } from 'lucide-react'
import { useConfirm } from '@/components/confirm-provider'

const statusStyle: Record<string, string> = {
  confirmed: 'bg-green-50 text-green-700',
  pending: 'bg-amber-50 text-amber-700',
  declined: 'bg-red-50 text-red-600',
}

export default function GuestsPage() {
  const supabase = createClient()
  const confirm = useConfirm()
  const [guests, setGuests] = useState<any[]>([])
  const [events, setEvents] = useState<any[]>([])
  const [selectedEvent, setSelectedEvent] = useState<string>('all')
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [showPreview, setShowPreview] = useState(false)
  const [previewData, setPreviewData] = useState<any[]>([])
  const [importing, setImporting] = useState(false)
  const [selectedGuestIds, setSelectedGuestIds] = useState<string[]>([])
  const [showInviteModal, setShowInviteModal] = useState(false)
  const [sending, setSending] = useState(false)

  useEffect(() => {
    const fetchData = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // Fetch events for the filter
      const { data: eventsData } = await supabase
        .from('events')
        .select('id, title')
        .eq('organizer_id', user.id)
      
      if (eventsData) setEvents(eventsData)

      // Fetch guests with their RSVP status in a single query
      let query = supabase
        .from('guests')
        .select(`
          id, 
          full_name, 
          email, 
          phone, 
          event_id,
          events (title),
          rsvp_responses (status)
        `)
      
      if (selectedEvent !== 'all') {
        query = query.eq('event_id', selectedEvent)
      } else {
        const eventIds = eventsData?.map(e => e.id) || []
        query = query.in('event_id', eventIds)
      }

      const { data: guestsData } = await query
      
      if (guestsData) {
        const guestsWithStatus = guestsData.map((g: any) => ({
          id: g.id,
          name: g.full_name,
          email: g.email,
          phone: g.phone,
          event_id: g.event_id,
          event: (g.events as any)?.title,
          status: g.rsvp_responses?.[0]?.status || 'pending'
        }))
        setGuests(guestsWithStatus)
      }
      setLoading(false)
    }

    fetchData()
    
    const channel = supabase.channel('guest-updates')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'guests' }, fetchData)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'rsvp_responses' }, fetchData)
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [selectedEvent, supabase])

  const filteredGuests = guests.filter(g => 
    g.name.toLowerCase().includes(search.toLowerCase()) ||
    (g.email && g.email.toLowerCase().includes(search.toLowerCase())) ||
    (g.event && g.event.toLowerCase().includes(search.toLowerCase()))
  )

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (selectedEvent === 'all') {
      await confirm({
        title: "Event Required",
        description: "Please select a specific event from the dropdown before importing guests.",
        confirmText: "Got it",
        cancelText: ""
      })
      return
    }

    const reader = new FileReader()
    reader.onload = (event) => {
      const text = event.target?.result as string
      if (!text) return

      const rows = text.split('\n').filter(row => row.trim() !== '')
      if (rows.length < 2) return

      const headers = rows[0].split(',').map(h => h.trim().toLowerCase())
      const nameIdx = headers.findIndex(h => h.includes('name'))
      const emailIdx = headers.findIndex(h => h.includes('email'))
      const phoneIdx = headers.findIndex(h => h.includes('phone'))

      if (nameIdx === -1) {
        confirm({
          title: "Invalid CSV",
          description: "CSV must have a 'name' column.",
          confirmText: "OK",
          cancelText: ""
        })
        return
      }

      const parsedData = rows.slice(1).map((row, index) => {
        const columns = row.split(',').map(c => c.trim())
        const name = columns[nameIdx]
        const email = emailIdx !== -1 ? columns[emailIdx] : null
        const phone = phoneIdx !== -1 ? columns[phoneIdx] : null
        
        const isDuplicate = guests.some(g => 
          g.event_id === selectedEvent && (
            (email && g.email === email) || 
            (phone && g.phone === phone) ||
            (name && g.name.toLowerCase() === name.toLowerCase())
          )
        )

        return {
          id: `temp-${index}`,
          full_name: name,
          email: email,
          phone: phone,
          event_id: selectedEvent,
          isValid: !!name && (!!email || !!phone) && !isDuplicate,
          error: isDuplicate ? 'Duplicate guest' : (!name ? 'Name missing' : (!email && !phone ? 'Email/Phone missing' : null))
        }
      }).filter(item => item.full_name)

      setPreviewData(parsedData)
      setShowPreview(true)
    }
    reader.readAsText(file)
    e.target.value = '' // Reset input
  }

  const confirmImport = async () => {
    setImporting(true)
    const validGuests = previewData
      .filter(g => g.isValid)
      .map(({ full_name, email, phone, event_id }) => ({
        full_name,
        email,
        phone,
        event_id
      }))

    if (validGuests.length > 0) {
      const { error } = await supabase.from('guests').insert(validGuests)
      if (error) {
        await confirm({
          title: "Import Failed",
          description: 'Failed to import guests: ' + error.message,
          confirmText: "OK",
          cancelText: ""
        })
      } else {
        setShowPreview(false)
        setPreviewData([])
      }
    }
    setImporting(false)
  }

  const toggleSelectAll = () => {
    if (selectedGuestIds.length === filteredGuests.length) {
      setSelectedGuestIds([])
    } else {
      setSelectedGuestIds(filteredGuests.map(g => g.id))
    }
  }

  const toggleSelectGuest = (id: string) => {
    setSelectedGuestIds(prev => 
      prev.includes(id) ? prev.filter(gid => gid !== id) : [...prev, id]
    )
  }

  const sendInvitations = async () => {
    setSending(true)
    // Simulate invitation sending
    // In production, this would trigger an Edge Function or Resend API
    const { error } = await supabase
      .from('rsvp_responses')
      .upsert(
        selectedGuestIds.map(id => ({
          guest_id: id,
          event_id: guests.find(g => g.id === id)?.event_id, // This is simplified
          status: 'pending',
          respondent_name: guests.find(g => g.id === id)?.name
        }))
      )
    
    if (error) {
      await confirm({
        title: "Error",
        description: "Failed to send invitations: " + error.message,
        confirmText: "OK",
        cancelText: ""
      })
    } else {
      await confirm({
        title: "Success",
        description: `Invitations sent to ${selectedGuestIds.length} guests!`,
        confirmText: "Great",
        cancelText: ""
      })
      setSelectedGuestIds([])
      setShowInviteModal(false)
    }
    setSending(false)
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Guests</h1>
          <p className="text-sm text-muted-foreground mt-1">Manage guest lists across all events.</p>
        </div>
        <div className="flex gap-2">
          <input 
            type="file" 
            accept=".csv" 
            id="csv-upload" 
            className="hidden" 
            onChange={handleFileUpload} 
          />
          <Button 
            variant="outline" 
            onClick={() => {
              if (selectedEvent === 'all') {
                confirm({
                  title: "Event Required",
                  description: "Please select an event from the dropdown below before importing guests.",
                  confirmText: "OK",
                  cancelText: ""
                })
              } else {
                document.getElementById('csv-upload')?.click()
              }
            }}
          >
            <Upload className="w-4 h-4 mr-2" />Import CSV
          </Button>
          <Button><Plus className="w-4 h-4 mr-2" />Add Guest</Button>
        </div>
      </div>

      {selectedGuestIds.length > 0 && (
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }} 
          animate={{ opacity: 1, scale: 1 }}
          className="bg-primary/5 border border-primary/20 rounded-xl p-4 flex items-center justify-between shadow-sm"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold">
              {selectedGuestIds.length}
            </div>
            <div>
              <p className="text-sm font-medium">Guests selected</p>
              <p className="text-xs text-muted-foreground">Ready to send invitations or export.</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={() => setSelectedGuestIds([])}>Deselect All</Button>
            <Button size="sm" onClick={() => setShowInviteModal(true)}>
              Send Invitations
            </Button>
          </div>
        </motion.div>
      )}

      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="relative w-full sm:max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input 
            placeholder="Search guests..." 
            className="pl-10" 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="w-full sm:w-48">
          <Select value={selectedEvent} onValueChange={(val) => setSelectedEvent(val || 'all')}>
            <SelectTrigger>
              <SelectValue placeholder="All Events" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Events</SelectItem>
              {events.map((event) => (
                <SelectItem key={event.id} value={event.id}>
                  {event.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-10">
                    <input 
                      type="checkbox" 
                      className="rounded border-gray-300 text-primary focus:ring-primary h-4 w-4"
                      checked={selectedGuestIds.length === filteredGuests.length && filteredGuests.length > 0}
                      onChange={toggleSelectAll}
                    />
                  </TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead className="hidden md:table-cell">Email</TableHead>
                  <TableHead className="hidden lg:table-cell">Phone</TableHead>
                  <TableHead>Event</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-10" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                   <TableRow>
                    <TableCell colSpan={7} className="text-center py-12 text-muted-foreground">
                      Loading guests...
                    </TableCell>
                   </TableRow>
                ) : filteredGuests.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-12 text-muted-foreground">
                      No guests found.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredGuests.map((guest) => (
                    <TableRow key={guest.id} className={selectedGuestIds.includes(guest.id) ? 'bg-primary/5' : ''}>
                      <TableCell>
                        <input 
                          type="checkbox" 
                          className="rounded border-gray-300 text-primary focus:ring-primary h-4 w-4"
                          checked={selectedGuestIds.includes(guest.id)}
                          onChange={() => toggleSelectGuest(guest.id)}
                        />
                      </TableCell>
                      <TableCell className="font-medium text-sm">{guest.name}</TableCell>
                      <TableCell className="hidden md:table-cell text-sm text-muted-foreground">{guest.email || '-'}</TableCell>
                      <TableCell className="hidden lg:table-cell text-sm text-muted-foreground">{guest.phone || '-'}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{guest.event}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className={`text-[10px] uppercase border-0 ${statusStyle[guest.status] || 'bg-muted'}`}>{guest.status}</Badge>
                      </TableCell>
                      <TableCell>
                        <button className="p-1 rounded hover:bg-accent"><MoreHorizontal className="w-4 h-4 text-muted-foreground" /></button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </motion.div>

      <Dialog open={showPreview} onOpenChange={setShowPreview}>
        <DialogContent className="max-w-2xl max-h-[80vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>Import Review</DialogTitle>
            <DialogDescription>
              We found {previewData.length} guests in your file. Review the details below before confirming.
            </DialogDescription>
          </DialogHeader>
          
          <ScrollArea className="flex-1 mt-4 rounded-md border">
            <Table>
              <TableHeader className="bg-muted/50 sticky top-0 z-10">
                <TableRow>
                  <TableHead className="w-[200px]">Name</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead className="w-[120px]">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {previewData.map((guest) => (
                  <TableRow key={guest.id}>
                    <TableCell className="font-medium text-sm">
                      {guest.full_name}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {guest.email || guest.phone || <span className="text-destructive">Missing info</span>}
                    </TableCell>
                    <TableCell>
                      {guest.isValid ? (
                        <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 gap-1">
                          <CheckCircle2 className="w-3 h-3" /> Ready
                        </Badge>
                      ) : (
                        <Badge variant="outline" className={`${guest.error === 'Duplicate guest' ? 'bg-amber-50 text-amber-700 border-amber-200' : 'bg-red-50 text-red-700 border-red-200'} gap-1`}>
                          <AlertCircle className="w-3 h-3" /> {guest.error}
                        </Badge>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </ScrollArea>

          <DialogFooter className="mt-6 flex gap-2">
            <Button variant="outline" onClick={() => setShowPreview(false)}>Cancel</Button>
            <Button 
              disabled={importing || previewData.filter(g => g.isValid).length === 0} 
              onClick={confirmImport}
            >
              {importing ? 'Importing...' : `Confirm Import (${previewData.filter(g => g.isValid).length} guests)`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showInviteModal} onOpenChange={setShowInviteModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Send Invitations</DialogTitle>
            <DialogDescription>
              You are about to send RSVP invitations to {selectedGuestIds.length} guests.
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4 space-y-4">
            <div className="p-4 rounded-lg bg-muted border text-sm">
              <p className="font-semibold mb-2">Email Template Preview:</p>
              <p className="text-muted-foreground italic">"You're invited to [Event Name]! We'd love for you to join us. Please RSVP by clicking the link below..."</p>
              <div className="mt-4 p-2 bg-primary/10 rounded border border-primary/20 text-center text-primary font-medium">
                RSVP Now
              </div>
            </div>
            
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <AlertCircle className="w-3.5 h-3.5" />
              <span>Invitations will be sent via Email and WhatsApp.</span>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowInviteModal(false)}>Cancel</Button>
            <Button disabled={sending} onClick={sendInvitations}>
              {sending ? 'Sending...' : 'Send Now'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
