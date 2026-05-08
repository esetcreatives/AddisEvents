'use client'

import { useState, Suspense } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { useEffect } from 'react'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { Eye, EyeOff, ArrowLeft, KeySquare, Mail } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

function LoginPageContent() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [loginMethod, setLoginMethod] = useState<'email' | 'pin'>('email')
  const [pin, setPin] = useState('')
  const searchParams = useSearchParams()

  useEffect(() => {
    if (searchParams.get('method') === 'pin') {
      setLoginMethod('pin')
    }
  }, [searchParams])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      if (loginMethod === 'pin') {
        const res = await fetch('/api/auth/pin-login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ pin })
        })
        const result = await res.json()
        if (!res.ok) throw new Error(result.error || 'Invalid PIN')
        
        router.push('/staff')
        return
      }

      const supabase = createClient()
      const { data, error: authError } = await supabase.auth.signInWithPassword({ email, password })
      
      if (authError) {
        setError(authError.message)
      } else {
        const { data: profile } = await supabase
          .from('users')
          .select('role, status, must_change_password')
          .eq('id', data.user.id)
          .single()
        const role = profile?.role || data.user?.user_metadata?.role || 'organizer'

        if (!data.user.email_confirmed_at) {
          await supabase.auth.signOut()
          setError('Please verify your email before signing in.')
          return
        }

        if (profile?.status === 'suspended') {
          await supabase.auth.signOut()
          setError('Account suspended. Please contact an administrator.')
          return
        }

        if (profile?.must_change_password || data.user.user_metadata?.must_change_password) {
          router.push('/change-password')
        } else if (role === 'client') {
          router.push('/portal')
        } else if (role === 'staff') {
          router.push('/staff')
        } else if (role === 'super_admin' || role === 'manager') {
          router.push('/admin')
        } else {
          const { count } = await supabase
            .from('events')
            .select('id', { count: 'exact', head: true })
            .eq('organizer_id', data.user.id)

          router.push(count && count > 0 ? '/dashboard' : '/dashboard/onboarding')
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-sm mx-4"
      >
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-8"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Back
        </Link>

        <div className="mb-8">
          <h1 className="text-2xl font-semibold">Sign in</h1>
          <p className="text-sm text-muted-foreground mt-1">Welcome back to Addis Events.</p>
        </div>

        {error && (
          <div className="mb-5 p-3 rounded-lg bg-red-50 border border-red-200 text-sm text-red-600">
            {error}
          </div>
        )}

        {/* Removed Staff PIN toggle */}

        <form onSubmit={handleLogin} className="space-y-4">
          {loginMethod === 'email' ? (
            <>
              <div className="space-y-1.5">
                <Label htmlFor="login-email">Email</Label>
                <Input
                  id="login-email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label htmlFor="login-password">Password</Label>
                  <Link href="/reset-password" className="text-xs text-muted-foreground hover:text-foreground">Forgot?</Link>
                </div>
                <div className="relative">
                  <Input
                    id="login-password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="space-y-1.5">
              <Label htmlFor="login-pin">Event PIN Code</Label>
              <Input
                id="login-pin"
                type="text"
                placeholder="e.g. 1234"
                value={pin}
                onChange={(e) => setPin(e.target.value)}
                required
                className="font-mono text-center text-lg tracking-widest"
                maxLength={6}
              />
              <p className="text-xs text-muted-foreground text-center mt-2">
                Enter the PIN provided by your event organizer.
              </p>
            </div>
          )}

          <Button type="submit" disabled={loading} className="w-full">
            {loading ? 'Signing in...' : 'Sign In'}
          </Button>
        </form>
        <Separator className="my-6" />

        <p className="text-center text-sm text-muted-foreground">
          No account?{' '}
          <Link href="/signup" className="text-foreground hover:underline font-medium">
            Create one
          </Link>
        </p>

        {/* Removed other portals section */}
      </motion.div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginPageContent />
    </Suspense>
  )
}
