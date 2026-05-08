'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { Calendar, MapPin, CheckCircle2, ChevronRight, Check, X, Users, Utensils, Globe } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { createClient } from '@/lib/supabase/client'
import { useConfirm } from '@/components/confirm-provider'
import { VenueMap } from '@/components/venue-map'

export default function PersonalizedRSVP() {
  const params = useParams()
  const token = params.token as string
  const supabase = createClient()
  const router = useRouter()
  const confirm = useConfirm()

  const [loading, setLoading] = useState(true)
  const [event, setEvent] = useState<any>(null)
  const [rsvp, setRsvp] = useState<any>(null)
  const [lang, setLang] = useState<'am' | 'en'>('am')
  
  const [step, setStep] = useState(0)
  const [formData, setFormData] = useState({
    status: 'confirmed',
    meal: '',
    dietary: '',
    hasPlusOne: false,
    plusOneName: '',
  })
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    const fetchData = async () => {
      // 1. Fetch RSVP by token (ID)
      const { data: rsvpData, error: rsvpError } = await supabase
        .from('rsvp_responses')
        .select('*, events(*)')
        .eq('id', token)
        .single()

      if (rsvpError || !rsvpData) {
        setLoading(false)
        return
      }

      setRsvp(rsvpData)
      setEvent(rsvpData.events)
      
      // If already responded, pre-fill and show success or allow edit
      if (rsvpData.status !== 'pending') {
        setFormData({
          status: rsvpData.status,
          meal: rsvpData.meal_preference || '',
          dietary: rsvpData.dietary_restrictions || '',
          hasPlusOne: rsvpData.plus_one || false,
          plusOneName: rsvpData.plus_one_name || '',
        })
      }
      
      setLoading(false)
    }
    fetchData()
  }, [token, supabase])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)

    // Capacity Check
    if (event.capacity && formData.status === 'confirmed' && rsvp.status !== 'confirmed') {
      const { count } = await supabase
        .from('rsvp_responses')
        .select('*', { count: 'exact', head: true })
        .eq('event_id', event.id)
        .eq('status', 'confirmed')

      if (count && count >= event.capacity) {
        await confirm({
          title: lang === 'am' ? 'ይቅርታ' : 'Full Capacity',
          description: lang === 'am' ? 'ይቅርታ፣ የሰው ብዛት ገደብ ላይ ደርሰናል።' : 'Sorry, the event has reached its maximum capacity.',
          confirmText: "OK",
          cancelText: ""
        })
        setSubmitting(false)
        return
      }
    }

    const qrCodeString = formData.status === 'confirmed' 
      ? `AE-${rsvp.guest_id || 'G'}-${token.substring(0, 6).toUpperCase()}` 
      : null;

    const { error } = await supabase
      .from('rsvp_responses')
      .update({
        status: formData.status,
        meal_preference: formData.meal,
        dietary_restrictions: formData.dietary,
        plus_one: formData.hasPlusOne,
        plus_one_name: formData.plusOneName,
        qr_code: qrCodeString,
        responded_at: new Date().toISOString()
      })
      .eq('id', token)

    if (!error) {
      setStep(2)
    } else {
      await confirm({
        title: "Error",
        description: "Error saving RSVP: " + error.message,
        confirmText: "OK",
        cancelText: ""
      })
    }
    setSubmitting(false)
  }

  const t = {
    am: {
      title: "ግብዣ",
      invited: "ክቡር/ት " + (rsvp?.respondent_name || "እንግዳ") + " ተጋብዘዋል",
      date: "ቀን",
      venue: "ቦታ",
      respond: "ምላሽ ይስጡ",
      change: "ምላሽዎን ይቀይሩ",
      willAttend: "ይገኛሉ?",
      yes: "አዎ እገኛለሁ",
      no: "አልገኝም",
      meal: "የምግብ ምርጫ",
      dietary: "ተጨማሪ ማሳሰቢያ (አለርጂ ካለዎት)",
      plusOne: "ከእርስዎ ጋር ሰው ይዘው ይመጣሉ?",
      plusOneName: "የጋባዥ ስም",
      submit: "ላክ",
      success: "አመሰግናለሁ!",
      confirmedMsg: "ምላሽዎ ተመዝግቧል። እዚያ እንገናኝ!",
      declinedMsg: "ምላሽዎ ተመዝግቧል። ስላልተመቸዎት አዝነናል!",
      back: "ወደ መጀመሪያ ተመለስ",
      placeholder: "ምርጫ ይምረጡ",
      meat: "ስጋ",
      veg: "አትክልት",
      fish: "አሳ",
      fasting: "ጾም"
    },
    en: {
      title: "Invitation",
      invited: "Dear " + (rsvp?.respondent_name || "Guest") + ", You're Invited",
      date: "Date",
      venue: "Venue",
      respond: "Respond Now",
      change: "Change My RSVP",
      willAttend: "Will you attend?",
      yes: "Joyfully Accept",
      no: "Regretfully Decline",
      meal: "Meal Preference",
      dietary: "Dietary Restrictions",
      plusOne: "Bringing a guest?",
      plusOneName: "Guest Name",
      submit: "Submit RSVP",
      success: "Thank You!",
      confirmedMsg: "Your RSVP is confirmed. See you there!",
      declinedMsg: "We're sorry you can't make it. Hope to see you next time!",
      back: "Back to home",
      placeholder: "Select an option",
      meat: "Meat",
      veg: "Vegetarian",
      fish: "Fish",
      fasting: "Fasting"
    }
  }[lang]

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-[#FAFAF9]">Loading invitation...</div>
  if (!event || !rsvp) return <div className="min-h-screen flex items-center justify-center bg-[#FAFAF9]">Invalid or expired invitation link.</div>

  const startDate = new Date(event.start_date)

  return (
    <div className="min-h-screen bg-[#FAFAF9] flex flex-col font-sans">
      <div className="h-48 sm:h-64 w-full relative" style={{ backgroundColor: event.theme_color }}>
        <div className="absolute inset-0 bg-black/10"></div>
        <div className="absolute top-4 right-4">
          <Button variant="secondary" size="sm" onClick={() => setLang(lang === 'am' ? 'en' : 'am')} className="gap-2 backdrop-blur-md bg-white/50">
            <Globe className="w-4 h-4" /> {lang === 'am' ? 'English' : 'አማርኛ'}
          </Button>
        </div>
      </div>

      <main className="flex-1 -mt-20 px-4 pb-20">
        <div className="max-w-xl mx-auto">
          <Card className="shadow-xl border-0 overflow-hidden bg-white/95 backdrop-blur-sm">
            <CardContent className="p-0">
              <AnimatePresence mode="wait">
                {step === 0 && (
                  <motion.div key="landing" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-8 text-center">
                    <p className="text-sm font-medium text-primary uppercase tracking-widest mb-2">{t.title}</p>
                    <h1 className="text-3xl font-semibold mb-6">{t.invited}</h1>
                    <div className="space-y-4 max-w-sm mx-auto text-left mb-8">
                      <div className="flex gap-4">
                        <Calendar className="w-5 h-5 text-primary" />
                        <div>
                          <p className="font-medium text-sm">{t.date}</p>
                          <p className="text-sm text-muted-foreground">{startDate.toLocaleString(lang === 'am' ? 'am-ET' : 'en-US')}</p>
                        </div>
                      </div>
                      <div className="pt-4 border-t border-border/50">
                        <VenueMap 
                          address={event.venue_address} 
                          venueName={event.venue_name} 
                        />
                      </div>
                    </div>
                    <Button className="w-full h-12 text-lg" onClick={() => setStep(1)}>
                      {rsvp.status !== 'pending' ? t.change : t.respond}
                    </Button>
                  </motion.div>
                )}

                {step === 1 && (
                  <motion.div key="form" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="p-8">
                    <h2 className="text-2xl font-semibold mb-6">{t.respond}</h2>
                    <form onSubmit={handleSubmit} className="space-y-6">
                      <div className="space-y-3">
                        <Label>{t.willAttend}</Label>
                        <div className="grid grid-cols-2 gap-3">
                          <Button 
                            type="button" 
                            variant={formData.status === 'confirmed' ? 'default' : 'outline'}
                            className="h-14 flex-col gap-1 transition-all"
                            onClick={() => setFormData({...formData, status: 'confirmed'})}
                          >
                            <Check className="w-4 h-4" />
                            <span className="text-xs">{t.yes}</span>
                          </Button>
                          <Button 
                            type="button" 
                            variant={formData.status === 'declined' ? 'destructive' : 'outline'}
                            className="h-14 flex-col gap-1 transition-all"
                            onClick={() => setFormData({...formData, status: 'declined'})}
                          >
                            <X className="w-4 h-4" />
                            <span className="text-xs">{t.no}</span>
                          </Button>
                        </div>
                      </div>

                      {formData.status === 'confirmed' && (
                        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="space-y-6 overflow-hidden">
                          <div className="space-y-2">
                            <Label>{t.meal}</Label>
                            <Select value={formData.meal} onValueChange={v => setFormData({...formData, meal: v ?? ''})}>
                              <SelectTrigger><SelectValue placeholder={t.placeholder}/></SelectTrigger>
                              <SelectContent>
                                <SelectItem value="meat">{t.meat}</SelectItem>
                                <SelectItem value="vegetarian">{t.veg}</SelectItem>
                                <SelectItem value="fish">{t.fish}</SelectItem>
                                <SelectItem value="fasting">{t.fasting}</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>

                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <Label>{t.plusOne}</Label>
                              <Button 
                                type="button" 
                                variant="ghost" 
                                size="sm" 
                                onClick={() => setFormData({...formData, hasPlusOne: !formData.hasPlusOne})}
                                className={formData.hasPlusOne ? 'text-primary' : 'text-muted-foreground'}
                              >
                                {formData.hasPlusOne ? <CheckCircle2 className="w-4 h-4 mr-1"/> : <Users className="w-4 h-4 mr-1"/>}
                                {formData.hasPlusOne ? 'Selected' : 'Add'}
                              </Button>
                            </div>
                            {formData.hasPlusOne && (
                              <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
                                <Input 
                                  placeholder={t.plusOneName}
                                  value={formData.plusOneName}
                                  onChange={e => setFormData({...formData, plusOneName: e.target.value})}
                                />
                              </motion.div>
                            )}
                          </div>

                          <div className="space-y-2">
                            <Label>{t.dietary}</Label>
                            <Textarea 
                              className="resize-none"
                              placeholder={t.dietary}
                              rows={2}
                              value={formData.dietary}
                              onChange={e => setFormData({...formData, dietary: e.target.value})}
                            />
                          </div>
                        </motion.div>
                      )}

                      <Button type="submit" className="w-full h-12" disabled={submitting}>
                        {submitting ? '...' : t.submit}
                      </Button>
                    </form>
                  </motion.div>
                )}

                {step === 2 && (
                  <motion.div key="success" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="p-16 text-center">
                    <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6">
                      <CheckCircle2 className="w-10 h-10" />
                    </div>
                    <h2 className="text-3xl font-semibold mb-2">{t.success}</h2>
                    <p className="text-muted-foreground mb-8">
                      {formData.status === 'confirmed' ? t.confirmedMsg : t.declinedMsg}
                    </p>
                    <Button variant="outline" onClick={() => setStep(0)}>{t.back}</Button>
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
