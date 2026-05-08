'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { KeyRound, MailCheck } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export default function AdminVerify2FAPage() {
  const router = useRouter()
  const [code, setCode] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [resent, setResent] = useState(false)
  const [devCode, setDevCode] = useState(() =>
    typeof window === 'undefined' ? '' : sessionStorage.getItem('ae_admin_dev_2fa') || ''
  )

  const submit = async (event: React.FormEvent) => {
    event.preventDefault()
    setLoading(true)
    setError('')
    const res = await fetch('/api/admin/2fa/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code }),
    })
    const result = await res.json()
    setLoading(false)
    if (!res.ok) {
      setError(result.error || 'Invalid code.')
      return
    }
    sessionStorage.removeItem('ae_admin_dev_2fa')
    router.push('/admin')
  }

  const resend = async () => {
    setResent(false)
    const res = await fetch('/api/admin/2fa/send', { method: 'POST' })
    const result = await res.json()
    if (result.devCode) {
      sessionStorage.setItem('ae_admin_dev_2fa', result.devCode)
      setDevCode(result.devCode)
    }
    setResent(true)
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-background px-4 py-10">
      <div className="pointer-events-none absolute inset-0 dot-pattern opacity-35" />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-80 bg-[linear-gradient(180deg,rgba(145,9,30,0.1),rgba(90,122,107,0.045)_48%,transparent)]" />
      <section className="relative mx-auto mt-16 max-w-sm rounded-2xl border border-border/70 bg-white/90 p-6 shadow-xl shadow-black/[0.06] backdrop-blur-sm">
        <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary ring-1 ring-primary/10">
          <MailCheck className="h-6 w-6" />
        </div>
        <h1 className="text-2xl font-semibold">Verify it is you</h1>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">Enter the 6-digit code sent to your email. You have 3 attempts before requesting a new code.</p>
        <form onSubmit={submit} className="mt-6 space-y-4">
          {error && <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-600">{error}</div>}
          {resent && <div className="rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-700">A new code was sent.</div>}
          {devCode && (
            <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
              Email is not configured locally. Use dev code <span className="font-mono font-semibold tracking-widest">{devCode}</span>.
            </div>
          )}
          <div className="space-y-2">
            <Label htmlFor="admin-code">6-digit code</Label>
            <Input id="admin-code" inputMode="numeric" maxLength={6} value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))} className="h-12 text-center font-mono text-xl tracking-[0.45em]" required />
          </div>
          <Button type="submit" disabled={loading || code.length !== 6} className="w-full">
            <KeyRound className="mr-2 h-4 w-4" />
            {loading ? 'Verifying...' : 'Verify and enter'}
          </Button>
          <Button type="button" variant="ghost" onClick={resend} className="w-full">
            Resend code
          </Button>
        </form>
      </section>
    </main>
  )
}
