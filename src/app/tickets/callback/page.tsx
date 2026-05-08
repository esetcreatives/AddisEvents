'use client'

import { useEffect, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { CheckCircle2, XCircle, Download, Calendar, MapPin } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

import { Suspense } from 'react'

type TicketDetails = {
  ticket_number: string
  metadata?: {
    name?: string
  } | null
  events: {
    title: string
    start_date: string
    venue_name?: string | null
  }
  ticket_tiers: {
    name: string
  }
}

function PaymentCallbackContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const tx_ref = searchParams.get('tx_ref')
  
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>(tx_ref ? 'loading' : 'error')
  const [ticket, setTicket] = useState<TicketDetails | null>(null)

  useEffect(() => {
    if (!tx_ref) {
      return
    }

    const verify = async () => {
      const response = await fetch(`/api/tickets/verify?tx_ref=${encodeURIComponent(tx_ref)}`)
      const result = await response.json()

      if (!response.ok || !result.ticket) {
        setStatus('error')
      } else {
        setTicket(result.ticket as TicketDetails)
        setStatus('success')
      }
    }

    verify().catch(() => setStatus('error'))
  }, [tx_ref])

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FAFAF9]">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">Verifying your payment...</p>
        </div>
      </div>
    )
  }

  if (status === 'error') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FAFAF9] p-4">
        <Card className="max-w-md w-full text-center">
          <CardContent className="pt-10 pb-10">
            <XCircle className="w-16 h-16 text-red-500 mx-auto mb-6" />
            <h1 className="text-2xl font-bold mb-2">Payment Failed</h1>
            <p className="text-muted-foreground mb-8">We couldn&apos;t verify your payment. If you were charged, please contact support.</p>
            <Button onClick={() => router.push('/')} className="w-full">Back to Home</Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#FAFAF9] py-12 px-4">
      <div className="max-w-xl mx-auto">
        <div className="text-center mb-10">
          <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto mb-4" />
          <h1 className="text-3xl font-bold">Payment Successful!</h1>
          <p className="text-muted-foreground mt-2">Your ticket is ready. We&apos;ve also sent a copy to your email.</p>
        </div>

        <Card className="overflow-hidden border-0 shadow-2xl relative">
          <div className="h-3 bg-primary w-full"></div>
          <CardHeader className="bg-white border-b border-dashed p-6">
            <div className="flex justify-between items-start">
              <div>
                <CardTitle className="text-2xl">{ticket?.events.title}</CardTitle>
                <div className="flex items-center gap-4 mt-3 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1.5">
                    <Calendar className="w-4 h-4" />
                    {ticket ? new Date(ticket.events.start_date).toLocaleDateString() : ''}
                  </div>
                  <div className="flex items-center gap-1.5">
                    <MapPin className="w-4 h-4" />
                    {ticket?.events.venue_name}
                  </div>
                </div>
              </div>
              <div className="bg-primary/10 text-primary px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
                {ticket?.ticket_tiers.name}
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0 bg-white">
            <div className="p-8 flex flex-col items-center border-b border-dashed">
              <div className="bg-white p-4 rounded-xl border-2 border-muted mb-4">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img 
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(ticket?.ticket_number || '')}`} 
                  alt="Ticket QR Code"
                  className="w-48 h-48"
                />
              </div>
              <p className="font-mono text-sm tracking-widest text-muted-foreground uppercase">{ticket?.ticket_number}</p>
            </div>
            <div className="p-6 bg-muted/30 flex justify-between items-center">
              <div className="text-sm">
                <p className="text-muted-foreground uppercase text-[10px] font-bold tracking-widest">Guest</p>
                <p className="font-semibold">{ticket?.metadata?.name || 'Valued Guest'}</p>
              </div>
              <Button variant="outline" size="sm" onClick={() => window.print()}>
                <Download className="w-4 h-4 mr-2" /> Download PDF
              </Button>
            </div>
          </CardContent>
        </Card>

        <div className="mt-8 text-center">
          <Button variant="link" onClick={() => router.push('/')} className="text-muted-foreground">
            Return to Addis Events
          </Button>
        </div>
      </div>

      <style jsx global>{`
        @media print {
          body { background: white; }
          button, .text-muted-foreground { display: none !important; }
          .Card { shadow: none !important; border: 1px solid #eee !important; }
        }
      `}</style>
    </div>
  )
}

export default function PaymentCallback() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-[#FAFAF9]">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    }>
      <PaymentCallbackContent />
    </Suspense>
  )
}
