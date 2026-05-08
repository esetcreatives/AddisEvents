'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Plus, Clock, CheckCircle2, Circle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { createClient } from '@/lib/supabase/client'

const priorityStyle: Record<string, string> = {
  low: 'bg-muted text-muted-foreground',
  medium: 'bg-blue-50 text-blue-600',
  high: 'bg-orange-50 text-orange-600',
  urgent: 'bg-red-50 text-red-600',
}

export default function TasksPage() {
  const supabase = createClient()
  const [events, setEvents] = useState<any[]>([])
  const [selectedEventId, setSelectedEventId] = useState<string>('all')
  const [tasks, setTasks] = useState<any[]>([])
  const [runsheet, setRunsheet] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchEvents = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data } = await supabase.from('events').select('id, title').eq('organizer_id', user.id).order('start_date', { ascending: false })
      if (data && data.length > 0) {
        setEvents(data)
      }
    }
    fetchEvents()
  }, [supabase])

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      let eventIds = []
      if (selectedEventId !== 'all') {
        eventIds = [selectedEventId]
      } else {
        eventIds = events.map(e => e.id)
      }

      if (eventIds.length > 0) {
        // Fetch tasks
        const { data: tasksData } = await supabase
          .from('tasks')
          .select('*, events(title), profiles(full_name)')
          .in('event_id', eventIds)
          .order('due_date', { ascending: true })

        if (tasksData) setTasks(tasksData)

        // Fetch runsheet items
        const { data: runsheetData } = await supabase
          .from('runsheet_items')
          .select('*, events(title)')
          .in('event_id', eventIds)
          .order('start_time', { ascending: true })

        if (runsheetData) setRunsheet(runsheetData)
      } else {
        setTasks([])
        setRunsheet([])
      }
      setLoading(false)
    }

    if (events.length > 0 || selectedEventId !== 'all') {
      fetchData()
    }

    const channel = supabase.channel('tasks-updates')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tasks' }, fetchData)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'runsheet_items' }, fetchData)
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [selectedEventId, events, supabase])

  const toggleTaskStatus = async (taskId: string, currentStatus: string) => {
    const newStatus = currentStatus === 'completed' ? 'pending' : 'completed'
    // Optimistic update
    setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status: newStatus } : t))
    
    await supabase.from('tasks').update({ status: newStatus }).eq('id', taskId)
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Tasks & Runsheet</h1>
          <p className="text-sm text-muted-foreground mt-1">Manage to-dos and day-of timeline.</p>
        </div>
        <div className="flex gap-2">
          {events.length > 0 && (
            <Select value={selectedEventId} onValueChange={(val) => setSelectedEventId(val || '')}>
              <SelectTrigger className="w-48 bg-white">
                <SelectValue placeholder="All Events" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Events</SelectItem>
                {events.map(e => <SelectItem key={e.id} value={e.id}>{e.title}</SelectItem>)}
              </SelectContent>
            </Select>
          )}
          <Button><Plus className="w-4 h-4 mr-2" />Add Task</Button>
        </div>
      </div>

      <Tabs defaultValue="tasks">
        <TabsList>
          <TabsTrigger value="tasks">Tasks ({tasks.length})</TabsTrigger>
          <TabsTrigger value="runsheet">Runsheet ({runsheet.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="tasks" className="mt-5">
          <Card>
            <CardContent className="p-0 divide-y divide-border min-h-[200px]">
              {loading ? (
                <div className="p-8 text-center text-muted-foreground text-sm">Loading tasks...</div>
              ) : tasks.length === 0 ? (
                <div className="p-8 text-center text-muted-foreground text-sm">No tasks found. Create one to get started.</div>
              ) : tasks.map((task, i) => (
                <motion.div
                  key={task.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.2, delay: i * 0.03 }}
                  className={`flex items-start gap-3 p-4 transition-opacity ${task.status === 'completed' ? 'opacity-50' : ''}`}
                >
                  <Checkbox 
                    checked={task.status === 'completed'} 
                    onCheckedChange={() => toggleTaskStatus(task.id, task.status)}
                    className="mt-0.5" 
                  />
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-medium ${task.status === 'completed' ? 'line-through' : ''}`}>{task.title}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {(task.events as any)?.title} 
                      {task.profiles && ` · ${(task.profiles as any).full_name}`}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Badge variant="outline" className={`text-[10px] border-0 ${priorityStyle[task.priority] || priorityStyle['medium']}`}>
                      {task.priority || 'medium'}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {task.due_date ? new Date(task.due_date).toLocaleDateString() : 'No Date'}
                    </span>
                  </div>
                </motion.div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="runsheet" className="mt-5">
          <Card>
            <CardHeader><CardTitle className="text-base">Event Day Timeline</CardTitle></CardHeader>
            <CardContent className="min-h-[200px]">
              {loading ? (
                <div className="text-center text-muted-foreground text-sm py-8">Loading runsheet...</div>
              ) : runsheet.length === 0 ? (
                <div className="text-center text-muted-foreground text-sm py-8">No runsheet items found.</div>
              ) : (
                <div className="relative pl-6">
                  <div className="absolute left-[7px] top-0 bottom-0 w-px bg-border" />
                  {runsheet.map((item, i) => {
                    const time = new Date(item.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                    return (
                      <motion.div
                        key={item.id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.2, delay: i * 0.03 }}
                        className="flex items-start gap-4 py-3 relative"
                      >
                        <div className="absolute left-[-17px]">
                          {item.status === 'completed' ? (
                            <CheckCircle2 className="w-4 h-4 text-primary bg-white" />
                          ) : item.status === 'in_progress' ? (
                            <Clock className="w-4 h-4 text-primary animate-pulse bg-white rounded-full" />
                          ) : (
                            <Circle className="w-4 h-4 text-muted-foreground/30 bg-white" />
                          )}
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium">{item.title}</p>
                          <p className="text-xs text-muted-foreground">
                            {time} {selectedEventId === 'all' && ` · ${(item.events as any)?.title}`}
                          </p>
                        </div>
                      </motion.div>
                    )
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
