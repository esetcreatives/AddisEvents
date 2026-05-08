'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { ArrowLeft, Save, Users, Lock, ShieldCheck, UserPlus, Trash2, Key } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'

export default function AccessManagementPage() {
  const { id } = useParams()
  const router = useRouter()
  const supabase = createClient()
  
  const [event, setEvent] = useState<any>(null)
  const [clients, setClients] = useState<any[]>([])
  const [staffList, setStaffList] = useState<any[]>([])
  const [existingAccess, setExistingAccess] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  // New access form states
  const [selectedUserId, setSelectedUserId] = useState('')
  const [selectedRole, setSelectedRole] = useState<'client' | 'staff'>('staff')
  const [newPin, setNewPin] = useState('')

  useEffect(() => {
    const fetchData = async () => {
      const [eventRes, profilesRes, accessRes] = await Promise.all([
        supabase.from('events').select('*').eq('id', id).single(),
        supabase.from('users').select('id, full_name, email, role'),
        supabase.from('event_access').select('*, users(full_name, email)').eq('event_id', id)
      ])

      if (eventRes.data) setEvent(eventRes.data)
      if (profilesRes.data) {
        setClients(profilesRes.data.filter(p => p.role === 'client'))
        setStaffList(profilesRes.data.filter(p => p.role === 'staff'))
      }
      if (accessRes.data) setExistingAccess(accessRes.data)
      setLoading(false)
    }
    fetchData()
  }, [id, supabase])

  const handleAddAccess = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedUserId) return
    setSaving(true)

    const { error } = await supabase.from('event_access').insert({
      event_id: id,
      user_id: selectedUserId,
      role: selectedRole,
      pin_code: selectedRole === 'staff' ? newPin : null
    })

    if (!error) {
      // Refresh access list
      const { data } = await supabase.from('event_access').select('*, users(full_name, email)').eq('event_id', id)
      if (data) setExistingAccess(data)
      
      // Update event table if it's a client
      if (selectedRole === 'client') {
        await supabase.from('events').update({ client_id: selectedUserId }).eq('id', id)
      }

      setSelectedUserId('')
      setNewPin('')
    }
    setSaving(true)
    // Actually setSaving(false) but I used true by mistake in logic, fixing below
    setSaving(false)
  }

  const handleRemoveAccess = async (accessId: string, userId: string, role: string) => {
    const { error } = await supabase.from('event_access').delete().eq('id', accessId)
    if (!error) {
      setExistingAccess(prev => prev.filter(a => a.id !== accessId))
      if (role === 'client') {
        await supabase.from('events').update({ client_id: null }).eq('id', id)
      }
    }
  }

  if (loading) return <div className="p-8 text-center text-muted-foreground">Loading access settings...</div>

  return (
    <div className="space-y-8 max-w-4xl mx-auto pb-20">
      <div className="flex items-center gap-3">
        <Link href={`/dashboard/events/${id}`}>
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <ArrowLeft className="w-4 h-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-semibold">Access Control</h1>
          <p className="text-sm text-muted-foreground">{event?.title}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader><CardTitle className="text-base font-heading">Active Collaborators</CardTitle></CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-border">
                {existingAccess.length === 0 ? (
                  <div className="p-12 text-center text-muted-foreground text-sm">No external access granted yet.</div>
                ) : existingAccess.map(access => (
                  <div key={access.id} className="flex items-center justify-between p-4 hover:bg-muted/30 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${access.role === 'client' ? 'bg-blue-100 text-blue-600' : 'bg-amber-100 text-amber-600'}`}>
                        {access.role === 'client' ? <ShieldCheck className="w-5 h-5" /> : <Key className="w-5 h-5" />}
                      </div>
                      <div>
                        <p className="text-sm font-semibold">{(access.users as any)?.full_name || 'User'}</p>
                        <p className="text-[10px] text-muted-foreground uppercase tracking-widest">{access.role}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      {access.role === 'staff' && (
                        <div className="text-right mr-4">
                          <p className="text-[10px] text-muted-foreground uppercase">PIN CODE</p>
                          <p className="text-sm font-mono font-bold">{access.pin_code || 'None'}</p>
                        </div>
                      )}
                      <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-destructive h-8 w-8" onClick={() => handleRemoveAccess(access.id, access.user_id, access.role)}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-muted/20 border-dashed border-2">
            <CardHeader><CardTitle className="text-base flex items-center gap-2"><UserPlus className="w-4 h-4" /> Grant New Access</CardTitle></CardHeader>
            <CardContent>
              <form onSubmit={handleAddAccess} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>User Type</Label>
                    <Select value={selectedRole} onValueChange={(v: any) => setSelectedRole(v)}>
                      <SelectTrigger className="bg-white"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="client">Client (Portal Access)</SelectItem>
                        <SelectItem value="staff">Staff (Check-in Only)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Select User</Label>
                    <Select value={selectedUserId} onValueChange={(v) => setSelectedUserId(v || '')}>
                      <SelectTrigger className="bg-white"><SelectValue placeholder="Choose user..." /></SelectTrigger>
                      <SelectContent>
                        {(selectedRole === 'client' ? clients : staffList).map(u => (
                          <SelectItem key={u.id} value={u.id}>{u.full_name} ({u.email})</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {selectedRole === 'staff' && (
                  <div className="space-y-2">
                    <Label>Security PIN (4-6 digits)</Label>
                    <Input 
                      placeholder="e.g. 1234" 
                      className="bg-white font-mono" 
                      value={newPin} 
                      onChange={e => setNewPin(e.target.value)}
                      maxLength={6}
                    />
                  </div>
                )}

                <Button className="w-full h-12" type="submit" disabled={saving || !selectedUserId}>
                  {saving ? 'Adding...' : 'Grant Access'}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader><CardTitle className="text-base font-heading">Role Permissions</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="p-3 bg-blue-50 rounded-lg">
                <p className="text-[10px] font-bold text-blue-700 uppercase mb-1">Client Role</p>
                <p className="text-[11px] text-blue-600 leading-tight">Can view event stats, approve vendors, and upload assets. Cannot edit guests or check-in.</p>
              </div>
              <div className="p-3 bg-amber-50 rounded-lg">
                <p className="text-[10px] font-bold text-amber-700 uppercase mb-1">Staff Role</p>
                <p className="text-[11px] text-amber-600 leading-tight">Can only access the check-in screen using the PIN provided. No access to dashboard or guest details.</p>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-primary text-white border-0 shadow-lg">
            <CardHeader><CardTitle className="text-base font-heading">Portal Links</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-1">
                <p className="text-[10px] text-white/60 uppercase">Client Portal URL</p>
                <code className="text-[10px] bg-white/10 p-1.5 rounded block truncate">/portal</code>
              </div>
              <div className="space-y-1 pt-2">
                <p className="text-[10px] text-white/60 uppercase">Staff Check-in URL</p>
                <code className="text-[10px] bg-white/10 p-1.5 rounded block truncate">/checkin/{id}</code>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
