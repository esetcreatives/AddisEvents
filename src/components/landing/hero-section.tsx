'use client'

import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { ArrowRight, Play, Sparkles } from 'lucide-react'
import Link from 'next/link'
import { useEffect, useRef, useState } from 'react'

export function HeroSection() {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [videoLoaded, setVideoLoaded] = useState(false)

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.playbackRate = 0.75
    }
  }, [videoLoaded])

  return (
    <section className="relative min-h-[100svh] flex items-center overflow-hidden">
      {/* Video Background */}
      <div className="absolute inset-0 z-0">
        <video
          ref={videoRef}
          autoPlay
          muted
          loop
          playsInline
          onLoadedData={() => setVideoLoaded(true)}
          className="absolute inset-0 w-full h-full object-cover animate-slow-zoom"
          poster="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 1920 1080'%3E%3Crect fill='%230F0F0F' width='1920' height='1080'/%3E%3C/svg%3E"
        >
          {/* Premium event/celebration stock video */}
          <source
            src="https://videos.pexels.com/video-files/3298572/3298572-hd_1920_1080_30fps.mp4"
            type="video/mp4"
          />
        </video>

        {/* Multi-layer overlay for depth */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/50 to-black/80" />
        <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-transparent to-black/40" />
        {/* Burgundy accent glow */}
        <div className="absolute bottom-0 left-1/4 w-[600px] h-[400px] bg-primary/20 rounded-full blur-[120px] pointer-events-none" />
      </div>

      {/* Noise texture overlay */}
      <div className="absolute inset-0 z-[1] noise-overlay pointer-events-none" />

      {/* Content */}
      <div className="relative z-10 max-w-7xl mx-auto px-5 sm:px-8 w-full pt-32 pb-16 md:pt-40 md:pb-24">
        <div className="max-w-3xl">
          {/* Tag line */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass-dark mb-8"
          >
            <Sparkles className="w-3.5 h-3.5 text-primary" />
            <span className="text-xs font-medium text-white/80 tracking-wide uppercase">
              Event Management Platform
            </span>
          </motion.div>

          {/* Heading */}
          <motion.h1
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.3 }}
            className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-heading font-semibold leading-[1.05] text-white mb-6"
          >
            Plan events that
            <br />
            <span className="text-gradient">people remember.</span>
          </motion.h1>

          {/* Subheading */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.5 }}
            className="text-lg md:text-xl text-white/60 leading-relaxed max-w-xl mb-10"
          >
            The all-in-one platform for managing corporate events and weddings
            in Addis Ababa. RSVP, check-in, seating, and more.
          </motion.p>

          {/* CTAs */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.7 }}
            className="flex flex-col sm:flex-row gap-3"
          >
            <Link href="/signup">
              <Button
                size="lg"
                className="text-base px-8 h-13 group shadow-lg shadow-primary/20"
              >
                Start for free
                <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
              </Button>
            </Link>
            <a href="#features">
              <Button
                variant="outline"
                size="lg"
                className="text-base px-8 h-13 border-white/20 text-white bg-white/5 hover:bg-white/10 hover:text-white"
              >
                <Play className="mr-2 w-4 h-4" />
                See features
              </Button>
            </a>
          </motion.div>
        </div>

        {/* Floating Stats Bar */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 1.0 }}
          className="mt-20 lg:mt-28"
        >
          <div className="inline-flex flex-wrap gap-0 rounded-2xl overflow-hidden glass-dark">
            {[
              { value: '500+', label: 'Events managed' },
              { value: '50K+', label: 'Guests served' },
              { value: '99%', label: 'Satisfaction' },
              { value: '24/7', label: 'Support' },
            ].map((stat, i) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.4, delay: 1.2 + i * 0.1 }}
                className="px-8 py-5 border-r border-white/[0.06] last:border-0"
              >
                <p className="text-2xl md:text-3xl font-heading font-semibold text-white">
                  {stat.value}
                </p>
                <p className="text-xs text-white/40 mt-1 uppercase tracking-wider">
                  {stat.label}
                </p>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Scroll indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 2 }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10"
      >
        <div className="w-6 h-10 rounded-full border-2 border-white/20 flex justify-center pt-2">
          <motion.div
            animate={{ y: [0, 8, 0] }}
            transition={{ duration: 1.5, repeat: Infinity }}
            className="w-1.5 h-1.5 rounded-full bg-white/40"
          />
        </div>
      </motion.div>
    </section>
  )
}
