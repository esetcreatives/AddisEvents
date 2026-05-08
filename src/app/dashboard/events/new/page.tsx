'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { ArrowLeft, Save } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import { Separator } from '@/components/ui/separator'
import Link from 'next/link'

import { DatePicker } from '@/components/ui/date-picker'
import { VenueMap } from '@/components/venue-map'

export default function NewEventPage() {
  const router = useRouter()
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    venue_name: '',
    venue_address: '',
    capacity: 100,
  })
  const [startDate, setStartDate] = useState<Date | undefined>()
  const [endDate, setEndDate] = useState<Date | undefined>()
  const [eventType, setEventType] = useState<'wedding' | 'corporate'>('corporate')
  const [isTicketed, setIsTicketed] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!startDate || !endDate) {
      setError('Please select both start and end dates.')
      return
    }
    setSaving(true)
    setError(null)

    try {
      const slug = formData.title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)+/g, '') + '-' + Math.random().toString(36).substring(2, 7)

      const response = await fetch('/api/dashboard/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
        title: formData.title,
        description: formData.description,
        start_date: startDate.toISOString(),
        end_date: endDate.toISOString(),
        venue_name: formData.venue_name,
        venue_address: formData.venue_address,
        capacity: Number(formData.capacity),
        event_type: eventType,
        is_ticketed: isTicketed,
        slug,
        status: 'draft'
        }),
      })

      const result = await response.json()
      if (!response.ok) throw new Error(result.error || 'Failed to create event')

      router.push('/dashboard/events')
    } catch (err: any) {
      setError(err.message || 'Failed to create event')
    } finally {
      setSaving(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { id, value } = e.target
    // Standardize mapping from input ID to state key
    const key = id.replace('event-', '')
    setFormData(prev => ({ ...prev, [key]: value }))
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/dashboard/events">
          <Button variant="ghost" size="icon" className="shrink-0 h-8 w-8">
            <ArrowLeft className="w-4 h-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-semibold">Create Event</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Set up a new event.</p>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 text-red-600 rounded-xl text-sm">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Type */}
        <Card>
          <CardHeader><CardTitle className="text-base">Event Type</CardTitle></CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3">
              {[
                { type: 'corporate' as const, label: 'Corporate', desc: 'Conferences, galas, meetings' },
                { type: 'wedding' as const, label: 'Wedding', desc: 'Ceremonies, receptions' },
              ].map((item) => (
                <button
                  key={item.type}
                  type="button"
                  onClick={() => setEventType(item.type)}
                  className={`p-4 rounded-xl border text-left transition-all ${
                    eventType === item.type ? 'border-foreground' : 'border-border hover:border-foreground/30'
                  }`}
                >
                  <h4 className="text-sm font-medium">{item.label}</h4>
                  <p className="text-xs text-muted-foreground mt-0.5">{item.desc}</p>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Details */}
        <Card>
          <CardHeader><CardTitle className="text-base">Details</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="event-title">Title</Label>
              <Input 
                id="event-title" 
                placeholder={eventType === 'wedding' ? 'Abrham & Sara Wedding' : 'Tech Summit Addis 2026'} 
                required 
                value={formData.title}
                onChange={handleChange}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="event-description">Description</Label>
              <Textarea 
                id="event-description" 
                placeholder="What should guests know?" 
                rows={3} 
                className="resize-none"
                value={formData.description}
                onChange={handleChange}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Start Date</Label>
                <DatePicker date={startDate} setDate={setStartDate} />
              </div>
              <div className="space-y-1.5">
                <Label>End Date</Label>
                <DatePicker date={endDate} setDate={setEndDate} />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Venue */}
        <Card>
          <CardHeader><CardTitle className="text-base">Venue</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="venue_name">Name</Label>
              <Input 
                id="venue_name" 
                placeholder="Sheraton Addis" 
                value={formData.venue_name}
                onChange={handleChange}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="venue_address">Address</Label>
              <Input 
                id="venue_address" 
                placeholder="Taitu Street, Addis Ababa" 
                value={formData.venue_address}
                onChange={handleChange}
              />
            </div>
            {formData.venue_address && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="pt-2">
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-2">Location Preview</p>
                <VenueMap 
                  address={formData.venue_address} 
                  venueName={formData.venue_name} 
                />
              </motion.div>
            )}
          </CardContent>
        </Card>

        {/* Settings */}
        <Card>
          <CardHeader><CardTitle className="text-base">Settings</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="capacity">Max capacity</Label>
              <Input 
                id="capacity" 
                type="number" 
                placeholder="100" 
                min={1} 
                value={formData.capacity}
                onChange={handleChange}
              />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Enable ticketing</p>
                <p className="text-xs text-muted-foreground">Sell tickets via Sheger Pay</p>
              </div>
              <Switch checked={isTicketed} onCheckedChange={setIsTicketed} />
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end">
          <Button type="submit" disabled={saving}>
            {saving ? 'Creating...' : (
              <><Save className="w-4 h-4 mr-2" />Create Event</>
            )}
          </Button>
        </div>
      </form>
    </div>
  )
}
