'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import {
  Users,
  Building,
  Activity,
  MessageSquare,
  ArrowUpRight,
  RotateCcw,
  ShieldCheck,
} from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

export default function AdminDashboardPage() {
  const [stats, setStats] = useState([
    { label: 'Platform Users', value: '...', icon: Users, change: 'Loading', href: '/admin/users' },
    { label: 'HQ Admins', value: '...', icon: ShieldCheck, iconColor: 'text-primary', change: 'Loading', href: '/admin/admins' },
    { label: 'Organizations', value: '...', icon: Building, change: 'Loading', href: '/admin/organizations' },
    { label: 'Active Events', value: '...', icon: Activity, change: 'Loading', href: '#' },
  ])
  const [recentUsers, setRecentUsers] = useState<{ id: string; full_name: string | null; email: string; role: string }[]>([])
  const [recentOrganizations, setRecentOrganizations] = useState<{ id: string; name: string; contact_email: string | null }[]>([])

  const [isRefreshing, setIsRefreshing] = useState(false)

  const fetchAdminData = async () => {
    setIsRefreshing(true)
    try {
      const response = await fetch('/api/admin/overview')
      const result = await response.json()

      setStats([
        { label: 'Platform Users', value: String(result.stats?.users || 0), icon: Users, change: 'External', href: '/admin/users' },
        { label: 'HQ Admins', value: String(result.stats?.admins || 0), icon: ShieldCheck, change: 'Internal', href: '/admin/admins' },
        { label: 'Organizations', value: String(result.stats?.organizations || 0), icon: Building, change: 'Workspaces', href: '/admin/organizations' },
        { label: 'Inquiries', value: String(result.stats?.inquiries || 0), icon: MessageSquare, change: 'Contact form', href: '/admin/inquiries' },
      ])
      setRecentUsers(result.recentUsers || [])
      setRecentOrganizations(result.recentOrganizations || [])
    } finally {
      setIsRefreshing(false)
    }
  }

  useEffect(() => {
    fetchAdminData()
  }, [])

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-heading font-bold tracking-tight">Management HQ</h1>
          <p className="text-muted-foreground mt-1">Platform overview and operational control.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            size="icon" 
            onClick={fetchAdminData} 
            disabled={isRefreshing}
            className="rounded-xl"
            title="Refresh Data"
          >
            <RotateCcw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          </Button>
          <Button asChild className="rounded-xl">
            <Link href="/admin/users/new">Create User</Link>
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, index) => (
          <Link key={stat.label} href={stat.href}>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="overflow-hidden rounded-2xl border border-border/70 bg-white/90 p-6 shadow-sm shadow-black/[0.03] backdrop-blur-sm transition-all hover:-translate-y-0.5 hover:shadow-md hover:shadow-black/[0.05] cursor-pointer"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary ring-1 ring-primary/10">
                  <stat.icon className="w-5 h-5" />
                </div>
                <span className={`text-sm font-medium ${stat.change.startsWith('+') ? 'text-green-600' : 'text-muted-foreground'}`}>
                  {stat.change}
                </span>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">{stat.label}</p>
                <h3 className="text-2xl font-bold mt-1">{stat.value}</h3>
              </div>
            </motion.div>
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8">
        <div className="rounded-2xl border border-border/70 bg-white/90 p-6 shadow-sm shadow-black/[0.03] backdrop-blur-sm">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-lg font-semibold">Recent Organizations</h3>
            <Link href="/admin/organizations" className="text-xs text-muted-foreground hover:text-foreground inline-flex items-center gap-1">
              View all <ArrowUpRight className="h-3 w-3" />
            </Link>
          </div>
          <div className="divide-y divide-border/70 overflow-hidden rounded-xl border border-border/70 bg-white/65">
            {recentOrganizations.length === 0 ? (
              <div className="p-8 text-center text-sm text-muted-foreground">No organizations yet.</div>
            ) : recentOrganizations.map((org) => (
              <div key={org.id} className="flex items-center justify-between p-3 transition-colors hover:bg-primary/[0.035]">
                <div>
                  <p className="text-sm font-medium">{org.name}</p>
                  <p className="text-xs text-muted-foreground">{org.contact_email || 'No contact email'}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-border/70 bg-white/90 p-6 shadow-sm shadow-black/[0.03] backdrop-blur-sm">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-lg font-semibold">Recent Users</h3>
            <Link href="/admin/users" className="text-xs text-muted-foreground hover:text-foreground inline-flex items-center gap-1">
              View all <ArrowUpRight className="h-3 w-3" />
            </Link>
          </div>
          <div className="divide-y divide-border/70 overflow-hidden rounded-xl border border-border/70 bg-white/65">
            {recentUsers.length === 0 ? (
              <div className="p-8 text-center text-sm text-muted-foreground">No users yet.</div>
            ) : recentUsers.map((user) => (
              <div key={user.id} className="flex items-center justify-between p-3 transition-colors hover:bg-primary/[0.035]">
                <div>
                  <p className="text-sm font-medium">{user.full_name || 'Pending profile'}</p>
                  <p className="text-xs text-muted-foreground">{user.email}</p>
                </div>
                <span className="rounded-full border border-border/70 bg-white px-2 py-1 text-[10px] uppercase tracking-wider text-muted-foreground">{user.role}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
