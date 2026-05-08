'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Eye, EyeOff, ShieldCheck, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { createClient } from '@/lib/supabase/client'

export default function StaffLoginPage() {
  const router = useRouter()
  const [form, setForm] = useState({ email: '', password: '' })
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const submit = async (event: React.FormEvent) => {
    event.preventDefault()
    setLoading(true)
    setError('')

    const supabase = createClient()
    const { data, error: authError } = await supabase.auth.signInWithPassword({
      email: form.email.trim().toLowerCase(),
      password: form.password,
    })

    if (authError || !data.user) {
      setLoading(false)
      setError(authError?.message || 'Unable to sign in.')
      return
    }

    // Verify this is a staff account
    const { data: profile } = await supabase
      .from('users')
      .select('role, status')
      .eq('id', data.user.id)
      .single()

    const role = profile?.role || data.user.user_metadata?.role

    if (role !== 'staff') {
      await supabase.auth.signOut()
      setLoading(false)
      if (role === 'organizer') {
        setError('This is the staff portal. Organizers should use the organizer login.')
      } else if (role === 'client') {
        setError('This is the staff portal. Clients should use the client portal.')
      } else if (role === 'super_admin' || role === 'manager') {
        setError('This is the staff portal. Admins should use the admin portal.')
      } else {
        setError('Your account does not have staff access.')
      }
      return
    }

    if (profile && profile.status === 'suspended') {
      await supabase.auth.signOut()
      setLoading(false)
      setError('Account suspended. Please contact your organizer.')
      return
    }

    router.push('/staff')
  }

  return (
    <main className="min-h-screen bg-[#FAFAF9] relative overflow-hidden flex items-center justify-center px-4 py-10">
      {/* Background accents */}
      <div className="absolute top-0 right-0 w-72 h-72 bg-primary/5 rounded-full blur-[100px] -translate-y-1/3 translate-x-1/3 pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-72 h-72 bg-primary/5 rounded-full blur-[100px] translate-y-1/3 -translate-x-1/3 pointer-events-none" />

      <div className="relative z-10 w-full max-w-md space-y-6">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </Link>

        <section className="rounded-2xl border border-border/60 bg-white p-8 shadow-xl shadow-black/[0.03]">
          {/* Header */}
          <div className="flex items-center gap-3 mb-6">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-2xl font-heading font-bold tracking-tight">Staff Login</h1>
              <p className="text-xs text-muted-foreground mt-0.5">
                Sign in with your staff credentials
              </p>
            </div>
          </div>

          <form onSubmit={submit} className="space-y-5">
            {error && (
              <div className="rounded-xl border border-red-200 bg-red-50 p-3.5 text-sm text-red-600 leading-relaxed">
                {error}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium">
                Email
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="staff@company.com"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="rounded-xl h-12"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm font-medium">
                Password
              </Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Enter your password"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  className="rounded-xl h-12 pr-12"
                  required
                />
                <button
                  type="button"
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label="Toggle password visibility"
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
              <p className="text-[10px] text-muted-foreground px-1">
                Use the temporary password provided by your organizer.
              </p>
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full h-12 rounded-xl shadow-lg shadow-primary/20 transition-all active:scale-[0.98]"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Signing in…
                </>
              ) : (
                'Sign in'
              )}
            </Button>
          </form>

          <div className="mt-6 space-y-2 text-center text-sm text-muted-foreground">
            <p>
              Event organizer?{' '}
              <Link
                href="/login"
                className="font-medium text-foreground hover:underline"
              >
                Login here
              </Link>
            </p>
            <p>
              Client?{' '}
              <Link
                href="/portal/login"
                className="font-medium text-foreground hover:underline"
              >
                Client portal
              </Link>
            </p>
          </div>
        </section>
      </div>
    </main>
  )
}
