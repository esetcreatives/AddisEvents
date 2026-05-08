MASTER PROMPT: ACTORS & RBAC SYSTEM FOR ADDIS EVENTS
PROJECT CONTEXT
Addis Events is an event management platform for corporate events and weddings in Addis Ababa, Ethiopia. Built with Next.js 14, Supabase, Tailwind CSS, and full i18n (English/Amharic). This is a portfolio/showcase project designed to be pitched to real event organizer companies.

SYSTEM ACTORS (5 ROLES)
1. ORGANIZER (Admin - Full Access)
Definition: The event organizing company staff who owns and operates the Addis Events platform. This is the business owner and their team members.
Business Example: You work at "Flawless Events Addis" and use this platform to manage all client events.
Authentication:

Email/password login via Supabase Auth
Role: organizer
Has organization_id (can be multi-tenant later)

Access Level: FULL SYSTEM ACCESS

2. CLIENT (Limited Partner Access)
Definition: The paying customer who hired the organizer to plan their event. For weddings: bride/groom/family. For corporate: company's marketing manager or event coordinator.
Business Example: "Ethio Telecom" hired you to organize their product launch. Their marketing manager gets client portal access to track progress without constant phone calls.
Authentication:

Email/password login via Supabase Auth
Role: client
Linked to specific event(s) via event_access table

Access Level: READ-MOSTLY, LIMITED WRITE (their event only)

3. STAFF (Check-in Only)
Definition: Check-in operator at the venue door on event day. Could be organizer's junior staff, venue staff, or temporary help.
Business Example: You hire 2 people to work the registration desk at a wedding. They need check-in access only — no access to budgets, vendor contracts, or other events.
Authentication:

PIN or simple password
Role: staff
Linked to specific event via event_access table
Mobile-first interface

Access Level: CHECK-IN SCREEN ONLY (assigned event)

4. GUEST (No Login - Token-Based)
Definition: Person invited to the event. Wedding guest, conference attendee, product launch invitee.
Business Example: Someone invited to Selam & Dawit's wedding. They click the RSVP link in their email, confirm attendance, and show QR code at the event.
Authentication:

NO LOGIN, NO ACCOUNT
Uses unique token URL: addisevents.com/rsvp/[unique-token]
Token stored in guests table: rsvp_token field

Access Level: RSVP FORM ONLY (their invite)

5. PUBLIC (No Login - Browser)
Definition: Random person who found the event microsite (for public events only, like concerts or conferences).
Business Example: Ethio Telecom's product launch is public. Someone sees a Facebook ad, clicks through to the event page, buys a ticket.
Authentication:

NO LOGIN
Accesses public event microsites only

Access Level: VIEW PUBLIC EVENTS, BUY TICKETS

ROLE-BASED ACCESS CONTROL (RBAC) MATRIX
Feature/CapabilityOrganizerClientStaffGuestPublicAUTHENTICATIONLogin Required✅✅✅ PIN❌❌DASHBOARD & EVENTSView Dashboard (all events)✅❌❌❌❌View Single Event Dashboard✅✅ (assigned)❌❌❌Create Event✅❌❌❌❌Edit Event Details✅❌❌❌❌Delete Event✅❌❌❌❌Change Event Status✅❌❌❌❌GUEST MANAGEMENTView Full Guest List✅✅ names only❌❌❌View Guest Contact Info✅❌ privacy❌❌❌Add/Remove Guests✅❌❌❌❌Import Guests (CSV)✅❌❌❌❌Export Guest List✅✅ names only❌❌❌RSVP SYSTEMSend Invitations✅❌❌❌❌Send Reminders✅❌❌❌❌View RSVP Responses✅ full✅ count only❌❌❌Fill RSVP Form❌❌❌✅✅ public eventsChange RSVP❌❌❌✅✅SEATINGView Seating Chart✅✅❌❌❌Edit Seating Chart✅❌❌❌❌Export Seating PDF✅✅❌❌❌CHECK-INAccess Check-in Screen✅❌✅ assigned event❌❌Scan QR Codes✅❌✅❌❌Manual Check-in✅❌✅❌❌View Live Check-in Count✅✅❌❌❌Add Walk-in Guests✅❌✅ if enabled❌❌VENDORSView Vendor List✅✅ assigned❌❌❌Add/Edit Vendors✅❌❌❌❌Assign Vendors to Event✅❌❌❌❌Approve/Reject Vendors❌✅❌❌❌TASKS & RUNSHEETView Tasks✅✅❌❌❌Create/Edit Tasks✅❌❌❌❌Mark Tasks Complete✅❌❌❌❌View/Export Runsheet✅✅❌❌❌TICKETING & PAYMENTSCreate Ticket Tiers✅❌❌❌❌Create Promo Codes✅❌❌❌❌View Ticket Sales✅✅ their event❌❌❌Buy Tickets❌❌❌✅✅ANALYTICS & REPORTSView Analytics Dashboard✅✅ basic❌❌❌View Revenue Data✅✅ their event❌❌❌Export Reports (PDF/Excel)✅✅ limited❌❌❌FILES & ASSETSUpload Files✅✅❌❌❌View Uploaded Files✅✅❌❌❌Delete Files✅❌❌❌❌EVENT MICROSITEView Event Microsite✅✅✅✅✅ public onlyEdit Microsite✅❌❌❌❌SETTINGS & ADMINInvite Clients✅❌❌❌❌Invite Staff✅❌❌❌❌Organization Settings✅❌❌❌❌Billing Settings✅❌❌❌❌

