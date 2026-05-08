'use client'

import { useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { MessageSquare, Search, Mail, Calendar, Filter, Eye, ChevronDown, ChevronUp, Inbox, Phone } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

type ContactSubmission = {
  id: string
  name: string
  email: string
  phone: string | null
  event_type: string | null
  message: string
  status: string | null
  created_at: string
}

const eventTypeLabels: Record<string, string> = {
  wedding: 'Wedding',
  corporate: 'Corporate Event',
  other: 'Other',
}

export default function AdminInquiriesPage() {
  const [submissions, setSubmissions] = useState<ContactSubmission[]>([])
  const [loading, setLoading] = useState(true)
  const [query, setQuery] = useState('')
  const [typeFilter, setTypeFilter] = useState('all')
  const [expandedId, setExpandedId] = useState<string | null>(null)

  useEffect(() => {
    const fetchSubmissions = async () => {
      setLoading(true)
      try {
        const res = await fetch('/api/admin/contact-submissions')
        const result = await res.json()
        setSubmissions(result.submissions || [])
      } catch {
        // silent fail
      } finally {
        setLoading(false)
      }
    }
    fetchSubmissions()
  }, [])

  const filtered = useMemo(() => {
    return submissions.filter((s) => {
      const needle = query.toLowerCase()
      const text = `${s.name} ${s.email} ${s.message}`.toLowerCase()
      return (
        text.includes(needle) &&
        (typeFilter === 'all' || s.event_type === typeFilter)
      )
    })
  }, [query, typeFilter, submissions])

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr)
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="mb-3 inline-flex items-center gap-2 rounded-full border bg-white px-3 py-1 text-xs text-muted-foreground">
            <MessageSquare className="h-3.5 w-3.5 text-primary" />
            Contact Inquiries
          </div>
          <h1 className="text-3xl font-semibold">Inquiries</h1>
          <p className="mt-1 text-sm text-muted-foreground">Review contact form submissions from the landing page.</p>
        </div>
        <Badge variant="outline" className="self-start sm:self-auto text-sm px-3 py-1">
          {filtered.length} {filtered.length === 1 ? 'inquiry' : 'inquiries'}
        </Badge>
      </div>

      <Card>
        <CardContent className="p-4">
          <div className="grid gap-3 md:grid-cols-[1fr_180px]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search by name, email, or message..." className="pl-9" />
            </div>
            <Select value={typeFilter} onValueChange={(value) => setTypeFilter(value || 'all')}>
              <SelectTrigger>
                <Filter className="mr-2 h-4 w-4 text-muted-foreground" />
                <SelectValue placeholder="All Types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="wedding">Wedding</SelectItem>
                <SelectItem value="corporate">Corporate</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {loading ? (
        <div className="py-16 text-center text-sm text-muted-foreground">Loading inquiries…</div>
      ) : filtered.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10">
              <Inbox className="h-7 w-7 text-primary" />
            </div>
            <p className="text-sm text-muted-foreground">No inquiries found.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filtered.map((submission, index) => (
            <motion.div
              key={submission.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.03 }}
            >
              <Card className="overflow-hidden transition-all hover:shadow-md hover:shadow-black/[0.04]">
                <CardContent className="p-0">
                  <button
                    className="w-full text-left p-5 focus:outline-none"
                    onClick={() => setExpandedId(expandedId === submission.id ? null : submission.id)}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-3 mb-1.5">
                          <h3 className="font-semibold text-sm truncate">{submission.name}</h3>
                          {submission.event_type && (
                            <Badge variant="outline" className="text-[10px] shrink-0">
                              {eventTypeLabels[submission.event_type] || submission.event_type}
                            </Badge>
                          )}
                        </div>
                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-muted-foreground">
                          <span className="inline-flex items-center gap-1.5">
                            <Mail className="h-3 w-3" />
                            {submission.email}
                          </span>
                          {submission.phone && (
                            <span className="inline-flex items-center gap-1.5">
                              <Phone className="h-3 w-3" />
                              {submission.phone}
                            </span>
                          )}
                          <span className="inline-flex items-center gap-1.5">
                            <Calendar className="h-3 w-3" />
                            {formatDate(submission.created_at)}
                          </span>
                        </div>
                      </div>
                      <div className="shrink-0 text-muted-foreground">
                        {expandedId === submission.id ? (
                          <ChevronUp className="h-4 w-4" />
                        ) : (
                          <ChevronDown className="h-4 w-4" />
                        )}
                      </div>
                    </div>
                  </button>

                  {expandedId === submission.id && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      transition={{ duration: 0.2 }}
                      className="border-t border-border/70"
                    >
                      <div className="p-5 pt-4">
                        <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-2">Message</p>
                        <p className="text-sm leading-relaxed whitespace-pre-wrap">{submission.message}</p>
                        <div className="mt-4 flex gap-2">
                          <Button size="sm" variant="outline" asChild>
                            <a href={`mailto:${submission.email}?subject=Re: Your Addis Events Inquiry`}>
                              <Mail className="mr-2 h-3.5 w-3.5" />
                              Reply via Email
                            </a>
                          </Button>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  )
}
