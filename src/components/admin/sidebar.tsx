'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { AnimatePresence, motion } from 'framer-motion'
import {
  Users,
  Settings,
  LogOut,
  Menu,
  X,
  Home,
  Building,
  ShieldCheck,
  MessageSquare,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { ScrollArea } from '@/components/ui/scroll-area'
import { createClient } from '@/lib/supabase/client'

const sidebarLinks = [
  { href: '/admin', icon: Home, label: 'HQ Overview' },
  { href: '/admin/users', icon: Users, label: 'User Directory' },
  { href: '/admin/organizations', icon: Building, label: 'Organizations' },
  { href: '/admin/inquiries', icon: MessageSquare, label: 'Inquiries' },
  { href: '/admin/settings', icon: Settings, label: 'Global Settings' },
]

const superAdminLinks = [
  { href: '/admin/admins', icon: ShieldCheck, label: 'Admin Management' },
]

function AdminSidebarContent({
  pathname,
  onNavigate,
  onLogout,
  userRole,
}: {
  pathname: string
  onNavigate: () => void
  onLogout: () => void
  userRole?: string
}) {
  const isActive = (href: string) => {
    if (href === '/admin') return pathname === '/admin'
    return pathname.startsWith(href)
  }

  return (
    <div className="flex flex-col h-full">
      <div className="px-4 py-5">
        <Link href="/admin" className="flex items-center gap-3 rounded-2xl px-2 py-1.5 transition-colors hover:bg-primary/5">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-lg shadow-primary/20">
            <ShieldCheck className="h-4 w-4" strokeWidth={1.7} />
          </span>
          <span className="min-w-0">
            <span className="block font-heading text-base font-semibold tracking-tight">
              Addis<span className="text-primary">Events</span>
            </span>
            <span className="block text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
              Management HQ
            </span>
          </span>
        </Link>
      </div>

      <Separator className="bg-border/60" />

      <ScrollArea className="flex-1 px-3">
        <nav className="space-y-1 py-3">
          {sidebarLinks.map((link) => {
            const active = isActive(link.href)
            return (
              <Link
                key={link.href}
                href={link.href}
                onClick={onNavigate}
                className={`group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-all ${
                  active
                    ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/15'
                    : 'text-muted-foreground hover:bg-white hover:text-foreground hover:shadow-sm'
                }`}
              >
                <link.icon className="w-4 h-4 shrink-0" strokeWidth={1.6} />
                {link.label}
              </Link>
            )
          })}

          {userRole === 'super_admin' && (
            <>
              <div className="pt-4 pb-2 px-3">
                <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">
                  Administration
                </span>
              </div>
              {superAdminLinks.map((link) => {
                const active = isActive(link.href)
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={onNavigate}
                    className={`group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-all ${
                      active
                        ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/15'
                        : 'text-muted-foreground hover:bg-white hover:text-foreground hover:shadow-sm'
                    }`}
                  >
                    <link.icon className="w-4 h-4 shrink-0" strokeWidth={1.6} />
                    {link.label}
                  </Link>
                )
              })}
            </>
          )}
        </nav>
      </ScrollArea>

      <div className="p-4 border-t border-border/60">
        <Button
          variant="ghost"
          size="sm"
          onClick={onLogout}
          className="w-full justify-start rounded-xl text-muted-foreground hover:bg-destructive/5 hover:text-destructive"
        >
          <LogOut className="w-4 h-4 mr-2" />
          Sign Out
        </Button>
      </div>
    </div>
  )
}

export function AdminSidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const [isMobileOpen, setIsMobileOpen] = useState(false)
  const [userRole, setUserRole] = useState<string | undefined>()

  useEffect(() => {
    const fetchUser = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      setUserRole(user?.user_metadata?.role || 'manager') // Fallback to manager if not set in metadata
    }
    fetchUser()
  }, [])

  const handleLogout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <>
      <aside className="hidden lg:flex h-screen w-64 shrink-0 flex-col border-r border-border/60 bg-white/85 shadow-sm shadow-black/[0.02] backdrop-blur-xl sticky top-0">
        <AdminSidebarContent
          pathname={pathname}
          onNavigate={() => setIsMobileOpen(false)}
          onLogout={handleLogout}
          userRole={userRole}
        />
      </aside>

      <div className="lg:hidden fixed top-0 left-0 right-0 z-50 glass-navbar border-b border-border/60">
        <div className="flex items-center justify-between px-5 h-14">
          <Link href="/admin" className="font-heading text-base font-semibold tracking-tight">
            Addis<span className="text-primary">Events</span> HQ
          </Link>
          <button
            onClick={() => setIsMobileOpen(!isMobileOpen)}
            className="rounded-lg p-2 hover:bg-accent"
            aria-label="Toggle sidebar"
          >
            {isMobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      <AnimatePresence>
        {isMobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="lg:hidden fixed inset-0 z-40 bg-black/30 backdrop-blur-sm"
              onClick={() => setIsMobileOpen(false)}
            />
            <motion.aside
              initial={{ x: -240 }}
              animate={{ x: 0 }}
              exit={{ x: -240 }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="lg:hidden fixed left-0 top-0 bottom-0 z-50 w-72 border-r border-border/60 bg-white/95 backdrop-blur-xl"
            >
              <AdminSidebarContent
                pathname={pathname}
                onNavigate={() => setIsMobileOpen(false)}
                onLogout={handleLogout}
                userRole={userRole}
              />
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  )
}
