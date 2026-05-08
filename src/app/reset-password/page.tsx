'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { createClient } from '@/lib/supabase/client'

export default function ResetPasswordPage() {
  const supabase = createClient()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const sendReset = async (event: React.FormEvent) => {
    event.preventDefault()
    setLoading(true)
    setError('')
    setMessage('')
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    })
    setLoading(false)
    if (resetError) setError(resetError.message)
    else setMessage('Reset link sent. Check your email.')
  }

  const updatePassword = async (event: React.FormEvent) => {
    event.preventDefault()
    setLoading(true)
    setError('')
    setMessage('')
    const { error: updateError } = await supabase.auth.updateUser({ password })
    setLoading(false)
    if (updateError) setError(updateError.message)
    else setMessage('Password updated. You can sign in now.')
  }

  return (
    <main className="min-h-screen bg-background px-4 py-10">
      <section className="mx-auto mt-16 max-w-md rounded-lg border bg-white p-6 shadow-sm">
        <h1 className="text-2xl font-semibold">Reset password</h1>
        <p className="mt-2 text-sm text-muted-foreground">Request a reset link, or set a new password after opening the emailed link.</p>
        {(message || error) && (
          <div className={`mt-5 rounded-lg border p-3 text-sm ${error ? 'border-red-200 bg-red-50 text-red-600' : 'border-green-200 bg-green-50 text-green-700'}`}>
            {error || message}
          </div>
        )}
        <form onSubmit={sendReset} className="mt-6 space-y-4">
          <div className="space-y-2">
            <Label>Email</Label>
            <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>
          <Button type="submit" variant="outline" disabled={loading} className="w-full">Send reset link</Button>
        </form>
        <form onSubmit={updatePassword} className="mt-6 space-y-4 border-t pt-6">
          <div className="space-y-2">
            <Label>New password</Label>
            <Input type="password" minLength={8} value={password} onChange={(e) => setPassword(e.target.value)} required />
          </div>
          <Button type="submit" disabled={loading} className="w-full">Update password</Button>
        </form>
        <p className="mt-6 text-center text-sm text-muted-foreground"><Link href="/login" className="font-medium text-foreground hover:underline">Back to login</Link></p>
      </section>
    </main>
  )
}
