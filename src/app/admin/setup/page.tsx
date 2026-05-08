'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowLeft, CheckCircle2, ShieldCheck } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export default function AdminSetupPage() {
  const router = useRouter()
  const [checking, setChecking] = useState(true)
  const [submitted, setSubmitted] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState({ fullName: '', email: '', password: '', setupToken: '' })

  useEffect(() => {
    const checkSetup = async () => {
      const res = await fetch('/api/admin/setup')
      const result = await res.json()
      if (result.exists) router.replace('/admin/login')
      setChecking(false)
    }
    checkSetup()
  }, [router])

  const submit = async (event: React.FormEvent) => {
    event.preventDefault()
    setLoading(true)
    setError('')

    const res = await fetch('/api/admin/setup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })
    const result = await res.json()
    setLoading(false)

    if (!res.ok) {
      setError(result.error || 'Setup failed.')
      return
    }

    setSubmitted(true)
  }

  if (checking) {
    return <div className="min-h-screen grid place-items-center bg-background text-sm text-muted-foreground dot-pattern">Checking setup status...</div>
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-background px-4 py-10">
      <div className="pointer-events-none absolute inset-0 dot-pattern opacity-35" />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-80 bg-[linear-gradient(180deg,rgba(145,9,30,0.1),rgba(166,123,91,0.05)_48%,transparent)]" />
      <div className="relative mx-auto max-w-md">
        <Link href="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" />
          Back to site
        </Link>

        <section className="mt-10 rounded-2xl border border-border/70 bg-white/90 p-6 shadow-xl shadow-black/[0.06] backdrop-blur-sm">
          <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary ring-1 ring-primary/10">
            {submitted ? <CheckCircle2 className="h-6 w-6" /> : <ShieldCheck className="h-6 w-6" />}
          </div>
          <h1 className="text-2xl font-semibold">Super admin setup</h1>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            Create the first platform owner. Once this account exists, this setup URL is disabled.
          </p>

          {submitted ? (
            <div className="mt-6 space-y-4">
              <div className="rounded-lg border border-green-200 bg-green-50 p-4 text-sm text-green-700">
                Account created. Check the inbox for the verification email, then sign in through the admin portal.
              </div>
              <Button asChild className="w-full">
                <Link href="/admin/login">Go to admin login</Link>
              </Button>
            </div>
          ) : (
            <form onSubmit={submit} className="mt-6 space-y-4">
              {error && <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-600">{error}</div>}
              <div className="space-y-2">
                <Label htmlFor="fullName">Full name</Label>
                <Input id="fullName" value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input id="password" type="password" minLength={8} value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="setupToken">Setup token</Label>
                <Input id="setupToken" type="password" value={form.setupToken} onChange={(e) => setForm({ ...form, setupToken: e.target.value })} placeholder="Required when ADMIN_SETUP_TOKEN is set" />
              </div>
              <Button type="submit" disabled={loading} className="w-full">
                {loading ? 'Creating...' : 'Create super admin'}
              </Button>
            </form>
          )}
        </section>
      </div>
    </main>
  )
}
