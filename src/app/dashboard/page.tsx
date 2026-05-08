'use client'

import useSWR from 'swr';
import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import {
  Calendar,
  Users,
  QrCode,
  TrendingUp,
  Plus,
  ArrowUpRight,
  Clock,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

const statusStyle: Record<string, string> = {
  draft: 'bg-muted text-muted-foreground',
  published: 'bg-blue-50 text-blue-600',
  live: 'bg-green-50 text-green-600',
  completed: 'bg-stone-100 text-stone-600',
}

const priorityStyle: Record<string, string> = {
  low: 'bg-muted text-muted-foreground',
  medium: 'bg-blue-50 text-blue-600',
  high: 'bg-orange-50 text-orange-600',
  urgent: 'bg-red-50 text-red-600',
}

export default function DashboardPage() {
  const [statsData, setStatsData] = useState([
    { label: 'Total Events', value: '...', change: 'Loading', icon: Calendar },
    { label: 'Total Guests', value: '...', change: 'Loading', icon: Users },
    { label: 'Check-ins', value: '...', change: 'Loading', icon: QrCode },
    { label: 'Tasks Pending', value: '...', change: 'Loading', icon: TrendingUp },
  ])
  const [eventsData, setEventsData] = useState<any[]>([])
  const [tasksData, setTasksData] = useState<any[]>([])
  const supabase = createClient()

  useEffect(() => {
    let mounted = true

    const fetchDashboardData = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // Fetch primary data with counts included in joined queries to avoid N+1 round trips
      const [recentEventsRes, upcomingTasksRes, statsRes] = await Promise.all([
        supabase
          .from('events')
          .select(`
            id, title, start_date, status, capacity,
            guests(id),
            rsvp_responses(id)
          `)
          .eq('organizer_id', user.id)
          .eq('rsvp_responses.status', 'confirmed')
          .order('created_at', { ascending: false })
          .limit(3),
        supabase
          .from('tasks')
          .select('id, title, due_date, priority, status')
          .eq('status', 'pending')
          .order('created_at', { ascending: false })
          .limit(4),
        // Global stats for this user's events
        supabase
          .from('events')
          .select(`
            id,
            guests(id),
            checkins(id),
            tasks(id)
          `)
          .eq('organizer_id', user.id)
          .eq('tasks.status', 'pending')
      ])

      const recentEvents = recentEventsRes.data || []
      const upcomingTasks = upcomingTasksRes.data || []
      const allEvents = statsRes.data || []

      // Calculate aggregate stats from the combined results
      const totalEvents = allEvents.length
      let totalGuestsCount = 0
      let totalCheckinsCount = 0
      let pendingTasksCount = 0

      allEvents.forEach((event: any) => {
        totalGuestsCount += event.guests?.length || 0
        totalCheckinsCount += event.checkins?.length || 0
        pendingTasksCount += event.tasks?.length || 0
      })

      if (mounted) {
        setEventsData(recentEvents.map((e: any) => ({
          id: e.id,
          title: e.title,
          date: new Date(e.start_date).toLocaleDateString(),
          confirmed: e.rsvp_responses?.length || 0,
          guests: e.guests?.length || 0,
          status: e.status
        })))

        setTasksData(upcomingTasks.map(t => ({
          id: t.id,
          title: t.title,
          due: t.due_date ? new Date(t.due_date).toLocaleDateString() : 'No date',
          priority: t.priority
        })))

        setStatsData([
          { label: 'Total Events', value: totalEvents.toString(), change: 'All time', icon: Calendar },
          { label: 'Total Guests', value: totalGuestsCount.toString(), change: 'Across all events', icon: Users },
          { label: 'Check-ins', value: totalCheckinsCount.toString(), change: 'Total recorded', icon: QrCode },
          { label: 'Tasks Pending', value: pendingTasksCount.toString(), change: 'Action required', icon: TrendingUp },
        ])
      }
    }

    fetchDashboardData()

    const channel = supabase.channel('dashboard-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'events' }, fetchDashboardData)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tasks' }, fetchDashboardData)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'checkins' }, fetchDashboardData)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'guests' }, fetchDashboardData)
      .subscribe()

    return () => {
      mounted = false
      supabase.removeChannel(channel)
    }
  }, [supabase])

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Dashboard</h1>
          <p className="text-sm text-muted-foreground mt-1">Welcome back. Here&apos;s your overview.</p>
        </div>
        <Link href="/dashboard/events/new">
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            New Event
          </Button>
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statsData.map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: i * 0.06 }}
          >
            <Card>
              <CardContent className="p-5">
                <div className="flex items-center justify-between mb-3">
                  <stat.icon className="w-4 h-4 text-muted-foreground" strokeWidth={1.5} />
                  <span className="text-xs text-muted-foreground">{stat.change}</span>
                </div>
                <p className="text-2xl font-semibold font-heading">{stat.value}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{stat.label}</p>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Events */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-4">
              <CardTitle className="text-base">Recent Events</CardTitle>
              <Link href="/dashboard/events" className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1">
                View all <ArrowUpRight className="w-3 h-3" />
              </Link>
            </CardHeader>
            <CardContent className="space-y-3">
              {eventsData.length === 0 ? (
                <div className="text-sm text-muted-foreground py-4 text-center">No events found.</div>
              ) : (
                eventsData.map((event) => (
                  <Link href={`/dashboard/events/${event.id}`} key={event.id}>
                    <div className="flex items-center gap-4 p-3 rounded-lg hover:bg-accent/50 transition-colors cursor-pointer group mb-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <p className="text-sm font-medium truncate">{event.title}</p>
                          <Badge variant="outline" className={`text-[10px] uppercase border-0 ${statusStyle[event.status] || 'bg-muted'}`}>
                            {event.status}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-3 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {event.date}
                          </span>
                          <span>{event.confirmed}/{event.guests} confirmed</span>
                        </div>
                      </div>
                      <ArrowUpRight className="w-3.5 h-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
                    </div>
                  </Link>
                ))
              )}
            </CardContent>
          </Card>
        </div>

        {/* Tasks */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-4">
            <CardTitle className="text-base">Tasks</CardTitle>
            <Link href="/dashboard/tasks" className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1">
              View all <ArrowUpRight className="w-3 h-3" />
            </Link>
          </CardHeader>
          <CardContent className="space-y-2">
            {tasksData.length === 0 ? (
              <div className="text-sm text-muted-foreground py-4 text-center">No pending tasks.</div>
            ) : (
              tasksData.map((task) => (
                <div key={task.id} className="flex items-start gap-3 p-2.5 rounded-lg hover:bg-accent/50 transition-colors">
                  <div className="w-1.5 h-1.5 rounded-full bg-foreground mt-2 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm truncate">{task.title}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-xs text-muted-foreground">{task.due}</span>
                      <Badge variant="outline" className={`text-[10px] border-0 ${priorityStyle[task.priority] || 'bg-muted'}`}>
                        {task.priority}
                      </Badge>
                    </div>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
