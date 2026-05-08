'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, Send, ShieldAlert, Clipboard, Check, Loader2, ShieldCheck } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

export default function AdminNewAdminPage() {
  const [form, setForm] = useState<{
    email: string
    fullName: string
    phone: string
    role: string
    password: string
  }>({ 
    email: '', 
    fullName: '', 
    phone: '',
    role: 'manager',
    password: ''
  })
  
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [tempPassword, setTempPassword] = useState('')
  const [copied, setCopied] = useState(false)
  const [error, setError] = useState('')

  const submit = async (event: React.FormEvent) => {
    event.preventDefault()
    setLoading(true)
    setMessage('')
    setTempPassword('')
    setError('')
    
    // We can reuse the same /api/admin/users endpoint for creation, 
    // it already handles the role validation (manager/super_admin).
    const res = await fetch('/api/admin/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form, organizationId: null }), // Admins don't have orgs
    })
    
    const result = await res.json()

    if (!res.ok) {
      setError(result.error || 'Unable to create admin.')
    } else {
      if (result.warning) {
        setMessage(result.warning)
      } else {
        setMessage(`HQ Admin account created successfully for ${form.email}.`)
      }
      
      if (result.tempPassword) {
        setTempPassword(result.tempPassword)
      }
      
      // Reset form on success but keep message
      setForm({ email: '', fullName: '', phone: '', role: 'manager', password: '' })
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
        <Link href="/admin/admins">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Admin Management
        </Link>
      </Button>
      
      <Card className="rounded-2xl border-border/70 shadow-xl shadow-black/[0.02] overflow-hidden">
        <CardHeader className="bg-muted/30 border-b border-border/70 pb-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <CardTitle className="text-2xl">Add HQ Administrator</CardTitle>
              <CardDescription>
                Create a new internal administrator with access to the Management HQ.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-6">
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
            
            {error && (
              <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-700 flex items-center gap-2">
                <ShieldAlert className="h-4 w-4" />
                {error}
              </div>
            )}
            
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
                  placeholder="admin@addisevents.com"
                  value={form.email} 
                  onChange={(e) => setForm({ ...form, email: e.target.value })} 
                  className="rounded-xl h-11"
                  required 
                />
              </div>
            </div>

            <div className="grid gap-5 sm:grid-cols-2">
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
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="role">Admin Level</Label>
                <Select value={form.role} onValueChange={(value: string | null) => setForm({ ...form, role: value || 'manager' })}>
                  <SelectTrigger id="role" className="rounded-xl h-11"><SelectValue /></SelectTrigger>
                  <SelectContent className="rounded-xl">
                    <SelectItem value="manager">Manager (HQ Access)</SelectItem>
                    <SelectItem value="super_admin">Super Admin (System Root)</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-[10px] text-muted-foreground mt-1.5 italic px-1">
                  Managers cannot manage other admins. Super Admins have full access.
                </p>
              </div>
            </div>

            <div className="pt-4 border-t border-border/50">
              <Button type="submit" disabled={loading} className="w-full h-12 bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl shadow-lg shadow-primary/20 transition-all active:scale-[0.98]">
                {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
                {loading ? 'Creating Admin...' : 'Provision Admin & Send Credentials'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