ROUTE STRUCTURE & ACCESS CONTROL
PUBLIC ROUTES (No Auth)
/ - Landing page (PUBLIC)
/events/[slug] - Event microsite (PUBLIC if event is public, TOKEN if private)
/rsvp/[token] - RSVP form (GUEST via unique token)
/events/[slug]/tickets - Ticket purchase (PUBLIC for public events)
ORGANIZER ROUTES (Auth: organizer role)
/dashboard - All events overview
/dashboard/events/new - Create event
/dashboard/events/[id] - Event detail
/dashboard/events/[id]/guests - Guest management
/dashboard/events/[id]/seating - Seating chart
/dashboard/events/[id]/vendors - Vendor management
/dashboard/events/[id]/tasks - Tasks & runsheet
/dashboard/events/[id]/checkin - Live check-in monitor
/dashboard/events/[id]/analytics - Reports & analytics
/dashboard/events/[id]/settings - Event settings
/dashboard/vendors - Global vendor directory
/dashboard/clients - Client management
/dashboard/settings - Organization settings
CLIENT ROUTES (Auth: client role + event_access check)
/portal - Client dashboard (shows only assigned events)
/portal/[eventId] - Event overview
/portal/[eventId]/guests - Guest count & names
/portal/[eventId]/vendors - Vendor list with approve/reject
/portal/[eventId]/tasks - Read-only task view
/portal/[eventId]/uploads - Upload assets
STAFF ROUTES (Auth: staff role + event_access check)
/checkin/[eventId] - Check-in screen (mobile-first, assigned event only)

DATABASE SCHEMA (RBAC Implementation)
users table
sqlCREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT UNIQUE NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('organizer', 'client', 'staff')),
  organization_id UUID REFERENCES organizations(id),
  full_name TEXT,
  phone TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
organizations table
sqlCREATE TABLE organizations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  logo_url TEXT,
  contact_email TEXT,
  contact_phone TEXT,
  address TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
