'use client'

import { motion } from 'framer-motion'
import { CalendarPlus, Send, ScanLine } from 'lucide-react'

const steps = [
  {
    step: '01',
    icon: CalendarPlus,
    title: 'Create your event',
    description: 'Set up your wedding or corporate event in minutes. Add venue, agenda, and customize your public microsite.',
  },
  {
    step: '02',
    icon: Send,
    title: 'Invite & manage guests',
    description: 'Import your guest list, send personalized RSVP links via Telegram or email, and track responses live.',
  },
  {
    step: '03',
    icon: ScanLine,
    title: 'Execute flawlessly',
    description: 'Use QR check-in, manage seating, run your day-of timeline, and review post-event analytics.',
  },
]

export function HowItWorksSection() {
  return (
    <section id="how-it-works" className="py-24 md:py-32 bg-[#0F0F0F] text-white relative overflow-hidden">
      {/* Background accent glows */}
      <div className="absolute top-1/2 left-0 w-[500px] h-[500px] bg-primary/10 rounded-full blur-[150px] -translate-y-1/2 pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-[400px] h-[400px] bg-primary/5 rounded-full blur-[120px] pointer-events-none" />

      <div className="relative max-w-7xl mx-auto px-5 sm:px-8">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-16 md:mb-20"
        >
          <p className="text-sm font-medium text-primary tracking-wide uppercase mb-3">
            How it works
          </p>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-semibold max-w-lg mx-auto">
            Three steps to a
            <br />
            perfect event.
          </h2>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-6 relative">
          {/* Connecting line (desktop only) */}
          <div className="hidden md:block absolute top-16 left-[16.5%] right-[16.5%] h-px">
            <motion.div
              initial={{ scaleX: 0 }}
              whileInView={{ scaleX: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 1, delay: 0.3 }}
              className="w-full h-full bg-gradient-to-r from-primary/40 via-primary/20 to-primary/40 origin-left"
            />
          </div>

          {steps.map((step, i) => (
            <motion.div
              key={step.step}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.15 }}
              className="relative text-center"
            >
              {/* Step circle */}
              <div className="relative mx-auto mb-8">
                <div className="w-32 h-32 rounded-full border border-white/[0.06] bg-white/[0.03] flex items-center justify-center mx-auto">
                  <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
                    <step.icon className="w-8 h-8 text-primary" strokeWidth={1.5} />
                  </div>
                </div>
                {/* Step number badge */}
                <div className="absolute -top-1 -right-1 md:top-0 md:right-[calc(50%-60px)] w-8 h-8 rounded-full bg-primary flex items-center justify-center text-xs font-bold text-white shadow-lg shadow-primary/30">
                  {step.step}
                </div>
              </div>

              <h3 className="text-xl font-semibold mb-3">{step.title}</h3>
              <p className="text-sm text-white/50 leading-relaxed max-w-xs mx-auto">
                {step.description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
