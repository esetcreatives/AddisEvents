'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Calendar, Check, CheckCircle2, ChevronRight, Globe, MapPin, Share2, Users, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'

export default function DemoRsvpPage() {
  const [step, setStep] = useState(0)
  const [status, setStatus] = useState<'confirmed' | 'declined'>('confirmed')

  return (
    <div className="min-h-screen bg-[#FAFAF9]">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-5 py-5">
        <Link href="/" className="font-heading text-lg font-semibold">Addis Events</Link>
        <Button asChild variant="outline">
          <Link href="/signup?plan=professional">Create organizer workspace</Link>
        </Button>
      </header>

      <main className="mx-auto grid max-w-6xl gap-8 px-5 pb-16 lg:grid-cols-[1fr_360px]">
        <section className="overflow-hidden rounded-3xl border border-border/70 bg-white shadow-xl shadow-black/[0.05]">
          <div className="relative h-56 bg-[url('https://images.unsplash.com/photo-1511795409834-ef04bbd61622?auto=format&fit=crop&w=1600&q=80')] bg-cover bg-center">
            <div className="absolute inset-0 bg-black/45" />
            <div className="absolute bottom-6 left-6 right-6 text-white">
              <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-white/70">Shareable RSVP page</p>
              <h1 className="max-w-2xl text-4xl font-semibold tracking-tight">Addis Tech Leaders Gala</h1>
              <p className="mt-3 max-w-xl text-sm leading-6 text-white/70">
                A polished guest-facing event page with details, venue, RSVP form, and share actions.
              </p>
            </div>
          </div>

          <div className="grid gap-6 p-6 md:grid-cols-3">
            <div className="flex gap-3">
              <Calendar className="mt-1 h-5 w-5 text-primary" />
              <div>
                <p className="text-sm font-semibold">Friday, June 12, 2026</p>
                <p className="text-xs text-muted-foreground">6:30 PM EAT</p>
              </div>
            </div>
            <div className="flex gap-3">
              <MapPin className="mt-1 h-5 w-5 text-primary" />
              <div>
                <p className="text-sm font-semibold">Skylight Hotel</p>
                <p className="text-xs text-muted-foreground">Airport Road, Addis Ababa</p>
              </div>
            </div>
            <div className="flex gap-3">
              <Users className="mt-1 h-5 w-5 text-primary" />
              <div>
                <p className="text-sm font-semibold">350 guests</p>
                <p className="text-xs text-muted-foreground">Corporate gala</p>
              </div>
            </div>
          </div>

          <div className="border-t border-border/70 p-6">
            {step === 0 ? (
              <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
                <div>
                  <h2 className="text-xl font-semibold">Guest opens this public link</h2>
                  <p className="mt-1 text-sm text-muted-foreground">Example: /e/addis-tech-leaders-gala</p>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline">
                    <Share2 className="mr-2 h-4 w-4" />
                    Share
                  </Button>
                  <Button onClick={() => setStep(1)}>
                    Respond now
                    <ChevronRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              </div>
            ) : step === 1 ? (
              <form
                className="space-y-5"
                onSubmit={(event) => {
                  event.preventDefault()
                  setStep(2)
                }}
              >
                <div>
                  <h2 className="text-xl font-semibold">Your response</h2>
                  <p className="mt-1 text-sm text-muted-foreground">Guests can accept or decline, then add contact and dietary details.</p>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label>Full name</Label>
                    <Input defaultValue="Marta Alemu" />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Email</Label>
                    <Input defaultValue="marta@example.com" />
                  </div>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <button
                    type="button"
                    onClick={() => setStatus('confirmed')}
                    className={`rounded-xl border p-4 text-left transition ${status === 'confirmed' ? 'border-primary bg-primary/5 text-primary' : 'hover:bg-muted/50'}`}
                  >
                    <Check className="mb-2 h-5 w-5" />
                    <p className="text-sm font-semibold">Joyfully accept</p>
                  </button>
                  <button
                    type="button"
                    onClick={() => setStatus('declined')}
                    className={`rounded-xl border p-4 text-left transition ${status === 'declined' ? 'border-red-500 bg-red-50 text-red-600' : 'hover:bg-muted/50'}`}
                  >
                    <X className="mb-2 h-5 w-5" />
                    <p className="text-sm font-semibold">Regretfully decline</p>
                  </button>
                </div>
                {status === 'confirmed' && (
                  <div className="space-y-1.5">
                    <Label>Dietary restrictions</Label>
                    <Textarea defaultValue="Vegetarian meal preferred." className="resize-none" />
                  </div>
                )}
                <Button type="submit" className="w-full">Submit RSVP</Button>
              </form>
            ) : (
              <div className="py-8 text-center">
                <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-green-100 text-green-600">
                  <CheckCircle2 className="h-9 w-9" />
                </div>
                <h2 className="text-2xl font-semibold">{status === 'confirmed' ? 'See you there!' : 'Thank you for letting us know.'}</h2>
                <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
                  {status === 'confirmed'
                    ? 'The guest is recorded as confirmed and receives a QR code for check-in.'
                    : 'The organizer sees the decline in the dashboard.'}
                </p>
                <Button variant="outline" className="mt-6" onClick={() => setStep(0)}>Back to preview</Button>
              </div>
            )}
          </div>
        </section>

        <aside className="space-y-4">
          <Card>
            <CardContent className="p-5">
              <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <Globe className="h-5 w-5" />
              </div>
              <h2 className="text-base font-semibold">What gets shared?</h2>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                Public event link: guests can RSVP themselves. Personalized RSVP link: imported guests receive a unique token so responses attach to that guest record.
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-5">
              <h2 className="text-base font-semibold">After organizer signup</h2>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                The system creates an organizer workspace, sends the organizer to onboarding, then guides them to create and publish an event before any RSVP link is shareable.
              </p>
            </CardContent>
          </Card>
        </aside>
      </main>
    </div>
  )
}

