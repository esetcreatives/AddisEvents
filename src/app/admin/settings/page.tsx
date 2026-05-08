'use client'

import { useEffect, useState } from 'react'
import { Bell, Lock, Settings2, UserPlus, Loader2, Save, Trash2, RotateCcw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState({
    signup_enabled: true,
    client_portal_enabled: true,
    staff_pins_required: true,
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [resetting, setResetting] = useState(false)

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await fetch('/api/admin/settings')
        const data = await res.json()
        setSettings({
          signup_enabled: data.signup_enabled ?? true,
          client_portal_enabled: data.client_portal_enabled ?? true,
          staff_pins_required: data.staff_pins_required ?? true,
        })
      } catch {
        setError('Failed to load settings.')
      } finally {
        setLoading(false)
      }
    }
    fetchSettings()
  }, [])

  const handleSave = async () => {
    setSaving(true)
    setMessage('')
    setError('')
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      })
      if (res.ok) {
        setMessage('Platform settings updated successfully.')
      } else {
        setError('Failed to save settings.')
      }
    } catch {
      setError('Network error saving settings.')
    } finally {
      setSaving(false)
    }
  }

  const handleReset = async () => {
    if (!confirm('CRITICAL WARNING: This will delete ALL events, organizations, and guests. This cannot be undone. Proceed?')) return
    
    setResetting(true)
    setMessage('')
    setError('')
    try {
      const res = await fetch('/api/admin/test-reset', { method: 'POST' })
      if (res.ok) {
        setMessage('Platform data has been wiped. Refreshing...')
        setTimeout(() => window.location.reload(), 2000)
      } else {
        const d = await res.json()
        setError(d.error || 'Failed to wipe data.')
      }
    } catch {
      setError('Network error during reset.')
    } finally {
      setResetting(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 text-muted-foreground">
        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
        Loading settings…
      </div>
    )
  }

  return (
    <div className="max-w-4xl space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
        <div>
          <div className="mb-3 inline-flex items-center gap-2 rounded-full border bg-white px-3 py-1 text-xs text-muted-foreground">
            <Settings2 className="h-3.5 w-3.5 text-primary" />
            Platform Controls
          </div>
          <h1 className="text-3xl font-semibold">Platform settings</h1>
          <p className="mt-1 text-sm text-muted-foreground">Central switches for signup, portals, and operational access.</p>
        </div>
        <Button onClick={handleSave} disabled={saving} className="w-full sm:w-auto">
          {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
          Save settings
        </Button>
      </div>

      {message && <div className="rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-700">{message}</div>}
      {error && <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-600">{error}</div>}

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2 text-base"><UserPlus className="h-4 w-4 text-primary" />Signup & Access</CardTitle></CardHeader>
          <CardContent className="space-y-5">
            <div className="flex items-center justify-between gap-4">
              <div>
                <Label>Organizer self-signup</Label>
                <p className="mt-1 text-xs text-muted-foreground">Allow organizers to create their own workspace from `/signup`.</p>
              </div>
              <Switch 
                checked={settings.signup_enabled} 
                onCheckedChange={(val) => setSettings({ ...settings, signup_enabled: val })} 
              />
            </div>
            <div className="flex items-center justify-between gap-4">
              <div>
                <Label>Client portal access</Label>
                <p className="mt-1 text-xs text-muted-foreground">Allow invited clients to access the `/portal` dashboard.</p>
              </div>
              <Switch 
                checked={settings.client_portal_enabled} 
                onCheckedChange={(val) => setSettings({ ...settings, client_portal_enabled: val })} 
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2 text-base"><Lock className="h-4 w-4 text-primary" />Security & Operations</CardTitle></CardHeader>
          <CardContent className="space-y-5">
            <div className="flex items-center justify-between gap-4">
              <div>
                <Label>Staff event PINs</Label>
                <p className="mt-1 text-xs text-muted-foreground">Require PIN-gated check-in access for event staff.</p>
              </div>
              <Switch 
                checked={settings.staff_pins_required} 
                onCheckedChange={(val) => setSettings({ ...settings, staff_pins_required: val })} 
              />
            </div>
            <div className="rounded-lg border bg-muted/40 p-4">
              <div className="flex items-center gap-2 text-sm font-medium"><Bell className="h-4 w-4 text-primary" />Email transport</div>
              <p className="mt-1 text-xs text-muted-foreground">Resend is configured for transactional emails. Check logs for delivery status.</p>
            </div>
          </CardContent>
        </Card>

        <Card className="md:col-span-2 border-red-200 bg-red-50/30">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base text-red-700 font-bold uppercase tracking-tight">
              Testing & Development Zone
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <p className="text-sm font-semibold text-red-900">Wipe Platform Data</p>
                <p className="text-xs text-red-700 mt-1 max-w-md leading-relaxed">
                  This temporary button deletes all organizations, events, guests, and responses. 
                  It does NOT delete user accounts to prevent lockout. Use for fresh test runs.
                </p>
              </div>
              <Button 
                variant="destructive" 
                onClick={handleReset} 
                disabled={resetting}
                className="w-full sm:w-auto shadow-lg shadow-red-500/20"
              >
                {resetting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Trash2 className="mr-2 h-4 w-4" />}
                Wipe All Data
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
