'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import {
  Building2,
  Search,
  Plus,
  Pencil,
  Trash2,
  Users,
  CalendarDays,
  Loader2,
  ExternalLink,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
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
  DialogTrigger,
} from '@/components/ui/dialog'

type Organization = {
  id: string
  name: string
  contact_email: string | null
  contact_phone: string | null
  address: string | null
  plan: string | null
  onboarding_completed: boolean
  created_at: string
  member_count: number
}

const emptyForm = {
  name: '',
  contact_email: '',
  contact_phone: '',
  address: '',
  plan: 'professional',
}

export default function AdminOrganizationsPage() {
  const [organizations, setOrganizations] = useState<Organization[]>([])
  const [query, setQuery] = useState('')
  const [loading, setLoading] = useState(true)
  const [createOpen, setCreateOpen] = useState(false)
  const [editOpen, setEditOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [form, setForm] = useState(emptyForm)
  const [editingOrg, setEditingOrg] = useState<Organization | null>(null)
  const [deletingOrg, setDeletingOrg] = useState<Organization | null>(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')

  const fetchOrganizations = async () => {
    setLoading(true)
    setError('')
    try {
      const response = await fetch('/api/admin/organizations')
      const result = await response.json()
      if (!response.ok) {
        setError(result.error || 'Failed to load organizations.')
      } else {
        setOrganizations(result.organizations || [])
      }
    } catch {
      setError('Network error: Could not reach the server.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchOrganizations()
  }, [])

  const filtered = useMemo(() => {
    const needle = query.toLowerCase()
    return organizations.filter((org) =>
      `${org.name} ${org.contact_email || ''} ${org.contact_phone || ''} ${org.plan || ''}`
        .toLowerCase()
        .includes(needle)
    )
  }, [organizations, query])

  const handleCreate = async () => {
    if (!form.name.trim()) {
      setError('Organization name is required.')
      return
    }
    setSaving(true)
    setError('')
    try {
      const res = await fetch('/api/admin/organizations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const result = await res.json()
      if (!res.ok) {
        setError(result.error || 'Failed to create organization.')
      } else {
        setMessage('Organization created successfully.')
        setCreateOpen(false)
        setForm(emptyForm)
        fetchOrganizations()
      }
    } catch {
      setError('Network error creating organization.')
    } finally {
      setSaving(false)
    }
  }

  const handleEdit = async () => {
    if (!editingOrg) return
    setSaving(true)
    setError('')
    try {
      const res = await fetch(`/api/admin/organizations/${editingOrg.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const result = await res.json()
      if (!res.ok) {
        setError(result.error || 'Failed to update organization.')
      } else {
        setMessage('Organization updated successfully.')
        setEditOpen(false)
        setEditingOrg(null)
        setForm(emptyForm)
        fetchOrganizations()
      }
    } catch {
      setError('Network error updating organization.')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!deletingOrg) return
    setSaving(true)
    setError('')
    try {
      const res = await fetch(`/api/admin/organizations/${deletingOrg.id}`, {
        method: 'DELETE',
      })
      const result = await res.json()
      if (!res.ok) {
        setError(result.error || 'Failed to delete organization.')
      } else {
        setMessage('Organization deleted.')
        setDeleteOpen(false)
        setDeletingOrg(null)
        fetchOrganizations()
      }
    } catch {
      setError('Network error deleting organization.')
    } finally {
      setSaving(false)
    }
  }

  const openEdit = (org: Organization) => {
    setEditingOrg(org)
    setForm({
      name: org.name,
      contact_email: org.contact_email || '',
      contact_phone: org.contact_phone || '',
      address: org.address || '',
      plan: org.plan || 'professional',
    })
    setError('')
    setEditOpen(true)
  }

  const openDelete = (org: Organization) => {
    setDeletingOrg(org)
    setError('')
    setDeleteOpen(true)
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

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="mb-3 inline-flex items-center gap-2 rounded-full border bg-white px-3 py-1 text-xs text-muted-foreground">
            <Building2 className="h-3.5 w-3.5 text-primary" />
            Platform Workspaces
          </div>
          <h1 className="text-3xl font-semibold">Organizations</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage all organizer workspaces, plans, and member access.
          </p>
        </div>
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => { setForm(emptyForm); setError('') }}>
              <Plus className="mr-2 h-4 w-4" />
              New Organization
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>Create Organization</DialogTitle>
              <DialogDescription>Add a new organizer workspace to the platform.</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-2">
              {error && <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-600">{error}</div>}
              <div className="space-y-2">
                <Label>Organization name *</Label>
                <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Acme Events" />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Contact email</Label>
                  <Input type="email" value={form.contact_email} onChange={(e) => setForm({ ...form, contact_email: e.target.value })} placeholder="admin@example.com" />
                </div>
                <div className="space-y-2">
                  <Label>Phone</Label>
                  <Input value={form.contact_phone} onChange={(e) => setForm({ ...form, contact_phone: e.target.value })} placeholder="+251 9..." />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Address</Label>
                <Input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} placeholder="Bole, Addis Ababa" />
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
            </div>
            <DialogFooter>
              <Button onClick={handleCreate} disabled={saving}>
                {saving ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Creating…</> : 'Create Organization'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {message && (
        <div className="rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-700">
          {message}
        </div>
      )}

      <Card>
        <CardContent className="p-4">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search organizations…" className="pl-9" />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Organization</TableHead>
                <TableHead>Plan</TableHead>
                <TableHead>Members</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Created</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={7} className="py-12 text-center text-sm text-muted-foreground">
                    <Loader2 className="mx-auto mb-2 h-5 w-5 animate-spin" />
                    Loading organizations…
                  </TableCell>
                </TableRow>
              ) : filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="py-12 text-center text-sm text-muted-foreground">
                    No organizations found.
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((org) => (
                  <TableRow key={org.id}>
                    <TableCell>
                      <Link href={`/admin/organizations/${org.id}`} className="font-medium hover:underline">
                        {org.name}
                      </Link>
                    </TableCell>
                    <TableCell>
                      <Badge variant={planVariant(org.plan)}>{planLabel(org.plan)}</Badge>
                    </TableCell>
                    <TableCell>
                      <span className="inline-flex items-center gap-1 text-muted-foreground">
                        <Users className="h-3.5 w-3.5" />
                        {org.member_count}
                      </span>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{org.contact_email || '—'}</TableCell>
                    <TableCell className="text-muted-foreground">{org.contact_phone || '—'}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {new Date(org.created_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button variant="ghost" size="icon-sm" asChild>
                          <Link href={`/admin/organizations/${org.id}`}>
                            <ExternalLink className="h-4 w-4" />
                          </Link>
                        </Button>
                        <Button variant="ghost" size="icon-sm" onClick={() => openEdit(org)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon-sm" onClick={() => openDelete(org)}>
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit Organization</DialogTitle>
            <DialogDescription>Update details for {editingOrg?.name}.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            {error && <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-600">{error}</div>}
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
          </div>
          <DialogFooter>
            <Button onClick={handleEdit} disabled={saving}>
              {saving ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Saving…</> : 'Save Changes'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Delete Organization</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete <strong>{deletingOrg?.name}</strong>?
              {deletingOrg && deletingOrg.member_count > 0 && (
                <span className="mt-1 block text-red-600">
                  This organization has {deletingOrg.member_count} member(s) who will be unlinked.
                </span>
              )}
            </DialogDescription>
          </DialogHeader>
          {error && <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-600">{error}</div>}
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteOpen(false)}>Cancel</Button>
            <Button variant="destructive" onClick={handleDelete} disabled={saving}>
              {saving ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Deleting…</> : 'Delete Organization'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
