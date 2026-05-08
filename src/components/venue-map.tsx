'use client'

import { MapPin, Navigation } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface VenueMapProps {
  address: string
  venueName?: string
  className?: string
}

export function VenueMap({ address, venueName, className = '' }: VenueMapProps) {
  if (!address) return null

  const encodedAddress = encodeURIComponent(address)
  const mapUrl = `https://www.google.com/maps/embed/v1/place?key=YOUR_GOOGLE_MAPS_API_KEY&q=${encodedAddress}`
  
  // Using a cleaner approach for now: a link to google maps if key is missing, 
  // but I'll provide the iframe structure.
  // Since I don't have a real key, I'll use the search URL which is often more reliable for open embeds
  const searchUrl = `https://www.google.com/maps?q=${encodedAddress}&output=embed`
  const directionsUrl = `https://www.google.com/maps/dir/?api=1&destination=${encodedAddress}`

  return (
    <div className={`space-y-3 ${className}`}>
      <div className="relative rounded-2xl overflow-hidden border border-border bg-muted aspect-video shadow-inner group">
        <iframe
          title="Venue Location"
          width="100%"
          height="100%"
          style={{ border: 0 }}
          loading="lazy"
          allowFullScreen
          src={searchUrl}
          className="grayscale-[0.2] contrast-[1.1] brightness-[1.05]"
        ></iframe>
        
        <div className="absolute bottom-4 right-4 transition-transform group-hover:scale-105">
          <a href={directionsUrl} target="_blank" rel="noopener noreferrer">
            <Button size="sm" className="gap-2 shadow-xl bg-white text-black hover:bg-white/90">
              <Navigation className="w-4 h-4" />
              Get Directions
            </Button>
          </a>
        </div>
      </div>
      
      <div className="flex items-start gap-2 text-sm text-muted-foreground">
        <MapPin className="w-4 h-4 mt-0.5 shrink-0 text-primary" />
        <div>
          <p className="font-semibold text-foreground">{venueName || 'Venue Location'}</p>
          <p className="text-xs">{address}</p>
        </div>
      </div>
    </div>
  )
}
