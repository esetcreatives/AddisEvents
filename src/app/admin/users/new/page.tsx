'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, Send, ShieldAlert, Key, Clipboard, Check, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { createClient } from '@/lib/supabase/client'

type Organization = {
  id: string
  name: string
}

export default function AdminNewUserPage() {
  const [organizations, setOrganizations] = useState<Organization[]>([])
  const [form, setForm] = useState({ 
    email: '', 
    fullName: '', 
    phone: '',
    role: 'organizer', 
    organizationId: '',
    password: ''
  })
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [tempPassword, setTempPassword] = useState('')
  const [copied, setCopied] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    const fetchOrganizations = async () => {
      try {
        const res = await fetch('/api/admin/organizations')
        const result = await res.json()
        if (res.ok) {
          setOrganizations(result.organizations || [])
        }
      } catch (err) {
        console.error('Failed to fetch organizations:', err)
      }
    }
    fetchOrganizations()
  }, [])

  const submit = async (event: React.FormEvent) => {
    event.preventDefault()
    setLoading(true)
    setMessage('')
    setTempPassword('')
    setError('')
    
    const res = await fetch('/api/admin/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })
    const result = await res.json()

    if (!res.ok) {
      setError(result.error || 'Unable to create user.')
    } else {
      if (result.warning) {
        setMessage(result.warning)
      } else {
        setMessage(`User account created successfully for ${form.email}.`)
      }
      
      if (result.tempPassword) {
        setTempPassword(result.tempPassword)
      }
      
      setForm({ email: '', fullName: '', phone: '', role: 'organizer', organizationId: '', password: '' })
    }
    setLoading(false)
  }

  const copyToClipboard = () => {
    navigator.clipboard.writeText(tempPassword)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <Button asChild variant="ghost" className="px-0 hover:bg-transparent text-muted-foreground hover:text-foreground transition-colors">
        <Link href="/admin/users">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to directory
        </Link>
      </Button>
      <Card className="rounded-2xl border-border/70 shadow-xl shadow-black/[0.02]">
        <CardHeader>
          <CardTitle className="text-2xl">Provision New Account</CardTitle>
          <CardDescription>
            Provision a new platform user account for organizers, clients, or staff.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={submit} className="space-y-5">
            {message && (
              <div className="rounded-xl border border-green-200 bg-green-50 p-4 text-sm text-green-800 flex flex-col gap-3">
                <p className="font-medium">{message}</p>
                {tempPassword && (
                  <div className="bg-white/70 border border-green-200 rounded-lg p-3 flex items-center justify-between shadow-sm">
                    <div>
                      <span className="text-[10px] uppercase font-bold text-green-600 block mb-1 tracking-wider">Temporary Password</span>
                      <code className="text-base font-mono font-bold tracking-tight">{tempPassword}</code>
                    </div>
                    <Button type="button" variant="outline" size="sm" onClick={copyToClipboard} className="rounded-lg h-9 border-green-200 hover:bg-green-100">
                      {copied ? <Check className="h-4 w-4 text-green-600" /> : <Clipboard className="h-4 w-4" />}
                    </Button>
                  </div>
                )}
              </div>
            )}
            {error && <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-700 flex items-center gap-2">
              <ShieldAlert className="h-4 w-4" />
              {error}
            </div>}
            
            <div className="grid gap-5 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="fullName">Full Name</Label>
                <Input 
                  id="fullName"
                  placeholder="e.g. Abebe Kebede"
                  value={form.fullName} 
                  onChange={(e) => setForm({ ...form, fullName: e.target.value })} 
                  className="rounded-xl h-11"
                  required 
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input 
                  id="email"
                  type="email" 
                  placeholder="name@company.com"
                  value={form.email} 
                  onChange={(e) => setForm({ ...form, email: e.target.value })} 
                  className="rounded-xl h-11"
                  required 
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number (Optional)</Label>
              <Input 
                id="phone"
                placeholder="+251 9... / 09..."
                value={form.phone} 
                onChange={(e) => setForm({ ...form, phone: e.target.value })} 
                className="rounded-xl h-11"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Temporary Password (Optional)</Label>
              <Input 
                id="password"
                type="text"
                placeholder="Leave blank to auto-generate"
                value={form.password} 
                onChange={(e) => setForm({ ...form, password: e.target.value })} 
                className="rounded-xl h-11 font-mono"
              />
              <p className="text-[10px] text-muted-foreground px-1">
                If provided, the user will be forced to change this on their first login.
              </p>
            </div>

            <div className="grid gap-5 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="role">Platform Role</Label>
                <Select value={form.role} onValueChange={(value: string | null) => setForm({ ...form, role: value || 'organizer' })}>
                  <SelectTrigger id="role" className="rounded-xl h-11"><SelectValue /></SelectTrigger>
                  <SelectContent className="rounded-xl">
                    <SelectItem value="organizer">Organizer (Workspace Owner)</SelectItem>
                    <SelectItem value="client">Client (Guest/Vendor)</SelectItem>
                    <SelectItem value="staff">Staff (Event Operations)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="org">Organization</Label>
                <Select 
                  value={form.organizationId} 
                  onValueChange={(value: string | null) => setForm({ ...form, organizationId: value || '' })}
                >
                  <SelectTrigger id="org" className="rounded-xl h-11"><SelectValue placeholder="Select organization" /></SelectTrigger>
                  <SelectContent className="rounded-xl">
                    <SelectItem value="none">None (Independent)</SelectItem>
                    {organizations.map((org) => <SelectItem key={org.id} value={org.id}>{org.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="pt-4">
              <Button type="submit" disabled={loading} className="w-full h-12 bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl shadow-lg shadow-primary/20 transition-all active:scale-[0.98]">
                {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
                {loading ? 'Creating Account...' : 'Provision User & Send Credentials'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
