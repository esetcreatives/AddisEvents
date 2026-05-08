'use client'

import { useEffect, useMemo, useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Download, Edit3, Plus, Search, Shield, Users, Loader2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'

type AdminUser = {
  id: string
  full_name: string | null
  email: string
  phone: string | null
  role: string
  status: string | null
  organization_id: string | null
  organizations?: { name: string | null } | { name: string | null }[] | null
}

const roleLabels: Record<string, string> = {
  super_admin: 'Super Admin',
  manager: 'Manager',
  organizer: 'Organizer',
  client: 'Client',
  staff: 'Staff',
}

function UsersList() {
  const searchParams = useSearchParams()
  const initialRole = searchParams.get('role') || 'all'
  
  const [users, setUsers] = useState<AdminUser[]>([])
  const [loading, setLoading] = useState(true)
  const [query, setQuery] = useState('')
  const [role, setRole] = useState(initialRole)
  const [status, setStatus] = useState('all')

  useEffect(() => {
    const supabase = createClient()
    const fetchUsers = async () => {
      setLoading(true)
      const response = await fetch('/api/admin/users')
      const result = await response.json()
      setUsers((((result.users || []) as unknown) as AdminUser[]))
      setLoading(false)
    }
    fetchUsers()

    const channel = supabase.channel('admin-users-updates')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'users' }, () => {
        fetchUsers()
      })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [])

  const filtered = useMemo(() => {
    return users.filter((user) => {
      const organization = Array.isArray(user.organizations) ? user.organizations[0] : user.organizations
      const text = `${user.full_name || ''} ${user.email} ${organization?.name || ''}`.toLowerCase()
      return (
        text.includes(query.toLowerCase()) &&
        (role === 'all' || user.role === role) &&
        (status === 'all' || (user.status || 'active') === status)
      )
    })
  }, [query, role, status, users])

  const handleExportCSV = () => {
    const headers = ['Full Name', 'Email', 'Phone', 'Role', 'Organization', 'Status', 'Joined Date']
    const rows = filtered.map(u => {
      const org = Array.isArray(u.organizations) ? u.organizations[0] : u.organizations
      return [
        u.full_name || 'Pending',
        u.email,
        u.phone || 'N/A',
        roleLabels[u.role] || u.role,
        org?.name || 'N/A',
        u.status || 'active',
        u.id 
      ].join(',')
    })

    const csvContent = [headers.join(','), ...rows].join('\n')
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', `addis_events_users_${new Date().toISOString().split('T')[0]}.csv`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="mb-3 inline-flex items-center gap-2 rounded-full border bg-white px-3 py-1 text-xs text-muted-foreground">
            <Shield className="h-3.5 w-3.5 text-primary" />
            RBAC Control Center
          </div>
          <h1 className="text-3xl font-semibold">User Directory</h1>
          <p className="mt-1 text-sm text-muted-foreground">Manage platform accounts for Organizers, Clients, and Event Staff.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleExportCSV} disabled={filtered.length === 0} className="rounded-xl">
            <Download className="mr-2 h-4 w-4" />
            Export CSV
          </Button>
          <Button asChild className="rounded-xl shadow-lg shadow-primary/10">
            <Link href="/admin/users/new">
              <Plus className="mr-2 h-4 w-4" />
              Create User
            </Link>
          </Button>
        </div>
      </div>

      <Card className="rounded-2xl border-border/70 shadow-sm">
        <CardContent className="p-4">
          <div className="grid gap-3 md:grid-cols-[1fr_180px_180px]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search name, email, organization..." className="pl-9 rounded-xl" />
            </div>
            <Select value={role} onValueChange={(value) => setRole(value || 'all')}>
              <SelectTrigger className="rounded-xl"><SelectValue placeholder="All Roles" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Roles</SelectItem>
                <SelectItem value="organizer">Organizer</SelectItem>
                <SelectItem value="client">Client</SelectItem>
                <SelectItem value="staff">Staff</SelectItem>
              </SelectContent>
            </Select>
            <Select value={status} onValueChange={(value) => setStatus(value || 'all')}>
              <SelectTrigger className="rounded-xl"><SelectValue placeholder="All Statuses" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="suspended">Suspended</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card className="rounded-2xl border-border/70 shadow-sm overflow-hidden">
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-muted/30">
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Organization</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-20">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={6} className="py-12 text-center text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin mx-auto mb-2" />Loading users...</TableCell></TableRow>
              ) : filtered.length === 0 ? (
                <TableRow><TableCell colSpan={6} className="py-12 text-center text-sm text-muted-foreground">No users found.</TableCell></TableRow>
              ) : (
                filtered.map((user) => (
                  <TableRow key={user.id} className="hover:bg-primary/[0.02]">
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                          <Users className="h-4 w-4" />
                        </div>
                        <span className="font-medium">{user.full_name || 'Pending profile'}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{user.email}</TableCell>
                    <TableCell><Badge variant="outline" className="rounded-lg">{roleLabels[user.role] || user.role}</Badge></TableCell>
                    <TableCell className="text-muted-foreground">{(Array.isArray(user.organizations) ? user.organizations[0] : user.organizations)?.name || '-'}</TableCell>
                    <TableCell>
                      <Badge className={`rounded-lg ${(user.status || 'active') === 'active' ? 'bg-green-50 text-green-700 border-green-100' : 'bg-amber-50 text-amber-700 border-amber-100'}`}>
                        {user.status || 'active'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Button asChild variant="ghost" size="icon" className="rounded-lg">
                        <Link href={`/admin/users/${user.id}`} aria-label={`Edit ${user.email}`}>
                          <Edit3 className="h-4 w-4" />
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
    </div>
  )
}

export default function AdminUsersPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>}>
      <UsersList />
    </Suspense>
  )
}
