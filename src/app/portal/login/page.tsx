'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Eye, EyeOff } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { createClient } from '@/lib/supabase/client'

export default function PortalLoginPage() {
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
    const { data, error: authError } = await supabase.auth.signInWithPassword(form)
    if (authError || !data.user) {
      setLoading(false)
      setError(authError?.message || 'Unable to sign in.')
      return
    }

    const { data: profile } = await supabase.from('users').select('role, status, must_change_password').eq('id', data.user.id).single()
    const role = profile?.role || data.user.user_metadata?.role

    if (role !== 'client') {
      await supabase.auth.signOut()
      setLoading(false)
      setError('This is the client portal. Event organizers should use the organizer login.')
      return
    }
    if (profile && profile.status === 'suspended') {
      await supabase.auth.signOut()
      setLoading(false)
      setError('Account suspended. Please contact your organizer.')
      return
    }

    if (profile?.must_change_password || data.user.user_metadata?.must_change_password) {
      router.push('/change-password')
    } else {
      router.push('/portal')
    }
  }

  return (
    <main className="min-h-screen bg-background px-4 py-10">
      <div className="mx-auto max-w-md">
        <Link href="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" />
          Back
        </Link>
        <section className="mt-10 rounded-lg border bg-white p-6 shadow-sm">
          <h1 className="text-2xl font-semibold">Client portal</h1>
          <p className="mt-2 text-sm text-muted-foreground">Sign in to review your assigned event progress, vendors, guests, and reports.</p>
          <form onSubmit={submit} className="mt-6 space-y-4">
            {error && <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-600">{error}</div>}
            <div className="space-y-2">
              <Label>Email</Label>
              <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
            </div>
            <div className="space-y-2">
              <Label>Password</Label>
              <div className="relative">
                <Input type={showPassword ? 'text' : 'password'} value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} className="pr-10" required />
                <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground" onClick={() => setShowPassword(!showPassword)} aria-label="Toggle password visibility">
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
            <Button type="submit" disabled={loading} className="w-full">{loading ? 'Signing in...' : 'Sign in'}</Button>
          </form>
          <div className="mt-6 space-y-2 text-center text-sm text-muted-foreground">
            <p>
              Event organizer? <Link href="/login" className="font-medium text-foreground hover:underline">Login here</Link>
            </p>
            <p>
              Super admin? <Link href="/admin/login" className="font-medium text-foreground hover:underline">Admin portal</Link>
            </p>
          </div>
        </section>
      </div>
    </main>
  )
}
