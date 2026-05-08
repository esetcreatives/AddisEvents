'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Store, Plus, Search, Star, Phone } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { createClient } from '@/lib/supabase/client'

export default function VendorsPage() {
  const supabase = createClient()
  const [vendors, setVendors] = useState<any[]>([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchVendors = async () => {
      setLoading(true)
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data } = await supabase
        .from('vendors')
        .select('*')
        .eq('organizer_id', user.id)
        .order('name', { ascending: true })

      if (data) setVendors(data)
      setLoading(false)
    }

    fetchVendors()

    const channel = supabase.channel('vendors-updates')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'vendors' }, fetchVendors)
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [supabase])

  const filteredVendors = vendors.filter(v => 
    v.name.toLowerCase().includes(search.toLowerCase()) || 
    v.category.toLowerCase().includes(search.toLowerCase())
  )

  const handleAddVendor = async () => {
    const name = prompt("Enter vendor name:")
    if (!name) return
    const { data: { user } } = await supabase.auth.getUser()
    await supabase.from('vendors').insert({
      organizer_id: user?.id,
      name,
      category: 'other',
      rating: 5
    })
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Vendors</h1>
          <p className="text-sm text-muted-foreground mt-1">Your vendor directory.</p>
        </div>
        <Button onClick={handleAddVendor}><Plus className="w-4 h-4 mr-2" />Add Vendor</Button>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input 
          placeholder="Search vendors..." 
          className="pl-10" 
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {loading ? (
        <div className="text-center py-10 text-muted-foreground">Loading vendors...</div>
      ) : filteredVendors.length === 0 ? (
        <div className="text-center py-10 border-2 border-dashed border-border rounded-xl">
          <Store className="w-10 h-10 text-muted-foreground/30 mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">No vendors found.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filteredVendors.map((vendor, i) => (
            <motion.div key={vendor.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: i * 0.04 }}>
              <Card className="hover:shadow-md transition-shadow h-full">
                <CardContent className="p-5">
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="font-semibold text-sm">{vendor.name}</h3>
                    <Badge variant="outline" className="text-[10px] capitalize">{vendor.category}</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mb-3">{vendor.contact_name || 'No Contact Person'}</p>
                  <div className="flex items-center gap-0.5 mb-2">
                    {Array.from({ length: 5 }).map((_, idx) => (
                      <Star key={idx} className={`w-3 h-3 ${idx < (vendor.rating || 0) ? 'text-primary fill-primary' : 'text-muted-foreground/20'}`} />
                    ))}
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Phone className="w-3 h-3" />{vendor.contact_phone || 'N/A'}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  )
}
