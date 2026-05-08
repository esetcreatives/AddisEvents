'use client'

import { useState } from 'react'
import { Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { CheckCircle2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

function AcceptInviteForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const token = searchParams.get('token') || ''
  const [form, setForm] = useState({ fullName: '', password: '', confirmPassword: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const submit = async (event: React.FormEvent) => {
    event.preventDefault()
    if (form.password !== form.confirmPassword) {
      setError('Passwords do not match.')
      return
    }
    setLoading(true)
    setError('')
    const res = await fetch('/api/portal/accept-invite', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token, fullName: form.fullName, password: form.password }),
    })
    const result = await res.json()
    setLoading(false)
    if (!res.ok) {
      setError(result.error || 'Invite could not be accepted.')
      return
    }
    router.push('/portal/login')
  }

  return (
    <main className="min-h-screen bg-background px-4 py-10">
      <section className="mx-auto mt-16 max-w-md rounded-lg border bg-white p-6 shadow-sm">
        <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <CheckCircle2 className="h-6 w-6" />
        </div>
        <h1 className="text-2xl font-semibold">Accept client invite</h1>
        <p className="mt-2 text-sm text-muted-foreground">Set your name and password to activate event access.</p>
        <form onSubmit={submit} className="mt-6 space-y-4">
          {error && <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-600">{error}</div>}
          <div className="space-y-2">
            <Label>Full name</Label>
            <Input value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} required />
          </div>
          <div className="space-y-2">
            <Label>Password</Label>
            <Input type="password" minLength={8} value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required />
          </div>
          <div className="space-y-2">
            <Label>Confirm password</Label>
            <Input type="password" minLength={8} value={form.confirmPassword} onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })} required />
          </div>
          <Button type="submit" disabled={loading || !token} className="w-full">
            {loading ? 'Activating...' : 'Activate access'}
          </Button>
          {!token && <p className="text-center text-xs text-red-600">Missing invite token.</p>}
        </form>
      </section>
    </main>
  )
}

export default function AcceptInvitePage() {
  return (
    <Suspense fallback={<div className="min-h-screen grid place-items-center bg-background text-sm text-muted-foreground">Loading invite...</div>}>
      <AcceptInviteForm />
    </Suspense>
  )
}
