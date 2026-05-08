'use client'

import { motion } from 'framer-motion'
import { Star, Quote } from 'lucide-react'

const testimonials = [
  {
    name: 'Hanna Tesfaye',
    role: 'Wedding Planner',
    company: 'Hanna Events',
    text: 'Addis Events transformed how we manage our weddings. The QR check-in alone saved us hours at the door. Our clients love the portal.',
    rating: 5,
  },
  {
    name: 'Dawit Mekonnen',
    role: 'Marketing Director',
    company: 'Ethio Telecom',
    text: 'We used it for our product launch — 800 guests, seamless RSVP, and real-time analytics. The best event tool in Ethiopia.',
    rating: 5,
  },
  {
    name: 'Sara Abebe',
    role: 'Event Coordinator',
    company: 'Sheraton Addis',
    text: 'The seating chart editor and vendor management saved our team weeks of manual work. Highly recommended for corporate events.',
    rating: 5,
  },
]

export function TestimonialsSection() {
  return (
    <section id="testimonials" className="py-24 md:py-32 bg-[#FAFAF9] relative overflow-hidden">
      <div className="absolute inset-0 dot-pattern opacity-30 pointer-events-none" />
      <div className="relative max-w-7xl mx-auto px-5 sm:px-8">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16 md:mb-20"
        >
          <p className="text-sm font-medium text-primary tracking-wide uppercase mb-3">Testimonials</p>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-semibold">
            Trusted by Addis&apos;s <span className="text-gradient">best organizers.</span>
          </h2>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {testimonials.map((t, i) => (
            <motion.div
              key={t.name}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: i * 0.1 }}
              className="relative bg-white rounded-2xl border border-border p-7 card-lift"
            >
              <Quote className="w-8 h-8 text-primary/10 mb-4" />
              <p className="text-sm text-muted-foreground leading-relaxed mb-6">{t.text}</p>
              <div className="flex items-center gap-1 mb-4">
                {Array.from({ length: t.rating }).map((_, j) => (
                  <Star key={j} className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                ))}
              </div>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center font-heading font-bold text-primary text-sm">
                  {t.name[0]}
                </div>
                <div>
                  <p className="text-sm font-semibold">{t.name}</p>
                  <p className="text-xs text-muted-foreground">{t.role}, {t.company}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
