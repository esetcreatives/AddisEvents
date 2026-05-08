'use client'

import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Check, ArrowRight, Sparkles } from 'lucide-react'
import Link from 'next/link'

const plans = [
  {
    name: 'Starter',
    price: '2,500',
    description: 'For intimate gatherings and small meetings.',
    features: [
      'Up to 100 guests',
      'RSVP management',
      'QR check-in',
      'Event microsite',
      'Email confirmations',
      'Basic analytics',
    ],
    cta: 'Get Started',
    href: '/signup?plan=starter',
    highlighted: false,
  },
  {
    name: 'Professional',
    price: '7,500',
    description: 'For weddings and corporate events that demand excellence.',
    features: [
      'Up to 500 guests',
      'Everything in Starter',
      'Seating chart editor',
      'Vendor management',
      'Task & runsheet',
      'Client portal',
      'Telegram sharing',
      'PDF reports',
    ],
    cta: 'Start Free Trial',
    href: '/signup?plan=professional',
    highlighted: true,
  },
  {
    name: 'Enterprise',
    price: '15,000',
    description: 'For large-scale events and premium productions.',
    features: [
      'Unlimited guests',
      'Everything in Professional',
      'Ticketing with Sheger Pay',
      'Full Amharic support',
      'Custom branding',
      'Dedicated account manager',
      'API access',
    ],
    cta: 'Contact Sales',
    href: '#contact',
    highlighted: false,
  },
]

export function PricingSection() {
  return (
    <section id="pricing" className="py-24 md:py-32 relative overflow-hidden">
      <div className="absolute inset-0 dot-pattern opacity-30 pointer-events-none" />

      <div className="relative max-w-7xl mx-auto px-5 sm:px-8">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-16 md:mb-20"
        >
          <p className="text-sm font-medium text-primary tracking-wide uppercase mb-3">
            Pricing
          </p>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-semibold max-w-lg mx-auto">
            Simple, per-event pricing.
          </h2>
          <p className="text-muted-foreground mt-4 max-w-md mx-auto">
            Pay only when you use it. No monthly fees. All prices in Ethiopian Birr.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-5 items-start">
          {plans.map((plan, i) => (
            <motion.div
              key={plan.name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: i * 0.1 }}
              className={`relative rounded-2xl flex flex-col overflow-hidden ${
                plan.highlighted
                  ? 'bg-[#0F0F0F] text-white ring-1 ring-white/10 shadow-2xl lg:scale-105 lg:-my-2'
                  : 'bg-white border border-border card-lift'
              }`}
            >
              {/* Popular badge */}
              {plan.highlighted && (
                <div className="absolute top-0 right-0 px-4 py-1.5 bg-primary text-white text-xs font-semibold rounded-bl-xl flex items-center gap-1.5">
                  <Sparkles className="w-3 h-3" />
                  Most Popular
                </div>
              )}

              <div className="p-8">
                <div className="mb-6">
                  <h3 className="text-lg font-semibold">{plan.name}</h3>
                  <p className={`text-sm mt-1 ${plan.highlighted ? 'text-white/50' : 'text-muted-foreground'}`}>
                    {plan.description}
                  </p>
                </div>

                <div className="mb-8">
                  <span className={`text-sm ${plan.highlighted ? 'text-white/40' : 'text-muted-foreground'}`}>
                    ETB{' '}
                  </span>
                  <span className="text-4xl font-heading font-bold">{plan.price}</span>
                  <span className={`text-sm ${plan.highlighted ? 'text-white/40' : 'text-muted-foreground'}`}>
                    {' '}/ event
                  </span>
                </div>

                <ul className="space-y-3 mb-8 flex-1">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-3 text-sm">
                      <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${
                        plan.highlighted
                          ? 'bg-primary/20'
                          : 'bg-primary/10'
                      }`}>
                        <Check className={`w-3 h-3 ${plan.highlighted ? 'text-primary' : 'text-primary'}`} />
                      </div>
                      <span className={plan.highlighted ? 'text-white/70' : ''}>{feature}</span>
                    </li>
                  ))}
                </ul>

                <Link href={plan.href} className="block">
                  <Button
                    className={`w-full group h-12 ${
                      plan.highlighted
                        ? 'bg-white text-black hover:bg-white/90'
                        : ''
                    }`}
                    variant={plan.highlighted ? 'default' : 'outline'}
                  >
                    {plan.cta}
                    <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                  </Button>
                </Link>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
