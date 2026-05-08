'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { Calendar, CheckCircle2, ChevronRight, Check, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent } from '@/components/ui/card'
import { useConfirm } from '@/components/confirm-provider'
import { VenueMap } from '@/components/venue-map'

type PublicEvent = {
  id: string
  title: string
  description?: string | null
  venue_name?: string | null
  venue_address?: string | null
  start_date: string
  end_date: string
  capacity?: number | null
  theme_color?: string | null
  is_ticketed: boolean
}

type TicketTier = {
  id: string
  name: string
  description?: string | null
  price: number
  currency: string
}

export default function EventMicrosite() {
  const params = useParams()
  const slug = params.slug as string
  const confirm = useConfirm()

  const [event, setEvent] = useState<PublicEvent | null>(null)
  const [ticketTiers, setTicketTiers] = useState<TicketTier[]>([])
  const [loading, setLoading] = useState(true)
  
  // Form State
  const [step, setStep] = useState(0) // 0: Landing, 1: Form/Tickets, 2: Success
  const [selectedTier, setSelectedTier] = useState<TicketTier | null>(null)
  const [ticketCount, setTicketCount] = useState(1)
  const [promoCode, setPromoCode] = useState('')
  const [discount, setDiscount] = useState(0)
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    status: 'confirmed',
    dietary: '',
  })
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchEvent = async () => {
      const response = await fetch(`/api/public/events/${encodeURIComponent(slug)}`)
      const data = await response.json()

      if (!response.ok || !data.event) {
        setLoading(false)
        return
      }
      setEvent(data.event)
      setTicketTiers(data.ticketTiers || [])

      setLoading(false)
    }
    fetchEvent()
  }, [slug])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    setError(null)

    try {
      if (!event) {
        throw new Error('Event is not available.')
      }

      // Handle Ticketed Event Flow
      if (event.is_ticketed) {
        if (!selectedTier) {
          setError('Please select a ticket tier.')
          return
        }

        const response = await fetch('/api/tickets/checkout', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            eventId: event.id,
            tierId: selectedTier.id,
            email: formData.email,
            name: formData.name,
            quantity: ticketCount,
            promoCode: promoCode
          })
        })

        const data = await response.json()
        if (data.checkoutUrl) {
          window.location.href = data.checkoutUrl
          return
        } else {
          throw new Error(data.error || 'Payment failed to initialize')
        }
      }

      const response = await fetch(`/api/public/events/${encodeURIComponent(slug)}/rsvp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          status: formData.status,
          dietary: formData.dietary,
        }),
      })
      const result = await response.json()
      if (!response.ok) {
        throw new Error(result.error || 'Failed to submit RSVP. Please try again.')
      }

      setStep(2) // Success screen
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit RSVP. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  const applyPromoCode = async () => {
    if (!promoCode || !selectedTier || !event) return
    setError(null)

    setDiscount(0)
    await confirm({
      title: "Promo code saved",
      description: "Your promo code will be checked securely during checkout.",
      confirmText: "OK",
      cancelText: ""
    })
  }

  // i18n placeholders (Phase 12)
  const isAmharic = params.locale === 'am';
  const t = {
    invited: isAmharic ? 'ተጋብዘዋል' : "You're Invited",
    respond: isAmharic ? 'አሁኑኑ ይመልሱ' : 'Respond Now',
    share: isAmharic ? 'አጋራ' : 'Share',
    back: isAmharic ? 'ወደ ዝግጅቱ ዝርዝር ተመለስ' : '← Back to event details',
    response: isAmharic ? 'የእርስዎ ምላሽ' : 'Your Response',
    accept: isAmharic ? 'በደስታ እቀበላለሁ' : 'Joyfully Accept',
    decline: isAmharic ? 'በአክብሮት እቀራለሁ' : 'Regretfully Decline',
    success: isAmharic ? 'እዚያ እንገናኝ!' : 'See you there!',
    thankYou: isAmharic ? 'ስላሳወቁን እናመሰግናለን' : 'Thank you for letting us know.'
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FAFAF9]">
        <div className="animate-pulse flex flex-col items-center">
          <div className="w-12 h-12 rounded-full border-4 border-primary border-t-transparent animate-spin"></div>
          <p className="mt-4 text-muted-foreground text-sm">Loading event details...</p>
        </div>
      </div>
    )
  }

  if (!event) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#FAFAF9] p-4 text-center">
        <h1 className="text-3xl font-bold mb-2">Event Not Found</h1>
        <p className="text-muted-foreground">The link you followed may be broken or the event has been removed.</p>
      </div>
    )
  }

  const startDate = new Date(event.start_date)

  return (
    <div className="min-h-screen bg-[#FAFAF9] flex flex-col">
      {/* Dynamic Header based on theme_color */}
      <div 
        className="h-48 sm:h-64 md:h-80 w-full relative"
        style={{ backgroundColor: event.theme_color || '#91091E' }}
      >
        <div className="absolute inset-0 bg-black/20"></div>
      </div>

      <main className="flex-1 -mt-20 sm:-mt-32 px-4 pb-20">
        <div className="max-w-2xl mx-auto">
          <Card className="shadow-xl border-0 overflow-hidden bg-white/95 backdrop-blur-sm">
            <CardContent className="p-0">
              <AnimatePresence mode="wait">
                
                {/* STEP 0: Landing / Details */}
                {step === 0 && (
                  <motion.div
                    key="landing"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="p-6 sm:p-10"
                  >
                    <div className="text-center mb-10">
                      <p className="text-sm font-medium text-primary tracking-wide uppercase mb-3">
                        {t.invited}
                      </p>
                      <h1 className="text-3xl sm:text-4xl md:text-5xl font-semibold mb-4 text-balance">
                        {event.title}
                      </h1>
                      {event.description && (
                        <p className="text-muted-foreground leading-relaxed max-w-md mx-auto">
                          {event.description}
                        </p>
                      )}
                    </div>

                    <div className="space-y-4 max-w-sm mx-auto mb-10">
                      <div className="flex items-start gap-4">
                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                          <Calendar className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                          <p className="font-medium">{startDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}</p>
                          <p className="text-sm text-muted-foreground mt-0.5">{startDate.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}</p>
                        </div>
                      </div>

                      <VenueMap 
                        address={event.venue_address || ''} 
                        venueName={event.venue_name || ''} 
                        className="pt-4 border-t border-border/50"
                      />
                    </div>

                    <div className="flex flex-col sm:flex-row gap-3">
                      <Button 
                        className="w-full h-14 text-lg group flex-1" 
                        onClick={() => setStep(1)}
                      >
                        {event.is_ticketed ? 'Get Tickets' : 'Respond Now'}
                        <ChevronRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                      </Button>
                      <Button
                        variant="outline"
                        className="w-full sm:w-auto h-14 text-sky-600 border-sky-200 hover:bg-sky-50 hover:text-sky-700"
                        onClick={() => {
                          const url = encodeURIComponent(window.location.href);
                          const text = encodeURIComponent(`You're invited to ${event.title}! RSVP here: `);
                          window.open(`https://t.me/share/url?url=${url}&text=${text}`, '_blank');
                        }}
                      >
                        <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69a.2.2 0 00-.05-.18c-.06-.05-.14-.03-.21-.02-.09.02-1.49.95-4.22 2.79-.4.27-.76.41-1.08.4-.36-.01-1.04-.2-1.55-.37-.63-.2-1.12-.31-1.08-.66.02-.18.27-.36.74-.55 2.92-1.27 4.86-2.11 5.83-2.51 2.78-1.16 3.35-1.36 3.73-1.36.08 0 .27.02.39.12.1.08.13.19.14.27-.01.06.01.24 0 .38z"/>
                        </svg>
                        Share
                      </Button>
                    </div>
                  </motion.div>
                )}

                {/* STEP 1: RSVP Form */}
                {step === 1 && (
                  <motion.div
                    key="form"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="p-6 sm:p-10"
                  >
                    <div className="mb-8">
                      <button 
                        onClick={() => setStep(0)}
                        className="text-sm text-muted-foreground hover:text-foreground mb-4 transition-colors"
                      >
                        ← Back to event details
                      </button>
                      <h2 className="text-2xl font-semibold">{event.is_ticketed ? 'Select Tickets' : 'Your Response'}</h2>
                      <p className="text-muted-foreground mt-1">
                        {event.is_ticketed ? 'Choose your ticket tier and quantity.' : 'Please let us know if you can make it.'}
                      </p>
                    </div>

                    {event.is_ticketed && (
                      <div className="space-y-4 mb-8">
                        {ticketTiers.map(tier => (
                          <div 
                            key={tier.id}
                            onClick={() => setSelectedTier(tier)}
                            className={`p-4 border-2 rounded-xl cursor-pointer transition-all ${selectedTier?.id === tier.id ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/30'}`}
                          >
                            <div className="flex justify-between items-center">
                              <div>
                                <p className="font-semibold">{tier.name}</p>
                                <p className="text-xs text-muted-foreground">{tier.description}</p>
                              </div>
                              <p className="font-bold text-lg">{tier.price} {tier.currency}</p>
                            </div>
                          </div>
                        ))}

                        {selectedTier && (
                          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="pt-4 space-y-4 border-t">
                            <div className="flex items-center justify-between">
                              <Label>Quantity</Label>
                              <div className="flex items-center gap-3">
                                <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => setTicketCount(Math.max(1, ticketCount - 1))}>-</Button>
                                <span className="font-semibold">{ticketCount}</span>
                                <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => setTicketCount(ticketCount + 1)}>+</Button>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <Input 
                                placeholder="Promo Code" 
                                value={promoCode} 
                                onChange={e => {
                                  setPromoCode(e.target.value.toUpperCase())
                                  setDiscount(0) // Reset discount on change
                                }}
                              />
                              <Button variant="outline" onClick={applyPromoCode}>Apply</Button>
                            </div>
                            <div className="pt-4 border-t flex justify-between items-center font-bold">
                              <span>Total</span>
                              <span className="text-xl">{(selectedTier.price * ticketCount) - discount} {selectedTier.currency}</span>
                            </div>
                          </motion.div>
                        )}
                      </div>
                    )}

                    {error && (
                      <div className="p-4 bg-red-50 text-red-600 rounded-xl text-sm mb-6 border border-red-100">
                        {error}
                      </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-6">
                      <div className="space-y-4">
                        <div className="space-y-1.5">
                          <Label htmlFor="name">Full Name</Label>
                          <Input 
                            id="name" 
                            required 
                            placeholder="John Doe"
                            value={formData.name}
                            onChange={(e) => setFormData({...formData, name: e.target.value})}
                          />
                        </div>
                        
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div className="space-y-1.5">
                            <Label htmlFor="email">Email</Label>
                            <Input 
                              id="email" 
                              type="email" 
                              placeholder="john@example.com"
                              value={formData.email}
                              onChange={(e) => setFormData({...formData, email: e.target.value})}
                            />
                          </div>
                          <div className="space-y-1.5">
                            <Label htmlFor="phone">Phone</Label>
                            <Input 
                              id="phone" 
                              placeholder="+251 900 0000"
                              value={formData.phone}
                              onChange={(e) => setFormData({...formData, phone: e.target.value})}
                            />
                          </div>
                        </div>

                        <div className="pt-2">
                          <Label className="mb-3 block">Will you be attending?</Label>
                          <div className="grid grid-cols-2 gap-3">
                            <label className={`
                              border rounded-xl p-4 cursor-pointer transition-all flex flex-col items-center gap-2
                              ${formData.status === 'confirmed' ? 'border-primary bg-primary/5 ring-1 ring-primary' : 'hover:bg-muted/50'}
                            `}>
                              <input 
                                type="radio" 
                                name="status" 
                                className="sr-only" 
                                checked={formData.status === 'confirmed'}
                                onChange={() => setFormData({...formData, status: 'confirmed'})}
                              />
                              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${formData.status === 'confirmed' ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
                                <Check className="w-4 h-4" />
                              </div>
                              <span className="font-medium text-sm">Joyfully Accept</span>
                            </label>

                            <label className={`
                              border rounded-xl p-4 cursor-pointer transition-all flex flex-col items-center gap-2
                              ${formData.status === 'declined' ? 'border-red-500 bg-red-50 ring-1 ring-red-500' : 'hover:bg-muted/50'}
                            `}>
                              <input 
                                type="radio" 
                                name="status" 
                                className="sr-only" 
                                checked={formData.status === 'declined'}
                                onChange={() => setFormData({...formData, status: 'declined'})}
                              />
                              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${formData.status === 'declined' ? 'bg-red-500 text-white' : 'bg-muted'}`}>
                                <X className="w-4 h-4" />
                              </div>
                              <span className="font-medium text-sm">Regretfully Decline</span>
                            </label>
                          </div>
                        </div>

                        {formData.status === 'confirmed' && (
                          <motion.div 
                            initial={{ opacity: 0, height: 0 }} 
                            animate={{ opacity: 1, height: 'auto' }}
                            className="space-y-1.5 pt-2"
                          >
                            <Label htmlFor="dietary">Dietary Restrictions (Optional)</Label>
                            <Textarea 
                              id="dietary" 
                              placeholder="e.g., Vegetarian, Peanut allergy..." 
                              rows={2}
                              className="resize-none"
                              value={formData.dietary}
                              onChange={(e) => setFormData({...formData, dietary: e.target.value})}
                            />
                          </motion.div>
                        )}
                      </div>

                      <Button type="submit" className="w-full h-12" disabled={submitting}>
                        {submitting ? 'Submitting...' : 'Submit RSVP'}
                      </Button>
                    </form>
                  </motion.div>
                )}

                {/* STEP 2: Success */}
                {step === 2 && (
                  <motion.div
                    key="success"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="p-10 sm:p-16 text-center"
                  >
                    <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6">
                      <CheckCircle2 className="w-10 h-10" />
                    </div>
                    <h2 className="text-3xl font-semibold mb-3">
                      {formData.status === 'confirmed' ? 'See you there!' : 'Thank you for letting us know.'}
                    </h2>
                    <p className="text-muted-foreground mb-8 max-w-sm mx-auto">
                      {formData.status === 'confirmed' 
                        ? 'Your RSVP has been confirmed. We have sent the details to your email.' 
                        : 'We are sorry you cannot make it. Your response has been recorded.'}
                    </p>
                    <Button variant="outline" onClick={() => setStep(0)}>
                      Back to Event
                    </Button>
                  </motion.div>
                )}
              </AnimatePresence>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
