'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Menu, X, User, LogOut } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { AnimatePresence, motion } from 'framer-motion'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

const navLinks = [
  { href: '#trusted-by', label: 'Trusted By' },
  { href: '#features', label: 'Features' },
  { href: '#how-it-works', label: 'How It Works' },
  { href: '#testimonials', label: 'Testimonials' },
  { href: '#pricing', label: 'Pricing' },
  { href: '#contact', label: 'Contact' },
]

export function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false)
  const [isMobileOpen, setIsMobileOpen] = useState(false)
  const [user, setUser] = useState<any>(null)
  const [role, setRole] = useState<string>('organizer')
  const supabase = createClient()
  const router = useRouter()

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 10)
    window.addEventListener('scroll', handleScroll)

    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
      if (user) {
        setRole(user.user_metadata?.role || 'organizer')
      }
    }
    checkUser()

    return () => window.removeEventListener('scroll', handleScroll)
  }, [supabase])

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    setUser(null)
    router.refresh()
  }

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${isScrolled
          ? 'glass-navbar border-b border-border/50 shadow-sm'
          : 'bg-transparent'
        }`}
    >
      <nav className="max-w-7xl mx-auto px-5 sm:px-8">
        <div className="flex items-center justify-between h-16 md:h-18">
          <Link href="/" className="font-heading text-xl font-semibold tracking-tight">
            <span className={isScrolled ? 'text-foreground' : 'text-white'}>Addis</span>
            <span className="text-primary">Events</span>
          </Link>

          {/* Desktop */}
          <div className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className={`text-sm transition-colors ${isScrolled
                    ? 'text-muted-foreground hover:text-foreground'
                    : 'text-white/60 hover:text-white'
                  }`}
              >
                {link.label}
              </a>
            ))}
          </div>

          <div className="hidden md:flex items-center gap-3">
            {user ? (
              <div className="flex items-center gap-3">
                <Link href={role === 'super_admin' ? '/admin' : role === 'client' ? '/portal' : '/dashboard'}>
                  <Button
                    size="sm"
                    variant={isScrolled ? 'outline' : 'ghost'}
                    className={`gap-2 ${!isScrolled && 'text-white/80 border-white/20 hover:bg-white/10 hover:text-white'
                      }`}
                  >
                    <User className="w-4 h-4" />
                    {role === 'super_admin' ? 'Admin Panel' : role === 'client' ? 'Client Portal' : 'Dashboard'}
                  </Button>
                </Link>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleSignOut}
                  className={!isScrolled ? 'text-white/60 hover:text-white hover:bg-white/10' : ''}
                >
                  <LogOut className="w-4 h-4" />
                </Button>
              </div>
            ) : (
              <>
                <Link href="/login">
                  <Button
                    variant="ghost"
                    size="sm"
                    className={!isScrolled ? 'text-white/80 hover:text-white hover:bg-white/10' : ''}
                  >
                    Sign In
                  </Button>
                </Link>
                <Link href="/signup">
                  <Button
                    size="sm"
                    className={
                      !isScrolled
                        ? 'bg-white/10 text-white border border-white/20 hover:bg-white/20 shadow-none'
                        : ''
                    }
                  >
                    Get Started
                  </Button>
                </Link>
              </>
            )}
          </div>

          <button
            onClick={() => setIsMobileOpen(!isMobileOpen)}
            className={`md:hidden p-2 ${!isScrolled ? 'text-white' : ''}`}
            aria-label="Toggle menu"
          >
            {isMobileOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </nav>

      <AnimatePresence>
        {isMobileOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden bg-white border-b border-border overflow-hidden"
          >
            <div className="px-5 py-6 space-y-4">
              {navLinks.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  onClick={() => setIsMobileOpen(false)}
                  className="block text-base text-muted-foreground hover:text-foreground"
                >
                  {link.label}
                </a>
              ))}
              <div className="pt-4 border-t border-border flex flex-col gap-2">
                {user ? (
                  <>
                    <Link href={role === 'super_admin' ? '/admin' : role === 'client' ? '/portal' : '/dashboard'}>
                      <Button className="w-full">
                        {role === 'super_admin' ? 'Admin Panel' : role === 'client' ? 'Client Portal' : 'Dashboard'}
                      </Button>
                    </Link>
                    <Button variant="outline" className="w-full" onClick={handleSignOut}>
                      Sign Out
                    </Button>
                  </>
                ) : (
                  <>
                    <Link href="/login">
                      <Button variant="outline" className="w-full">Sign In</Button>
                    </Link>
                    <Link href="/signup">
                      <Button className="w-full">Get Started</Button>
                    </Link>
                  </>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  )
}
