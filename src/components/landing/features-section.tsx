'use client'

import { motion } from 'framer-motion'
import {
  Calendar,
  Users,
  QrCode,
  LayoutGrid,
  Ticket,
  Store,
  ClipboardList,
  BarChart3,
  Globe,
} from 'lucide-react'

const features = [
  {
    icon: Calendar,
    title: 'Event Management',
    description: 'Create weddings and corporate events with microsites, countdowns, and status tracking.',
    accent: 'from-red-500/10 to-orange-500/10',
    iconColor: 'text-red-500',
  },
  {
    icon: Users,
    title: 'Guest & RSVP',
    description: 'Import guests via CSV, send personalized RSVP links, track responses in real time.',
    accent: 'from-blue-500/10 to-indigo-500/10',
    iconColor: 'text-blue-500',
  },
  {
    icon: QrCode,
    title: 'QR Check-in',
    description: 'Mobile-first scanner for staff with offline fallback and live attendance counters.',
    accent: 'from-emerald-500/10 to-teal-500/10',
    iconColor: 'text-emerald-500',
  },
  {
    icon: LayoutGrid,
    title: 'Seating Charts',
    description: 'Drag-and-drop table editor with round and rectangular layouts. Export to PDF.',
    accent: 'from-violet-500/10 to-purple-500/10',
    iconColor: 'text-violet-500',
  },
  {
    icon: Ticket,
    title: 'Ticketing',
    description: 'VIP, Early Bird, and General tiers with promo codes and Sheger Pay verification.',
    accent: 'from-amber-500/10 to-yellow-500/10',
    iconColor: 'text-amber-500',
  },
  {
    icon: Store,
    title: 'Vendor Management',
    description: 'Directory of caterers, decorators, AV, and photographers. Assign per event.',
    accent: 'from-pink-500/10 to-rose-500/10',
    iconColor: 'text-pink-500',
  },
  {
    icon: ClipboardList,
    title: 'Tasks & Runsheet',
    description: 'Per-event checklists, team assignments, and day-of timeline views.',
    accent: 'from-sky-500/10 to-cyan-500/10',
    iconColor: 'text-sky-500',
  },
  {
    icon: BarChart3,
    title: 'Analytics',
    description: 'RSVP conversion, attendance rates, revenue tracking, and PDF reports.',
    accent: 'from-lime-500/10 to-green-500/10',
    iconColor: 'text-lime-600',
  },
  {
    icon: Globe,
    title: 'Bilingual',
    description: 'Full English and Amharic support. Guest-facing pages default to Amharic.',
    accent: 'from-stone-500/10 to-zinc-500/10',
    iconColor: 'text-stone-500',
  },
]

export function FeaturesSection() {
  return (
    <section id="features" className="py-24 md:py-32 relative overflow-hidden">
      {/* Subtle dot pattern background */}
      <div className="absolute inset-0 dot-pattern opacity-40 pointer-events-none" />

      <div className="relative max-w-7xl mx-auto px-5 sm:px-8">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-16 md:mb-20"
        >
          <p className="text-sm font-medium text-primary tracking-wide uppercase mb-3">
            Features
          </p>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-semibold max-w-2xl mx-auto">
            Everything you need for{' '}
            <span className="text-gradient">flawless events.</span>
          </h2>
          <p className="text-muted-foreground mt-4 max-w-lg mx-auto">
            From guest management to real-time analytics, every tool you need
            in one integrated platform.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {features.map((feature, i) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: i * 0.05 }}
              className="group relative"
            >
              <div className="relative overflow-hidden rounded-2xl border border-border bg-white p-6 md:p-7 card-lift h-full">
                {/* Gradient hover glow */}
                <div className={`absolute top-0 right-0 w-40 h-40 bg-gradient-to-bl ${feature.accent} rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 -translate-y-1/2 translate-x-1/2`} />

                <div className="relative">
                  <div className={`inline-flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br ${feature.accent} mb-4`}>
                    <feature.icon className={`w-5 h-5 ${feature.iconColor}`} strokeWidth={1.5} />
                  </div>
                  <h3 className="text-base font-semibold mb-2">{feature.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {feature.description}
                  </p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
