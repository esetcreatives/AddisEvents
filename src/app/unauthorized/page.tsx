'use client'

import { motion } from 'framer-motion'
import { ShieldX, ArrowLeft, LogIn } from 'lucide-react'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

export default function UnauthorizedPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#FAFAF9] relative overflow-hidden">
      {/* Background accents */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-red-500/5 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/2" />
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-primary/5 rounded-full blur-[100px] translate-y-1/2 -translate-x-1/2" />

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="text-center max-w-md mx-4 relative z-10"
      >
        <div className="w-24 h-24 rounded-3xl bg-white border border-border shadow-sm flex items-center justify-center mx-auto mb-8 card-lift">
          <div className="w-16 h-16 rounded-2xl bg-red-50 flex items-center justify-center">
            <ShieldX className="w-8 h-8 text-red-500" />
          </div>
        </div>

        <h1 className="text-4xl font-heading font-bold mb-4 tracking-tight">
          Restricted Area
        </h1>

        <p className="text-muted-foreground leading-relaxed mb-10 text-lg">
          It seems you've wandered into a section you don't have access to. 
          Please ensure you're logged in with the correct account.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link href="/" className="w-full sm:w-auto">
            <Button variant="outline" size="lg" className="gap-2 w-full h-12 rounded-xl border-border/60 hover:bg-white transition-all">
              <ArrowLeft className="w-4 h-4" />
              Back to Home
            </Button>
          </Link>
          <Link href="/login" className="w-full sm:w-auto">
            <Button size="lg" className="gap-2 w-full h-12 rounded-xl shadow-lg shadow-primary/20 transition-all">
              <LogIn className="w-4 h-4" />
              Switch Account
            </Button>
          </Link>
        </div>
      </motion.div>
    </div>
  )
}
