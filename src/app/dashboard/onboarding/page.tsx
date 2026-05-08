'use client'

import Link from 'next/link'
import { useState } from 'react'
import { ArrowRight, CalendarPlus, CheckCircle2, Globe2, Users } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'

const plans: Record<string, string> = {
  starter: 'Starter',
  professional: 'Professional Trial',
}

const steps = [
  {
    icon: CalendarPlus,
    title: 'Create your event',
    description: 'Add the title, date, venue, capacity, and whether guests RSVP or buy tickets.',
  },
  {
    icon: Globe2,
    title: 'Publish the shareable page',
    description: 'Your event gets a public link like /e/your-event-name for guests to open.',
  },
  {
    icon: Users,
    title: 'Invite guests and manage responses',
    description: 'Import a guest list for personal RSVP links, or share the public RSVP page.',
  },
]

export default function OnboardingPage() {
  const [plan] = useState(() => {
    if (typeof window !== 'undefined') {
      const value = new URLSearchParams(window.location.search).get('plan')
      if (value && plans[value]) return value
    }
    return 'professional'
  })

  return (
    <div className="mx-auto max-w-4xl space-y-8">
      <div className="rounded-3xl bg-[#0F0F0F] px-6 py-8 text-white shadow-2xl shadow-black/10 sm:px-8">
        <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-white/70">
          <CheckCircle2 className="h-3.5 w-3.5 text-primary" />
          {plans[plan]} workspace
        </div>
        <h1 className="max-w-2xl text-3xl font-semibold tracking-tight sm:text-4xl">
          Your organizer workspace is ready.
        </h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-white/60">
          Next, create an event. After the event exists, you can publish its guest-facing RSVP page, share it, import guests, assign staff, and monitor responses from the dashboard.
        </p>
        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <Button asChild size="lg" className="bg-white text-black hover:bg-white/90">
            <Link href="/dashboard/events/new">
              Create first event
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
          <Button asChild size="lg" variant="outline" className="border-white/15 bg-white/5 text-white hover:bg-white/10 hover:text-white">
            <Link href="/demo/rsvp">Preview guest RSVP</Link>
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {steps.map((step) => (
          <Card key={step.title}>
            <CardContent className="p-5">
              <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <step.icon className="h-5 w-5" />
              </div>
              <h2 className="text-base font-semibold">{step.title}</h2>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">{step.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
