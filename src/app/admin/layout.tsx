'use client'

import { AdminSidebar } from '@/components/admin/sidebar'
import { usePathname } from 'next/navigation'

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const isAuthPage = pathname === '/admin/setup' || pathname === '/admin/login' || pathname === '/admin/verify-2fa'

  if (isAuthPage) {
    return <>{children}</>
  }

  return (
    <div className="relative flex min-h-screen overflow-hidden bg-background">
      <div className="pointer-events-none absolute inset-0 dot-pattern opacity-35" />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-72 bg-[linear-gradient(180deg,rgba(145,9,30,0.08),rgba(166,123,91,0.05)_42%,transparent)]" />
      <AdminSidebar />
      <main className="workspace-main relative z-10 flex-1 pt-14 lg:pt-0">
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8 lg:py-10">
          {children}
        </div>
      </main>
    </div>
  )
}
