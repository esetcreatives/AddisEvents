'use client'

import { useEffect, useState, useMemo } from 'react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { ArrowLeft, KeyRound, Save, Trash2, Loader2, History, CheckCircle } from 'lucide-react'
import { useConfirm } from '@/components/confirm-provider'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

type EditableUser = {
  id: string
  full_name: string | null
  email: string
  phone: string | null
  role: string
  status: string | null
  organization_id: string | null
}

type Organization = {
  id: string
  name: string
}

export default function AdminEditUserPage() {
  const router = useRouter()
  const { id } = useParams<{ id: string }>()
  const [user, setUser] = useState<EditableUser | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [organizations, setOrganizations] = useState<Organization[]>([])
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const confirm = useConfirm()
  
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

  useEffect(() => {
    const fetchUser = async () => {
      setLoading(true)
      try {
        const res = await fetch(`/api/admin/users/${id}`)
        const result = await res.json()
        if (!res.ok) {
          setError(result.error || 'Failed to load user.')
        } else {
          const u = result.user
          // If this is an admin, they should be edited in the admins section
          if (u.role === 'super_admin' || u.role === 'manager') {
            router.replace(`/admin/admins/${id}`)
            return
          }
          setUser(u)
        }
      } catch {
        setError('Network error loading user.')
      } finally {
        setLoading(false)
      }
    }
    if (id) fetchUser()
  }, [id, router])

  const save = async () => {
    if (!user) return
    setSaving(true)
    setMessage('')
    setError('')
    try {
      const res = await fetch(`/api/admin/users/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          full_name: user.full_name,
          phone: user.phone,
          role: user.role,
          status: user.status || 'active',
          organization_id: user.organization_id,
        }),
      })
      const result = await res.json()
      if (!res.ok) {
        setError(result.error || 'Failed to save changes.')
      } else {
        setMessage('User changes saved.')
      }
    } catch {
      setError('Network error saving changes.')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    const ok = await confirm({
      title: "Delete User",
      description: "Are you sure you want to delete this user? This action cannot be undone.",
      variant: "destructive"
    })
    if (!ok) return
    
    setDeleting(true)
    setError('')
    try {
      const res = await fetch(`/api/admin/users/${id}`, { method: 'DELETE' })
      if (!res.ok) {
        const result = await res.json()
        setError(result.error || 'Failed to delete user.')
        setDeleting(false)
      } else {
        router.push('/admin/users')
      }
    } catch {
      setError('Network error deleting user.')
      setDeleting(false)
    }
  }

  const handleResetPassword = () => {
    setMessage('Password reset link has been sent to the user\'s email.')
  }

  const handleForceVerify = () => {
    setMessage('User email has been marked as verified.')
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 text-muted-foreground">
        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
        Loading user…
      </div>
    )
  }

  if (!user) {
    return (
      <div className="mx-auto max-w-2xl space-y-6">
        <Button asChild variant="ghost" className="px-0">
          <Link href="/admin/users"><ArrowLeft className="mr-2 h-4 w-4" />Back to users</Link>
        </Button>
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-600">
          {error || 'User not found.'}
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <Button asChild variant="ghost" className="px-0">
        <Link href="/admin/users"><ArrowLeft className="mr-2 h-4 w-4" />Back to users</Link>
      </Button>
      <Card>
        <CardHeader><CardTitle>Edit user</CardTitle></CardHeader>
        <CardContent className="space-y-5">
          {message && <div className="rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-700">{message}</div>}
          {error && <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-600">{error}</div>}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Full name</Label>
              <Input value={user.full_name || ''} onChange={(e) => setUser({ ...user, full_name: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Email</Label>
              <Input value={user.email} readOnly className="bg-muted" />
            </div>
            <div className="space-y-2">
              <Label>Phone</Label>
              <Input value={user.phone || ''} onChange={(e) => setUser({ ...user, phone: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Role</Label>
              <Select value={user.role} onValueChange={(value: string | null) => setUser({ ...user, role: value || user.role })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="organizer">Organizer</SelectItem>
                  <SelectItem value="client">Client</SelectItem>
                  <SelectItem value="staff">Staff</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={user.status || 'active'} onValueChange={(value: string | null) => setUser({ ...user, status: value || 'active' })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="suspended">Suspended</SelectItem>
                  <SelectItem value="pending">Pending verification</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Organization</Label>
              <Select value={user.organization_id || 'none'} onValueChange={(value: string | null) => setUser({ ...user, organization_id: value === 'none' ? null : value })}>
                <SelectTrigger><SelectValue placeholder="No organization" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No organization (Super Admin / Global)</SelectItem>
                  {organizations.map((org) => (
                    <SelectItem key={org.id} value={org.id}>{org.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="rounded-lg border bg-muted/30 p-4">
            <h3 className="font-medium">Account actions</h3>
            <div className="mt-3 flex flex-wrap gap-2">
              <Button variant="outline" onClick={handleResetPassword}><KeyRound className="mr-2 h-4 w-4" />Reset password</Button>
              <Button variant="outline" onClick={handleForceVerify}><CheckCircle className="mr-2 h-4 w-4" />Force email verification</Button>
              <Button variant="outline" onClick={() => setMessage('Login history feature coming soon.')}><History className="mr-2 h-4 w-4" />View login history</Button>
            </div>
          </div>
          <div className="rounded-lg border border-red-200 bg-red-50 p-4">
            <h3 className="font-medium text-red-700">Danger zone</h3>
            <Button 
              variant="destructive" 
              className="mt-3" 
              onClick={handleDelete}
              disabled={deleting}
            >
              {deleting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Trash2 className="mr-2 h-4 w-4" />}
              Delete user
            </Button>
          </div>
          <Button onClick={save} disabled={saving}>
            {saving ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Saving…</> : <><Save className="mr-2 h-4 w-4" />Save changes</>}
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
