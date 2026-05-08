'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Eye, EyeOff, Shield } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { createClient } from '@/lib/supabase/client'

export default function AdminLoginPage() {
  const router = useRouter()
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState({ email: '', password: '' })

  const submit = async (event: React.FormEvent) => {
    event.preventDefault()
    setLoading(true)
    setError('')

    try {
      const supabase = createClient()
      const { data, error: authError } = await supabase.auth.signInWithPassword(form)

      if (authError || !data.user) {
        setLoading(false)
        if (authError?.message === 'Failed to fetch') {
          setError('Network error connecting to the database. If this is a deployed site, please ensure NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY environment variables are set correctly in your hosting dashboard.')
        } else {
          setError(authError?.message || 'Unable to sign in.')
        }
        return
      }

      const { data: profile } = await supabase.from('users').select('role, status, must_change_password').eq('id', data.user.id).single()

      const isAdmin = profile?.role === 'super_admin' || profile?.role === 'manager' || 
                      data.user.app_metadata?.role === 'super_admin' || data.user.app_metadata?.role === 'manager' ||
                      data.user.user_metadata?.role === 'super_admin' || data.user.user_metadata?.role === 'manager'

      if (!isAdmin) {
        await supabase.auth.signOut()
        setLoading(false)
        setError('This portal is only for authorized HQ staff.')
        return
      }

      if (profile?.status === 'suspended') {
        await supabase.auth.signOut()
        setLoading(false)
        setError('This account is suspended. Contact platform support.')
        return
      }

      // --- TEMPORARILY DISABLED 2FA ---
      // const res = await fetch('/api/admin/2fa/send', { 
      //   method: 'POST',
      //   headers: {
      //     'Content-Type': 'application/json'
      //   },
      //   body: JSON.stringify({})
      // })
      // 
      // let result
      // try {
      //   result = await res.json()
      // } catch (e) {
      //   throw new Error('Server returned an invalid response. Please try again.')
      // }
      // 
      // setLoading(false)
      // 
      // if (!res.ok) {
      //   setError(result.error || 'Unable to send verification code.')
      //   return
      // }
      // 
      // if (result.devCode) {
      //   sessionStorage.setItem('ae_admin_dev_2fa', result.devCode)
      // }
      // 
      // router.push('/admin/verify-2fa')

      setLoading(false)
      if (profile?.must_change_password || data.user.user_metadata?.must_change_password) {
        router.push('/change-password')
      } else {
        router.push('/admin')
      }
    } catch (e) {
      setLoading(false)
      const msg = e instanceof Error ? e.message : ''
      if (msg === 'Failed to fetch') {
        setError('Network error. If this is a deployed site, please ensure NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY environment variables are set correctly.')
      } else {
        setError(msg || 'A network error occurred. Please check your connection.')
      }
    }
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-background px-4 py-10">
      <div className="pointer-events-none absolute inset-0 dot-pattern opacity-35" />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-80 bg-[linear-gradient(180deg,rgba(145,9,30,0.1),rgba(90,122,107,0.045)_48%,transparent)]" />
      <div className="relative mx-auto max-w-md">
        <Link href="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" />
          Back
        </Link>
        <section className="mt-10 rounded-2xl border border-border/70 bg-white/90 p-6 shadow-xl shadow-black/[0.06] backdrop-blur-sm">
          <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary ring-1 ring-primary/10">
            <Shield className="h-6 w-6" />
          </div>
          <h1 className="text-2xl font-semibold">Admin sign in</h1>
          <p className="mt-2 text-sm text-muted-foreground">Use your super admin account. A 6-digit code will be emailed after password validation.</p>

          <form onSubmit={submit} className="mt-6 space-y-4">
            {error && <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-600">{error}</div>}
            <div className="space-y-2">
              <Label htmlFor="admin-email">Email</Label>
              <Input id="admin-email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="admin-password">Password</Label>
              <div className="relative">
                <Input id="admin-password" type={showPassword ? 'text' : 'password'} value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} className="pr-10" required />
                <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground" onClick={() => setShowPassword(!showPassword)} aria-label="Toggle password visibility">
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
            <Button type="submit" disabled={loading} className="w-full">
              {loading ? 'Checking...' : 'Continue'}
            </Button>
          </form>
        </section>
      </div>
    </main>
  )
}
