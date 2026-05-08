'use client'

import { motion } from 'framer-motion'

const logos = [
  { name: 'Sheraton Addis', id: 'sheraton' },
  { name: 'Ethio Telecom', id: 'ethio' },
  { name: 'Safaricom Ethiopia', id: 'safaricom' },
  { name: 'Hyatt Regency', id: 'hyatt' },
  { name: 'Flawless Events', id: 'flawless' },
  { name: 'Zoma Museum', id: 'zoma' },
]

export function TrustedBySection() {
  return (
    <section id="trusted-by" className="py-24 md:py-32 border-y border-border bg-white overflow-hidden">
      <div className="max-w-7xl mx-auto px-5 sm:px-8">
        <motion.p 
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-[11px] font-bold text-center text-muted-foreground uppercase tracking-[0.4em] mb-20"
        >
          Trusted by Ethiopia's Leading Organizations
        </motion.p>
        
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-3 gap-x-12 gap-y-24 items-center justify-items-center opacity-30 grayscale transition-all duration-700 hover:grayscale-0 hover:opacity-100">
          {logos.map((logo, i) => (
            <motion.div
              key={logo.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: i * 0.1 }}
              className="text-2xl md:text-3xl lg:text-4xl font-heading font-black tracking-[0.1em] text-center uppercase"
            >
              <span className="inline-block hover:scale-110 transition-transform duration-300 cursor-default">
                {logo.name}
              </span>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
