'use client'

import { useEffect, useMemo, useState, Suspense } from 'react'
import Link from 'next/link'
import { Edit3, Plus, Search, ShieldCheck, Users, Loader2, ShieldAlert } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'

type AdminUser = {
  id: string
  full_name: string | null
  email: string
  phone: string | null
  role: 'super_admin' | 'manager'
  status: string | null
  created_at: string
}

const roleLabels: Record<string, string> = {
  super_admin: 'Super Admin',
  manager: 'Manager',
}

function AdminsList() {
  const [admins, setAdmins] = useState<AdminUser[]>([])
  const [loading, setLoading] = useState(true)
  const [query, setQuery] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    const supabase = createClient()
    const fetchAdmins = async () => {
      setLoading(true)
      try {
        const response = await fetch('/api/admin/admins')
        const result = await response.json()
        if (response.ok) {
          setAdmins(result.admins || [])
        } else {
          setError(result.error || 'Failed to fetch admins')
        }
      } catch (err) {
        setError('An error occurred while fetching admins')
      } finally {
        setLoading(false)
      }
    }
    fetchAdmins()

    const channel = supabase.channel('admin-admins-updates')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'users' }, () => {
        fetchAdmins()
      })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [])

  const filtered = useMemo(() => {
    return admins.filter((admin) => {
      const text = `${admin.full_name || ''} ${admin.email}`.toLowerCase()
      return text.includes(query.toLowerCase())
    })
  }, [query, admins])

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="mb-3 inline-flex items-center gap-2 rounded-full border bg-white px-3 py-1 text-xs text-muted-foreground">
            <ShieldCheck className="h-3.5 w-3.5 text-primary" />
            HQ Administration
          </div>
          <h1 className="text-3xl font-semibold">HQ Admin Management</h1>
          <p className="mt-1 text-sm text-muted-foreground">Manage Super Admins and Managers who control the Addis Events platform.</p>
        </div>
        <div className="flex gap-2">
          <Button asChild className="rounded-xl shadow-lg shadow-primary/20">
            <Link href="/admin/admins/new">
              <Plus className="mr-2 h-4 w-4" />
              Add HQ Admin
            </Link>
          </Button>
        </div>
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 flex items-center gap-2">
          <ShieldAlert className="h-4 w-4" />
          {error}
        </div>
      )}

      <Card className="rounded-2xl border-border/70 shadow-sm overflow-hidden">
        <CardHeader className="bg-muted/30 border-b border-border/70">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <CardTitle className="text-base">Administrative Team</CardTitle>
              <CardDescription>Internal team members with elevated platform permissions.</CardDescription>
            </div>
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input 
                value={query} 
                onChange={(e) => setQuery(e.target.value)} 
                placeholder="Search admins..." 
                className="pl-9 rounded-xl h-9" 
              />
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-muted/20">
              <TableRow>
                <TableHead>Admin</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Joined</TableHead>
                <TableHead className="w-20 text-right pr-6">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={6} className="py-12 text-center text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin mx-auto mb-2" />Loading admins...</TableCell></TableRow>
              ) : filtered.length === 0 ? (
                <TableRow><TableCell colSpan={6} className="py-12 text-center text-sm text-muted-foreground">No admins found.</TableCell></TableRow>
              ) : (
                filtered.map((admin) => (
                  <TableRow key={admin.id} className="hover:bg-primary/[0.02]">
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                          <ShieldCheck className="h-4 w-4" />
                        </div>
                        <span className="font-medium">{admin.full_name || 'Pending profile'}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{admin.email}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className={`rounded-lg ${admin.role === 'super_admin' ? 'border-primary/20 bg-primary/5 text-primary' : ''}`}>
                        {roleLabels[admin.role] || admin.role}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge className={`rounded-lg ${(admin.status || 'active') === 'active' ? 'bg-green-50 text-green-700 border-green-100' : 'bg-amber-50 text-amber-700 border-amber-100'}`}>
                        {admin.status || 'active'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {new Date(admin.created_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-right pr-6">
                      <Button asChild variant="ghost" size="icon" className="rounded-lg">
                        <Link href={`/admin/admins/${admin.id}`} aria-label={`Edit ${admin.email}`}>
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

export default function AdminManagementPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>}>
      <AdminsList />
    </Suspense>
  )
}
