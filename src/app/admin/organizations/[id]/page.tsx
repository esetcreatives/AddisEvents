'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import {
  ArrowLeft,
  Building2,
  CalendarDays,
  Loader2,
  Mail,
  MapPin,
  Pencil,
  Phone,
  Save,
  Trash2,
  Users,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

type OrgDetail = {
  id: string
  name: string
  contact_email: string | null
  contact_phone: string | null
  address: string | null
  plan: string | null
  onboarding_completed: boolean
  logo_url: string | null
  created_at: string
}

type OrgMember = {
  id: string
  full_name: string | null
  email: string
  role: string
  created_at: string
}

export default function AdminOrganizationDetailPage() {
  const { id } = useParams<{ id: string }>()
  const [org, setOrg] = useState<OrgDetail | null>(null)
  const [members, setMembers] = useState<OrgMember[]>([])
  const [eventCount, setEventCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [deleting, setDeleting] = useState(false)

  // Edit form state
  const [form, setForm] = useState({
    name: '',
    contact_email: '',
    contact_phone: '',
    address: '',
    plan: 'professional',
    onboarding_completed: false,
  })

  const fetchOrg = async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/admin/organizations/${id}`)
      const result = await res.json()
      if (!res.ok) {
        setError(result.error || 'Failed to load organization.')
      } else {
        setOrg(result.organization)
        setMembers(result.members || [])
        setEventCount(result.event_count || 0)
        setForm({
          name: result.organization.name || '',
          contact_email: result.organization.contact_email || '',
          contact_phone: result.organization.contact_phone || '',
          address: result.organization.address || '',
          plan: result.organization.plan || 'professional',
          onboarding_completed: result.organization.onboarding_completed || false,
        })
      }
    } catch {
      setError('Network error loading organization.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (id) fetchOrg()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])

  const handleSave = async () => {
    if (!form.name.trim()) {
      setError('Organization name cannot be empty.')
      return
    }
    setSaving(true)
    setError('')
    setMessage('')
    try {
      const res = await fetch(`/api/admin/organizations/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const result = await res.json()
      if (!res.ok) {
        setError(result.error || 'Failed to save changes.')
      } else {
        setMessage('Organization updated successfully.')
        setEditing(false)
        fetchOrg()
      }
    } catch {
      setError('Network error saving changes.')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    setDeleting(true)
    setError('')
    try {
      const res = await fetch(`/api/admin/organizations/${id}`, { method: 'DELETE' })
      const result = await res.json()
      if (!res.ok) {
        setError(result.error || 'Failed to delete organization.')
        setDeleting(false)
      } else {
        window.location.href = '/admin/organizations'
      }
    } catch {
      setError('Network error deleting organization.')
      setDeleting(false)
    }
  }

  const planLabel = (plan: string | null) => {
    switch (plan) {
      case 'starter': return 'Starter'
      case 'enterprise': return 'Enterprise'
      default: return 'Professional'
    }
  }

  const planVariant = (plan: string | null): 'default' | 'secondary' | 'outline' => {
    switch (plan) {
      case 'enterprise': return 'default'
      case 'starter': return 'outline'
      default: return 'secondary'
    }
  }

  const roleLabel = (role: string) => {
    switch (role) {
      case 'super_admin': return 'Super Admin'
      case 'organizer': return 'Organizer'
      case 'client': return 'Client'
      case 'staff': return 'Staff'
      default: return role
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 text-muted-foreground">
        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
        Loading organization…
      </div>
    )
  }

  if (!org) {
    return (
      <div className="mx-auto max-w-3xl space-y-6">
        <Button asChild variant="ghost" className="px-0">
          <Link href="/admin/organizations"><ArrowLeft className="mr-2 h-4 w-4" />Back to organizations</Link>
        </Button>
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-600">
          {error || 'Organization not found.'}
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <Button asChild variant="ghost" className="px-0">
        <Link href="/admin/organizations"><ArrowLeft className="mr-2 h-4 w-4" />Back to organizations</Link>
      </Button>

      {message && (
        <div className="rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-700">{message}</div>
      )}
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-600">{error}</div>
      )}

      {/* Header with stats */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold">{org.name}</h1>
          <div className="mt-1 flex items-center gap-3 text-sm text-muted-foreground">
            <Badge variant={planVariant(org.plan)}>{planLabel(org.plan)}</Badge>
            <span className="inline-flex items-center gap-1"><Users className="h-3.5 w-3.5" />{members.length} members</span>
            <span className="inline-flex items-center gap-1"><CalendarDays className="h-3.5 w-3.5" />{eventCount} events</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => setEditing(!editing)}>
            <Pencil className="mr-2 h-4 w-4" />{editing ? 'Cancel' : 'Edit'}
          </Button>
          <Button variant="destructive" onClick={() => setDeleteOpen(true)}>
            <Trash2 className="mr-2 h-4 w-4" />Delete
          </Button>
        </div>
      </div>

      {/* Organization Details Card */}
      <Card>
        <CardHeader><CardTitle>Organization Details</CardTitle></CardHeader>
        <CardContent>
          {editing ? (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Organization name *</Label>
                <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Contact email</Label>
                  <Input type="email" value={form.contact_email} onChange={(e) => setForm({ ...form, contact_email: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>Phone</Label>
                  <Input value={form.contact_phone} onChange={(e) => setForm({ ...form, contact_phone: e.target.value })} />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Address</Label>
                <Input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Plan</Label>
                <Select value={form.plan} onValueChange={(value) => setForm({ ...form, plan: value || form.plan })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="starter">Starter</SelectItem>
                    <SelectItem value="professional">Professional</SelectItem>
                    <SelectItem value="enterprise">Enterprise</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center gap-3">
                <Switch checked={form.onboarding_completed} onCheckedChange={(checked) => setForm({ ...form, onboarding_completed: checked })} />
                <Label>Onboarding completed</Label>
              </div>
              <Button onClick={handleSave} disabled={saving}>
                {saving ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Saving…</> : <><Save className="mr-2 h-4 w-4" />Save Changes</>}
              </Button>
            </div>
          ) : (
            <div className="space-y-3 text-sm">
              <div className="flex items-start gap-3">
                <Building2 className="mt-0.5 h-4 w-4 text-muted-foreground" />
                <div>
                  <div className="font-medium">{org.name}</div>
                  <div className="text-muted-foreground">Organization name</div>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Mail className="mt-0.5 h-4 w-4 text-muted-foreground" />
                <div>
                  <div className="font-medium">{org.contact_email || '—'}</div>
                  <div className="text-muted-foreground">Contact email</div>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Phone className="mt-0.5 h-4 w-4 text-muted-foreground" />
                <div>
                  <div className="font-medium">{org.contact_phone || '—'}</div>
                  <div className="text-muted-foreground">Phone</div>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <MapPin className="mt-0.5 h-4 w-4 text-muted-foreground" />
                <div>
                  <div className="font-medium">{org.address || '—'}</div>
                  <div className="text-muted-foreground">Address</div>
                </div>
              </div>
              <div className="pt-2 text-xs text-muted-foreground">
                Created {new Date(org.created_at).toLocaleDateString()} · Onboarding {org.onboarding_completed ? 'completed' : 'pending'}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Members Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Members ({members.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Joined</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {members.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="py-8 text-center text-sm text-muted-foreground">
                    No members in this organization.
                  </TableCell>
                </TableRow>
              ) : (
                members.map((member) => (
                  <TableRow key={member.id}>
                    <TableCell className="font-medium">{member.full_name || '—'}</TableCell>
                    <TableCell className="text-muted-foreground">{member.email}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{roleLabel(member.role)}</Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {new Date(member.created_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm" asChild>
                        <Link href={`/admin/users/${member.id}`}>
                          <Pencil className="mr-1 h-3.5 w-3.5" />Edit
                        </Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Delete Organization</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete <strong>{org.name}</strong>?
              {members.length > 0 && (
                <span className="mt-1 block text-red-600">
                  {members.length} member(s) will be unlinked from this organization.
                </span>
              )}
              This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteOpen(false)}>Cancel</Button>
            <Button variant="destructive" onClick={handleDelete} disabled={deleting}>
              {deleting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Deleting…</> : 'Delete Organization'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
