'use client'

import { motion } from 'framer-motion'
import { User, Bell, Globe, Shield } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import { Separator } from '@/components/ui/separator'

export default function SettingsPage() {
  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Settings</h1>
        <p className="text-sm text-muted-foreground mt-1">Manage your account and preferences.</p>
      </div>

      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
        <Card>
          <CardHeader><CardTitle className="text-base flex items-center gap-2"><User className="w-4 h-4 text-muted-foreground" strokeWidth={1.5} />Profile</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5"><Label htmlFor="s-name">Name</Label><Input id="s-name" placeholder="Your name" /></div>
              <div className="space-y-1.5"><Label htmlFor="s-email">Email</Label><Input id="s-email" type="email" disabled placeholder="you@example.com" /></div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5"><Label htmlFor="s-phone">Phone</Label><Input id="s-phone" placeholder="+251 9X XXX XXXX" /></div>
              <div className="space-y-1.5"><Label htmlFor="s-company">Company</Label><Input id="s-company" placeholder="Your company" /></div>
            </div>
            <Button>Save Changes</Button>
          </CardContent>
        </Card>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: 0.05 }}>
        <Card>
          <CardHeader><CardTitle className="text-base flex items-center gap-2"><Bell className="w-4 h-4 text-muted-foreground" strokeWidth={1.5} />Notifications</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            {[
              { label: 'New RSVP notifications', desc: 'Email when guests respond', on: true },
              { label: 'Daily digest', desc: 'Summary of daily activity', on: false },
              { label: 'Check-in alerts', desc: 'Real-time check-in notifications', on: true },
            ].map((item) => (
              <div key={item.label} className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">{item.label}</p>
                  <p className="text-xs text-muted-foreground">{item.desc}</p>
                </div>
                <Switch defaultChecked={item.on} />
              </div>
            ))}
          </CardContent>
        </Card>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: 0.1 }}>
        <Card>
          <CardHeader><CardTitle className="text-base flex items-center gap-2"><Globe className="w-4 h-4 text-muted-foreground" strokeWidth={1.5} />Language</CardTitle></CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Interface language</p>
                <p className="text-xs text-muted-foreground">Choose your preferred language</p>
              </div>
              <select className="h-9 rounded-md border border-input bg-background px-3 text-sm">
                <option value="en">English</option>
                <option value="am">አማርኛ (Amharic)</option>
              </select>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: 0.15 }}>
        <Card className="border-destructive/20">
          <CardHeader><CardTitle className="text-base flex items-center gap-2 text-destructive"><Shield className="w-4 h-4" strokeWidth={1.5} />Danger Zone</CardTitle></CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Delete account</p>
                <p className="text-xs text-muted-foreground">Permanently delete your account and data</p>
              </div>
              <Button variant="destructive" size="sm">Delete</Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}
