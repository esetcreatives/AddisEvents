'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Users, Mail, UserPlus, Shield, Key } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { createClient } from '@/lib/supabase/client'
import { useConfirm } from '@/components/confirm-provider'

export default function ClientsPage() {
  const supabase = createClient()
  const confirm = useConfirm()

  const [users, setUsers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [inviting, setInviting] = useState(false)

  const [email, setEmail] = useState('')
  const [fullName, setFullName] = useState('')
  const [role, setRole] = useState<'client' | 'staff'>('client')

  const fetchUsers = async () => {
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    // Get current user's org id
    const { data: orgData } = await supabase
      .from('users')
      .select('organization_id')
      .eq('id', user.id)
      .single()

    if (orgData?.organization_id) {
      const { data } = await supabase
        .from('users')
        .select('*')
        .eq('organization_id', orgData.organization_id)
        .neq('id', user.id) // Exclude self
      
      if (data) setUsers(data)
    }
    setLoading(false)
  }

  useEffect(() => {
    fetchUsers()
  }, [])

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault()
    setInviting(true)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: orgData } = await supabase
        .from('users')
        .select('organization_id')
        .eq('id', user.id)
        .single()

      if (!orgData?.organization_id) {
        throw new Error("No organization found")
      }

      // Use a custom API route for inviting to handle admin auth
      const res = await fetch('/api/dashboard/invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          fullName,
          role,
          organizationId: orgData.organization_id
        })
      })

      const result = await res.json()
      if (!res.ok) throw new Error(result.error || 'Failed to invite')

      let description = `Account created for ${email}.`
      
      if (result.tempPassword) {
        description += `\n\nTemporary Password: ${result.tempPassword}`
      }
      if (result.pin) {
        description += `\nStaff PIN: ${result.pin}`
      }
      
      if (result.tempPassword || result.pin) {
        description += `\n\nPlease copy these credentials and share them securely with the user.`
      }

      await confirm({
        title: "Success",
        description: description,
        confirmText: "OK",
        cancelText: ""
      })

      setEmail('')
      setFullName('')
      fetchUsers()
    } catch (err: any) {
      await confirm({
        title: "Error",
        description: err.message,
        confirmText: "OK",
        cancelText: ""
      })
    } finally {
      setInviting(false)
    }
  }

  return (
    <div className="space-y-8 pb-20">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-heading font-bold">Team & Clients</h1>
          <p className="text-muted-foreground mt-1">Manage external partners and your staff members.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1 space-y-6">
          <Card className="bg-white">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <UserPlus className="w-4 h-4" />
                Invite User
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleInvite} className="space-y-4">
                <div className="space-y-2">
                  <Label>Role</Label>
                  <Select value={role} onValueChange={(v: any) => setRole(v)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="client">Client (Portal Access)</SelectItem>
                      <SelectItem value="staff">Staff (Check-in Only)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label>Full Name</Label>
                  <Input 
                    value={fullName}
                    onChange={e => setFullName(e.target.value)}
                    placeholder="e.g. Abebe Kebede"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label>Email</Label>
                  <Input 
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="name@example.com"
                    required
                  />
                </div>

                <Button type="submit" className="w-full" disabled={inviting}>
                  {inviting ? 'Sending...' : 'Send Invite'}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-base font-heading flex items-center gap-2">
                <Users className="w-4 h-4" />
                Directory
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {loading ? (
                <div className="p-8 text-center text-muted-foreground text-sm">Loading users...</div>
              ) : users.length === 0 ? (
                <div className="p-12 text-center text-muted-foreground text-sm">No users found. Invite someone to get started.</div>
              ) : (
                <div className="divide-y divide-border">
                  {users.map(u => (
                    <div key={u.id} className="flex items-center justify-between p-4 hover:bg-muted/30 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${u.role === 'client' ? 'bg-blue-100 text-blue-600' : 'bg-amber-100 text-amber-600'}`}>
                          {u.role === 'client' ? <Shield className="w-5 h-5" /> : <Key className="w-5 h-5" />}
                        </div>
                        <div>
                          <p className="text-sm font-semibold">{u.full_name || 'Pending Invite'}</p>
                          <p className="text-xs text-muted-foreground flex items-center gap-1">
                            <Mail className="w-3 h-3" /> {u.email}
                          </p>
                        </div>
                      </div>
                      <Badge variant="outline" className="uppercase tracking-widest text-[10px]">
                        {u.role}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
