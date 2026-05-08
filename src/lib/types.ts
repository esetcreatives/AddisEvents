// ============================================
// Database Types for Addis Events
// ============================================

export type UserRole = 'organizer' | 'client' | 'staff'

export type EventType = 'wedding' | 'corporate'

export type EventStatus = 'draft' | 'published' | 'live' | 'completed'

export type RSVPStatus = 'pending' | 'confirmed' | 'declined' | 'maybe'

export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent'

export type TaskStatus = 'pending' | 'in_progress' | 'completed'

export type PaymentStatus = 'pending' | 'verified' | 'failed' | 'refunded'

export type VendorCategory =
  | 'caterer'
  | 'decorator'
  | 'av'
  | 'venue'
  | 'photographer'
  | 'videographer'
  | 'florist'
  | 'entertainment'
  | 'transportation'
  | 'other'

export type CheckinMethod = 'qr' | 'manual' | 'name_search'

export type TableShape = 'round' | 'rectangular'

// ============================================
// Table Row Types
// ============================================

export interface Profile {
  id: string
  email: string
  full_name: string | null
  phone: string | null
  role: UserRole
  avatar_url: string | null
  company: string | null
  created_at: string
  updated_at: string
}

export interface Event {
  id: string
  organizer_id: string
  client_id: string | null
  title: string
  slug: string
  description: string | null
  event_type: EventType
  status: EventStatus
  venue_name: string | null
  venue_address: string | null
  venue_lat: number | null
  venue_lng: number | null
  start_date: string
  end_date: string
  capacity: number
  cover_image: string | null
  theme_color: string
  is_ticketed: boolean
  agenda: AgendaItem[]
  created_at: string
  updated_at: string
}

export interface AgendaItem {
  time: string
  title: string
  description?: string
  speaker?: string
}

export interface Guest {
  id: string
  event_id: string
  full_name: string
  email: string | null
  phone: string | null
  group_name: string | null
  plus_one: boolean
  plus_one_name: string | null
  notes: string | null
  table_number: number | null
  seat_number: number | null
  created_at: string
  updated_at: string
}

export interface RSVPQuestion {
  id: string
  event_id: string
  question_text: string
  question_type: 'text' | 'select' | 'multiselect' | 'boolean'
  options: string[] | null
  is_required: boolean
  sort_order: number
  created_at: string
}

export interface RSVPResponse {
  id: string
  event_id: string
  guest_id: string | null
  respondent_name: string
  respondent_email: string | null
  respondent_phone: string | null
  status: RSVPStatus
  plus_one: boolean
  plus_one_name: string | null
  meal_preference: string | null
  dietary_restrictions: string | null
  custom_answers: Record<string, unknown>
  qr_code: string | null
  responded_at: string
  created_at: string
}

export interface Checkin {
  id: string
  event_id: string
  guest_id: string | null
  rsvp_id: string | null
  checked_in_by: string | null
  checked_in_at: string
  method: CheckinMethod
}

export interface SeatingTable {
  id: string
  event_id: string
  table_name: string
  table_shape: TableShape
  capacity: number
  position_x: number
  position_y: number
  created_at: string
}

export interface SeatAssignment {
  id: string
  table_id: string
  guest_id: string
  seat_number: number
  created_at: string
}

export interface TicketTier {
  id: string
  event_id: string
  name: string
  description: string | null
  price: number
  currency: string
  quantity: number
  sold: number
  sort_order: number
  created_at: string
}

export interface Ticket {
  id: string
  event_id: string
  tier_id: string
  buyer_name: string
  buyer_email: string
  buyer_phone: string | null
  payment_status: PaymentStatus
  payment_reference: string | null
  qr_code: string | null
  ticket_number: string | null
  created_at: string
}

export interface PromoCode {
  id: string
  event_id: string
  code: string
  discount_type: 'percentage' | 'fixed'
  discount_value: number
  max_uses: number | null
  times_used: number
  expires_at: string | null
  is_active: boolean
  created_at: string
}

export interface Vendor {
  id: string
  organizer_id: string
  name: string
  category: VendorCategory
  contact_name: string | null
  contact_email: string | null
  contact_phone: string | null
  address: string | null
  notes: string | null
  rating: number | null
  created_at: string
  updated_at: string
}

export interface EventVendor {
  id: string
  event_id: string
  vendor_id: string
  role_description: string | null
  agreed_price: number | null
  status: 'pending' | 'confirmed' | 'cancelled'
  notes: string | null
  created_at: string
}

export interface Task {
  id: string
  event_id: string
  title: string
  description: string | null
  assigned_to: string | null
  status: TaskStatus
  priority: TaskPriority
  due_date: string | null
  completed_at: string | null
  created_at: string
  updated_at: string
}

export interface RunsheetItem {
  id: string
  event_id: string
  title: string
  description: string | null
  start_time: string
  end_time: string | null
  assigned_to: string | null
  location: string | null
  sort_order: number
  status: 'upcoming' | 'in_progress' | 'completed' | 'skipped'
  created_at: string
}

export interface ClientAsset {
  id: string
  event_id: string
  uploaded_by: string | null
  file_name: string
  file_url: string
  file_type: string | null
  file_size: number | null
  category: 'logo' | 'photo' | 'document' | 'general'
  created_at: string
}

export interface EmailLog {
  id: string
  event_id: string | null
  recipient_email: string
  subject: string
  template: string | null
  status: 'sent' | 'delivered' | 'bounced' | 'failed'
  sent_at: string
}
