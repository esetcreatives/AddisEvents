'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { ArrowLeft, Save, Trash2, Loader2, ShieldCheck, ShieldAlert, KeyRound } from 'lucide-react'
import { useConfirm } from '@/components/confirm-provider'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'

type EditableAdmin = {
  id: string
  full_name: string | null
  email: string
  phone: string | null
  role: 'super_admin' | 'manager'
  status: string | null
}

export default function EditAdminPage() {
  const router = useRouter()
  const { id } = useParams<{ id: string }>()
  const [admin, setAdmin] = useState<EditableAdmin | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [currentUserRole, setCurrentUserRole] = useState<string | null>(null)
  const confirm = useConfirm()

  useEffect(() => {
    const fetchAdmin = async () => {
      setLoading(true)
      try {
        const res = await fetch(`/api/admin/users/${id}`)
        const result = await res.json()
        if (!res.ok) {
          setError(result.error || 'Failed to load administrator.')
        } else {
          // Verify this is actually an admin
          const user = result.user
          if (user.role !== 'super_admin' && user.role !== 'manager') {
            setError('This user is not an administrator. Please use the User Directory to edit platform users.')
            setAdmin(null)
          } else {
            setAdmin(user)
          }
        }
      } catch {
        setError('Network error loading admin.')
      } finally {
        setLoading(false)
      }
    }

    const fetchContext = async () => {
      try {
        const res = await fetch('/api/admin/overview') // Quick way to get current role
        const result = await res.json()
        // We'll just assume they have access since they are here, 
        // but for role-based UI restrictions we check result
      } catch {}
    }

    if (id) {
      fetchAdmin()
      fetchContext()
    }
  }, [id])

  const save = async () => {
    if (!admin) return
    setSaving(true)
    setMessage('')
    setError('')
    try {
      const res = await fetch(`/api/admin/users/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          full_name: admin.full_name,
          phone: admin.phone,
          role: admin.role,
          status: admin.status || 'active',
          organization_id: null, // Admins never have an org
        }),
      })
      if (!res.ok) {
        const result = await res.json()
        setError(result.error || 'Failed to save changes.')
      } else {
        setMessage('Administrator updated successfully.')
      }
    } catch {
      setError('Network error saving changes.')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    const ok = await confirm({
      title: "Remove Administrator",
      description: "Are you sure you want to remove this administrator? They will lose all HQ access.",
      variant: "destructive"
    })
    if (!ok) return
    
    setDeleting(true)
    setError('')
    try {
      const res = await fetch(`/api/admin/users/${id}`, { method: 'DELETE' })
      if (!res.ok) {
        const result = await res.json()
        setError(result.error || 'Failed to remove admin.')
        setDeleting(false)
      } else {
        router.push('/admin/admins')
      }
    } catch {
      setError('Network error removing admin.')
      setDeleting(false)
    }
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-muted-foreground">
        <Loader2 className="mb-4 h-8 w-8 animate-spin text-primary" />
        <p className="text-sm font-medium">Fetching administrator details...</p>
      </div>
    )
  }

  if (!admin) {
    return (
      <div className="mx-auto max-w-2xl space-y-6">
        <Button asChild variant="ghost" className="px-0 text-muted-foreground hover:text-foreground">
          <Link href="/admin/admins"><ArrowLeft className="mr-2 h-4 w-4" />Back to Admin Management</Link>
        </Button>
        <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-sm text-red-700 flex items-center gap-3 shadow-sm">
          <ShieldAlert className="h-5 w-5 shrink-0" />
          <p className="font-medium">{error || 'Administrator not found.'}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="flex items-center justify-between">
        <Button asChild variant="ghost" className="px-0 text-muted-foreground hover:text-foreground transition-colors">
          <Link href="/admin/admins"><ArrowLeft className="mr-2 h-4 w-4" />Back to Admin Management</Link>
        </Button>
        <Badge variant="outline" className="rounded-full px-3 py-1 bg-white shadow-sm border-primary/20 text-primary">
          HQ Account
        </Badge>
      </div>

      <Card className="rounded-3xl border-border/70 shadow-xl shadow-black/[0.02] overflow-hidden">
        <CardHeader className="bg-muted/30 border-b border-border/70 pb-6">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary shadow-inner">
              <ShieldCheck className="h-6 w-6" />
            </div>
            <div>
              <CardTitle className="text-2xl font-bold tracking-tight">Edit Administrator</CardTitle>
              <CardDescription>Managing permissions and profile for {admin.email}</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-8 space-y-8">
          {message && (
            <div className="rounded-xl border border-green-200 bg-green-50 p-4 text-sm text-green-700 font-medium flex items-center gap-2">
              <ShieldCheck className="h-4 w-4" />
              {message}
            </div>
          )}
          {error && (
            <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 font-medium flex items-center gap-2">
              <ShieldAlert className="h-4 w-4" />
              {error}
            </div>
          )}

          <div className="grid gap-6 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="fullName" className="text-sm font-semibold">Full Name</Label>
              <Input 
                id="fullName"
                value={admin.full_name || ''} 
                onChange={(e) => setAdmin({ ...admin, full_name: e.target.value })} 
                className="rounded-xl h-11 border-border/80 focus:ring-primary/20"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-semibold">Email (Read Only)</Label>
              <Input 
                id="email"
                value={admin.email} 
                readOnly 
                className="rounded-xl h-11 bg-muted/50 border-border/50 text-muted-foreground cursor-not-allowed" 
              />
            </div>
          </div>

          <div className="grid gap-6 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="phone" className="text-sm font-semibold">Phone Number</Label>
              <Input 
                id="phone"
                value={admin.phone || ''} 
                onChange={(e) => setAdmin({ ...admin, phone: e.target.value })} 
                className="rounded-xl h-11 border-border/80 focus:ring-primary/20"
                placeholder="Not provided"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="role" className="text-sm font-semibold">HQ Permission Level</Label>
              <Select value={admin.role} onValueChange={(value: string | null) => setAdmin({ ...admin, role: (value as any) || 'manager' })}>
                <SelectTrigger id="role" className="rounded-xl h-11 border-border/80 focus:ring-primary/20"><SelectValue /></SelectTrigger>
                <SelectContent className="rounded-xl">
                  <SelectItem value="manager">Manager (Operations Only)</SelectItem>
                  <SelectItem value="super_admin">Super Admin (Full Root Access)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="status" className="text-sm font-semibold">Account Status</Label>
            <Select value={admin.status || 'active'} onValueChange={(value: string | null) => setAdmin({ ...admin, status: value || 'active' })}>
              <SelectTrigger id="status" className="rounded-xl h-11 border-border/80 focus:ring-primary/20"><SelectValue /></SelectTrigger>
              <SelectContent className="rounded-xl">
                <SelectItem value="active">Active (Access Granted)</SelectItem>
                <SelectItem value="suspended">Suspended (Access Revoked)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="pt-6 border-t border-border/50 space-y-4">
            <div className="flex flex-col sm:flex-row gap-3">
              <Button onClick={save} disabled={saving} className="flex-1 h-12 bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl shadow-lg shadow-primary/20 transition-all">
                {saving ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Saving Changes...</> : <><Save className="mr-2 h-4 w-4" />Update Admin Profile</>}
              </Button>
              <Button variant="outline" onClick={() => setMessage('Password reset feature available soon.')} className="h-12 rounded-xl border-border/80 text-muted-foreground hover:text-foreground">
                <KeyRound className="mr-2 h-4 w-4" />
                Reset Password
              </Button>
            </div>
            
            <div className="rounded-2xl border border-red-100 bg-red-50/50 p-5 mt-4">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <div>
                  <h4 className="text-sm font-bold text-red-800">Danger Zone</h4>
                  <p className="text-xs text-red-600 mt-1 text-center sm:text-left">Completely remove this administrator from the platform.</p>
                </div>
                <Button 
                  variant="destructive" 
                  size="sm"
                  className="rounded-xl h-10 px-6 font-semibold shadow-md shadow-red-200" 
                  onClick={handleDelete}
                  disabled={deleting}
                >
                  {deleting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Trash2 className="mr-2 h-4 w-4" />}
                  Remove Admin
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