event_access table (Scopes Client & Staff to specific events)
sqlCREATE TABLE event_access (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  event_id UUID REFERENCES events(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('client', 'staff')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, event_id)
);
guests table
sqlCREATE TABLE guests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id UUID REFERENCES events(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  rsvp_token TEXT UNIQUE NOT NULL, -- For link-only RSVP access
  rsvp_status TEXT DEFAULT 'not_invited' CHECK (rsvp_status IN ('not_invited', 'invited', 'confirmed', 'declined')),
  checkin_status TEXT DEFAULT 'not_checked_in' CHECK (checkin_status IN ('not_checked_in', 'checked_in')),
  checkin_timestamp TIMESTAMPTZ,
  qr_code TEXT, -- Generated after RSVP confirmation
  guest_type TEXT DEFAULT 'general' CHECK (guest_type IN ('vip', 'general', 'speaker', 'staff')),
  seat_assignment TEXT, -- e.g., "Table 5, Seat 3"
  meal_preference TEXT,
  dietary_restrictions TEXT,
  plus_one BOOLEAN DEFAULT FALSE,
  plus_one_name TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for fast RSVP token lookup
CREATE INDEX idx_guests_rsvp_token ON guests(rsvp_token);
CREATE INDEX idx_guests_event_id ON guests(event_id);

ROW-LEVEL SECURITY (RLS) POLICIES
Events Table
sql-- Organizers can see all events in their organization
CREATE POLICY "organizers_view_org_events"
ON events FOR SELECT
USING (
  organization_id IN (
    SELECT organization_id FROM users 
    WHERE id = auth.uid() AND role = 'organizer'
  )
);

-- Clients can only see events they're assigned to
CREATE POLICY "clients_view_assigned_events"
ON events FOR SELECT
USING (
  id IN (
    SELECT event_id FROM event_access 
    WHERE user_id = auth.uid() AND role = 'client'
  )
);

-- Only organizers can insert/update/delete events
CREATE POLICY "organizers_manage_events"
ON events FOR ALL
USING (
  organization_id IN (
    SELECT organization_id FROM users 
    WHERE id = auth.uid() AND role = 'organizer'
  )
);
Guests Table
sql-- Organizers can see all guests for their org's events
CREATE POLICY "organizers_view_guests"
ON guests FOR SELECT
USING (
  event_id IN (
    SELECT id FROM events 
    WHERE organization_id IN (
      SELECT organization_id FROM users 
      WHERE id = auth.uid() AND role = 'organizer'
    )
  )
);

-- Clients can see guest names (but not contact info) for their events
CREATE POLICY "clients_view_guest_names"
ON guests FOR SELECT
USING (
  event_id IN (
    SELECT event_id FROM event_access 
    WHERE user_id = auth.uid() AND role = 'client'
  )
);

-- Staff can ONLY update checkin_status for their assigned event
CREATE POLICY "staff_checkin_guests"
ON guests FOR UPDATE
USING (
  event_id IN (
    SELECT event_id FROM event_access 
    WHERE user_id = auth.uid() AND role = 'staff'
  )
)
WITH CHECK (
  -- Only allow updating checkin fields
  (checkin_status IS DISTINCT FROM checkin_status OR
   checkin_timestamp IS DISTINCT FROM checkin_timestamp)
);

-- Organizers can insert/update/delete guests
CREATE POLICY "organizers_manage_guests"
ON guests FOR ALL
USING (
  event_id IN (
    SELECT id FROM events 
    WHERE organization_id IN (
      SELECT organization_id FROM users 
      WHERE id = auth.uid() AND role = 'organizer'
    )
  )
);

MIDDLEWARE AUTH CHECKS (Next.js)
/middleware.ts
typescriptimport { createMiddlewareClient } from '@supabase/auth-helpers-nextjs';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(req: NextRequest) {
  const res = NextResponse.next();
  const supabase = createMiddlewareClient({ req, res });
  const { data: { session } } = await supabase.auth.getSession();

  // Organizer routes
  if (req.nextUrl.pathname.startsWith('/dashboard')) {
    if (!session) {
      return NextResponse.redirect(new URL('/login', req.url));
    }
    
    const { data: user } = await supabase
      .from('users')
      .select('role')
      .eq('id', session.user.id)
      .single();
    
    if (user?.role !== 'organizer') {
      return NextResponse.redirect(new URL('/unauthorized', req.url));
    }
  }

  // Client portal routes
  if (req.nextUrl.pathname.startsWith('/portal')) {
    if (!session) {
      return NextResponse.redirect(new URL('/login', req.url));
    }
    
    const { data: user } = await supabase
      .from('users')
      .select('role')
      .eq('id', session.user.id)
      .single();
    
    if (user?.role !== 'client') {
      return NextResponse.redirect(new URL('/unauthorized', req.url));
    }
  }

  // Staff check-in routes
  if (req.nextUrl.pathname.startsWith('/checkin')) {
    if (!session) {
      return NextResponse.redirect(new URL('/login', req.url));
    }
    
    const { data: user } = await supabase
      .from('users')
      .select('role')
      .eq('id', session.user.id)
      .single();
    
    if (user?.role !== 'staff' && user?.role !== 'organizer') {
      return NextResponse.redirect(new URL('/unauthorized', req.url));
    }
    
    // Additional check: staff can only access their assigned event
    if (user?.role === 'staff') {
      const eventId = req.nextUrl.pathname.split('/')[2];
      const { data: access } = await supabase
        .from('event_access')
        .select('id')
        .eq('user_id', session.user.id)
        .eq('event_id', eventId)
        .eq('role', 'staff')
        .single();
      
      if (!access) {
        return NextResponse.redirect(new URL('/unauthorized', req.url));
      }
    }
  }

  return res;
}

export const config = {
  matcher: ['/dashboard/:path*', '/portal/:path*', '/checkin/:path*']
};

API ROUTE EXAMPLES
/app/api/events/[id]/guests/route.ts (GET - Fetch Guests)
typescriptimport { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const supabase = createRouteHandlerClient({ cookies });
  const { data: { session } } = await supabase.auth.getSession();

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { data: user } = await supabase
    .from('users')
    .select('role, organization_id')
    .eq('id', session.user.id)
    .single();

  // Organizer: Full guest data
  if (user?.role === 'organizer') {
    const { data: guests, error } = await supabase
      .from('guests')
      .select('*')
      .eq('event_id', params.id);

    return NextResponse.json({ guests });
  }

  // Client: Names only, no contact info
  if (user?.role === 'client') {
    // Verify client has access to this event
    const { data: access } = await supabase
      .from('event_access')
      .select('id')
      .eq('user_id', session.user.id)
      .eq('event_id', params.id)
      .eq('role', 'client')
      .single();

    if (!access) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { data: guests } = await supabase
      .from('guests')
      .select('id, full_name, rsvp_status, checkin_status, seat_assignment')
      .eq('event_id', params.id);

    return NextResponse.json({ guests });
  }

  return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
}

COMPONENT-LEVEL PERMISSIONS
Example: Guest List Component
typescript// /components/GuestList.tsx
'use client';

import { useUser } from '@/hooks/useUser';

export function GuestList({ guests }: { guests: Guest[] }) {
  const { user, role } = useUser();

  return (
    <table>
      <thead>
        <tr>
          <th>Name</th>
          {role === 'organizer' && <th>Email</th>}
          {role === 'organizer' && <th>Phone</th>}
          <th>Status</th>
          <th>Seat</th>
        </tr>
      </thead>
      <tbody>
        {guests.map((guest) => (
          <tr key={guest.id}>
            <td>{guest.full_name}</td>
            {role === 'organizer' && <td>{guest.email}</td>}
            {role === 'organizer' && <td>{guest.phone}</td>}
            <td>{guest.rsvp_status}</td>
            <td>{guest.seat_assignment}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

KEY RBAC PRINCIPLES

Principle of Least Privilege: Each role gets ONLY what they need. Staff doesn't need guest contact info. Clients don't need vendor pricing.
Defense in Depth:

Middleware blocks unauthorized routes
RLS policies block unauthorized database queries
API routes double-check permissions
Components hide UI elements based on role


Token-Based Guest Access: Guests don't need accounts. Unique RSVP tokens (UUID) provide secure, frictionless access.
Event-Scoped Access: Clients and Staff are linked to specific events via event_access table. They can't see other events.
Organization-Scoped Data: All organizers in the same organization share events (multi-tenant ready for future).


IMPLEMENTATION CHECKLIST

 Create users, organizations, event_access tables
 Set up Supabase Auth with email/password
 Implement RLS policies on all tables
 Create Next.js middleware for route protection
 Build role-specific layouts: /dashboard, /portal, /checkin
 Create API routes with role checks
 Generate unique RSVP tokens on guest creation
 Build check-in screen with staff-only access
 Test each role's access boundaries
 Add role-based UI hiding in components
 Implement client portal with event-scoped queries
 Add staff PIN login flow for check-in


END OF MASTER PROMPT
This document defines the complete RBAC system for Addis Events. All development should reference this for role-based access decisions.