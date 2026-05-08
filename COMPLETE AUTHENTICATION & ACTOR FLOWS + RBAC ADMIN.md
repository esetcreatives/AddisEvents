REVISED MASTER PROMPT: COMPLETE AUTHENTICATION & ACTOR FLOWS + RBAC ADMIN
AUTHENTICATION ARCHITECTURE REDESIGN
Core Authentication Strategy
Problem with original design: Too many different auth methods (email/password for some, PIN for others, token for guests) creates confusion and security gaps.
New unified approach:

Organizer & Client: Email/password with email verification
Staff: Email/password (simpler than PIN, more secure, still mobile-friendly)
Guest: Token-based (no account) - UNCHANGED
Super Admin: Email/password with 2FA


COMPLETE ACTOR FLOWS
ACTOR 1: SUPER ADMIN (New Role)
Who: Platform owner (you). Manages all organizations using Addis Events if this becomes a multi-tenant SaaS, or manages your single organization's settings.
Authentication Flow:
┌─────────────────────────────────────────────────────────────┐
│ SUPER ADMIN - FIRST TIME SETUP                              │
└─────────────────────────────────────────────────────────────┘

1. Visit: addisevents.com/admin/setup (one-time setup URL)
2. Checks if super admin exists in DB
3. If not exists:
   ├─ Form: Email, Password, Full Name
   ├─ Submit
   ├─ Creates user with role='super_admin'
   ├─ Sends verification email
   ├─ Email verified → Redirects to /admin/login
   └─ Setup URL becomes disabled

4. If exists:
   └─ Redirects to /admin/login


┌─────────────────────────────────────────────────────────────┐
│ SUPER ADMIN - LOGIN FLOW                                     │
└─────────────────────────────────────────────────────────────┘

1. Visit: addisevents.com/admin/login
2. Form: Email, Password
3. Submit
4. Supabase auth validates
5. Backend checks: role = 'super_admin'
6. If valid:
   ├─ Generate 2FA code (6 digits)
   ├─ Send to email
   ├─ Redirect to /admin/verify-2fa
   └─ User enters 6-digit code
7. If 2FA valid:
   ├─ Set session cookie
   ├─ Redirect to /admin/dashboard
   └─ SUCCESS
8. If invalid:
   └─ Show error, allow retry (3 attempts max)
Dashboard Pages:
/admin/dashboard
├─ Overview: Total orgs, total events, total revenue
├─ Quick stats: Active events today, total RSVPs this week

/admin/organizations
├─ List all organizations
├─ Create new organization
├─ Edit organization details
├─ Suspend/activate organization
├─ View organization's events

/admin/users
├─ List all users (organizers, clients, staff)
├─ Filter by role, organization
├─ Manually create users
├─ Reset user passwords
├─ Deactivate accounts

/admin/events (global view)
├─ See ALL events across all organizations
├─ Filter by org, date, status
├─ View event details (read-only)

/admin/analytics
├─ Platform-wide analytics
├─ Revenue by organization
├─ Event trends
├─ User growth

/admin/settings
├─ Platform settings
├─ Email templates
├─ Payment gateway config
├─ Feature flags
└─ Super admin profile
Abilities:

✅ Full platform access
✅ Create/manage organizations
✅ View all events (read-only)
✅ Manage all users
✅ Access platform analytics
✅ Configure system settings
❌ Cannot directly edit events (that's organizer's job)
❌ Cannot RSVP or check-in guests


ACTOR 2: ORGANIZER (Enhanced Flow)
Authentication Flow:
┌─────────────────────────────────────────────────────────────┐
│ ORGANIZER - SIGNUP FLOW                                     │
└─────────────────────────────────────────────────────────────┘

Option A: Super Admin Creates Account
1. Super admin goes to /admin/users/new
2. Fills: Email, Full Name, Organization (dropdown)
3. Submits
4. System:
   ├─ Creates user with role='organizer'
   ├─ Generates temporary password
   ├─ Sends welcome email with login link
   └─ Email contains: "Welcome to Addis Events! Login: [link] | Temp Password: [password]"
5. Organizer receives email
6. Clicks login link → /login
7. Enters email + temp password
8. System forces password change
9. Sets new password
10. Email verification sent
11. Verifies email
12. Redirects to /dashboard

Option B: Self-Signup (if enabled in platform settings)
1. Visit: addisevents.com/signup
2. Form: 
   ├─ Organization Name
   ├─ Your Full Name
   ├─ Email
   ├─ Phone
   ├─ Password
   └─ Confirm Password
3. Submit
4. System:
   ├─ Creates organization
   ├─ Creates user with role='organizer'
   ├─ Links user to new organization
   ├─ Sends verification email
   └─ Redirects to /verify-email page
5. User clicks verification link in email
6. Redirects to /login
7. Login successful → /dashboard


┌─────────────────────────────────────────────────────────────┐
│ ORGANIZER - LOGIN FLOW                                      │
└─────────────────────────────────────────────────────────────┘

1. Visit: addisevents.com/login
2. Form: Email, Password
3. Optional: "Remember me" checkbox
4. Submit
5. Supabase validates credentials
6. Backend checks:
   ├─ Email verified? If no → Show "Please verify your email" + Resend button
   ├─ Role = 'organizer'? If no → Redirect to correct portal
   └─ Account active? If no → Show "Account suspended, contact admin"
7. If all checks pass:
   ├─ Create session
   ├─ Set auth cookie
   ├─ Redirect to /dashboard
   └─ SUCCESS

Password Reset:
1. Click "Forgot Password?" on login page
2. Enter email
3. Receive reset link via email
4. Click link → /reset-password?token=xyz
5. Enter new password
6. Submit → Password updated
7. Redirect to /login
Dashboard Navigation Flow:
/dashboard (Homepage)
├─ Header: Logo, Search events, Notifications, Profile dropdown
├─ Sidebar:
│  ├─ Dashboard (overview)
│  ├─ Events
│  ├─ Vendors
│  ├─ Clients
│  └─ Settings
├─ Main Content:
│  ├─ Quick Stats Cards:
│  │  ├─ Upcoming Events (3)
│  │  ├─ Total RSVPs This Week (247)
│  │  ├─ Events Today (1)
│  │  └─ Revenue This Month (45,000 ETB)
│  ├─ Calendar View (shows all events)
│  ├─ Recent Activity Feed
│  └─ Quick Actions: "+ New Event", "View All Events"

User clicks "+ New Event":
├─ Modal: "Create New Event"
├─ Select Event Type:
│  ├─ 🎊 Wedding
│  └─ 🏢 Corporate
├─ Clicks Wedding
├─ Redirects to /dashboard/events/new?type=wedding
└─ Shows wedding-specific form

User clicks existing event from calendar:
├─ Redirects to /dashboard/events/[id]
└─ Lands on Event Dashboard (tabs view)
Event Dashboard (Enhanced):
/dashboard/events/[id]

Tab Navigation:
├─ Overview
├─ Guests
├─ RSVP Page (preview + edit)
├─ Seating
├─ Vendors
├─ Tasks
├─ Check-in
├─ Analytics
└─ Settings

TAB: Overview
├─ Event banner image (full-width)
├─ Event Details Card:
│  ├─ Event Name (editable inline)
│  ├─ Date & Time
│  ├─ Venue (with map preview)
│  ├─ Status badge (Draft, Published, Live, Completed)
│  └─ Quick Edit button
├─ Stats Row:
│  ├─ Invited: 200
│  ├─ Confirmed: 156 (78%)
│  ├─ Declined: 12 (6%)
│  ├─ Pending: 32 (16%)
│  └─ Checked-in: 0
├─ Progress Chart (RSVP trend over time)
├─ Quick Actions:
│  ├─ Send Invitations
│  ├─ Send Reminders
│  ├─ View RSVP Page
│  └─ Export Guest List
└─ Recent Activity Log

TAB: Guests
├─ Toolbar:
│  ├─ Search bar
│  ├─ Filter dropdown (All, Confirmed, Declined, Pending, VIP)
│  ├─ "+ Add Guest" button
│  ├─ "Import CSV" button
│  └─ "Export" button
├─ Guest Table:
│  ├─ Checkbox (bulk select)
│  ├─ Name
│  ├─ Email
│  ├─ Phone
│  ├─ Status (badge)
│  ├─ Type (VIP/General)
│  ├─ Table Assignment
│  ├─ Check-in Status
│  └─ Actions (Edit, Delete, Resend Invite)
└─ Bulk Actions Bar (appears when guests selected):
   ├─ Send Invitations
   ├─ Send Reminders
   ├─ Change Guest Type
   └─ Delete

TAB: RSVP Page
├─ Live Preview (iframe or embedded view)
├─ "Edit Page" button → Opens RSVP page builder
└─ "Copy Link" button → Copies public RSVP URL

TAB: Seating
├─ Canvas Area (drag-and-drop)
├─ Left Sidebar:
│  ├─ Table Library:
│  │  ├─ Round (8 seats)
│  │  ├─ Round (10 seats)
│  │  ├─ Rectangular (12 seats)
│  │  └─ Head Table (6 seats)
│  └─ Unassigned Guests List (draggable)
├─ Top Toolbar:
│  ├─ Zoom controls
│  ├─ Undo/Redo
│  ├─ "Auto-assign" button (AI assigns based on guest type)
│  ├─ "Export PDF" button
│  └─ Save button
└─ Canvas shows floor plan with draggable tables

TAB: Vendors
(Similar to original spec)

TAB: Tasks
(Similar to original spec)

TAB: Check-in
├─ Live Stats (updates in real-time):
│  ├─ Checked-in: 87 / 156
│  ├─ No-shows: 12
│  └─ Walk-ins: 3
├─ Check-in Timeline (shows who checked in when)
├─ "Open Check-in Screen" button → Opens /checkin/[eventId] in new tab
└─ Manual Check-in Search (for organizer to check someone in remotely)

TAB: Analytics
(Similar to original spec)

TAB: Settings
├─ Event Details (name, date, venue)
├─ Event Privacy (Public/Private)
├─ RSVP Settings:
│  ├─ RSVP Deadline
│  ├─ Allow +1?
│  ├─ Require meal selection?
│  └─ Custom RSVP questions
├─ Check-in Settings:
│  ├─ Allow walk-ins?
│  ├─ Require QR code?
│  └─ Enable self-check-in kiosk?
├─ Notifications:
│  ├─ Send confirmation emails?
│  ├─ Send reminder emails?
│  └─ Reminder schedule
├─ Client Access:
│  ├─ Grant client portal access
│  └─ Invite client (email)
└─ Danger Zone:
   └─ Delete Event

ACTOR 3: CLIENT (Enhanced Flow)
Authentication Flow:
┌─────────────────────────────────────────────────────────────┐
│ CLIENT - INVITATION & SIGNUP FLOW                            │
└─────────────────────────────────────────────────────────────┘

1. Organizer goes to Event Settings → Client Access
2. Enters client's email: "marketing@ethiotelecom.com"
3. Clicks "Invite Client"
4. System:
   ├─ Creates user with role='client' (if doesn't exist)
   ├─ Creates event_access record (links client to this event)
   ├─ Generates secure invite token
   └─ Sends email: "You've been invited to track your event on Addis Events"
5. Client receives email with button: "Access Your Event"
6. Clicks button → /portal/accept-invite?token=xyz
7. Landing page:
   ├─ Shows event name: "Ethio Telecom Product Launch"
   ├─ "This event is being organized by Flawless Events Addis"
   └─ Form: 
      ├─ Full Name
      ├─ Password (if new user)
      └─ Confirm Password
8. Submit
9. If new user:
   ├─ Sets password
   ├─ Sends verification email
   ├─ User verifies email
   └─ Redirects to /portal/login
10. Login → /portal (client dashboard)


┌─────────────────────────────────────────────────────────────┐
│ CLIENT - LOGIN FLOW                                          │
└─────────────────────────────────────────────────────────────┘

1. Visit: addisevents.com/portal/login (separate URL from organizer login)
2. Form: Email, Password
3. Submit
4. Supabase validates
5. Backend checks:
   ├─ Email verified?
   ├─ Role = 'client'?
   └─ Has event_access to at least one event?
6. If valid:
   ├─ Create session
   └─ Redirect to /portal
7. If invalid role:
   └─ Show: "This is the client portal. Are you an event organizer? Login here"
Client Portal Navigation:
/portal

├─ Header: "Event Client Portal" | Notifications | Profile
├─ No Sidebar (simplified interface)
├─ Main Content:
│  ├─ Your Events Section:
│  │  └─ Event Cards (one card per assigned event):
│  │     ├─ Event banner image
│  │     ├─ Event name
│  │     ├─ Date & countdown
│  │     ├─ Venue
│  │     ├─ Progress bar: "156 / 200 confirmed"
│  │     └─ "View Event Details" button
│  └─ If only 1 event → Auto-redirects to /portal/events/[id]

User clicks "View Event Details":
└─ Redirects to /portal/events/[id]


/portal/events/[id]

Tab Navigation (simplified):
├─ Overview
├─ Guests
├─ Vendors
├─ Assets
└─ Reports

TAB: Overview
├─ Event Details (read-only):
│  ├─ Date, Time, Venue
│  └─ Public RSVP link (if event is public)
├─ RSVP Stats:
│  ├─ Total Invited: 200
│  ├─ Confirmed: 156
│  ├─ Declined: 12
│  ├─ Pending: 32
│  └─ Response Rate: 84%
├─ Progress Chart
└─ Upcoming Tasks (read-only, from organizer's task list)

TAB: Guests
├─ Search & Filter (by status)
├─ Guest Table (LIMITED columns):
│  ├─ Name
│  ├─ RSVP Status
│  ├─ Table Assignment
│  └─ Check-in Status (on event day)
├─ NO email/phone visible (privacy)
└─ "Export Guest List" button (names only)

TAB: Vendors
├─ Vendor Cards:
│  ├─ Vendor Name
│  ├─ Category (Catering, Decor, etc.)
│  ├─ Contact Info
│  ├─ Status: "Awaiting Your Approval" / "Confirmed" / "Pending"
│  └─ Actions:
│     ├─ "Approve" button (green)
│     └─ "Request Change" button (yellow)
├─ If client clicks "Approve":
│  ├─ Confirmation modal: "Approve [Vendor Name]?"
│  ├─ Confirm
│  ├─ Status → "Confirmed"
│  └─ Organizer gets notification
└─ If client clicks "Request Change":
   ├─ Modal: "What changes are needed?"
   ├─ Text area
   ├─ Submit
   └─ Organizer gets notification with feedback

TAB: Assets
├─ Upload Section:
│  ├─ Drag-and-drop area
│  ├─ "Upload Logo", "Upload Photos", "Upload Documents"
│  └─ File list (uploaded assets)
└─ Organizer's Message:
   └─ "Please upload your company logo and any theme photos"

TAB: Reports
├─ Export Buttons:
│  ├─ "Download Guest List (Excel)"
│  ├─ "Download RSVP Summary (PDF)"
│  └─ "Download Check-in Report (PDF)" (available after event)
└─ Analytics Summary (simplified version of organizer's analytics)

ACTOR 4: STAFF (Enhanced Flow)
Authentication Flow:
┌─────────────────────────────────────────────────────────────┐
│ STAFF - INVITATION & SIGNUP FLOW                             │
└─────────────────────────────────────────────────────────────┘

1. Organizer goes to Event Settings → Staff Access
2. Clicks "+ Add Staff Member"
3. Form:
   ├─ Email
   ├─ Full Name
   ├─ Phone
   └─ Event (dropdown, can assign to multiple events)
4. Submit
5. System:
   ├─ Creates user with role='staff' (if doesn't exist)
   ├─ Creates event_access records (for each assigned event)
   ├─ Generates temporary password
   └─ Sends email: "You've been assigned to check-in guests at [Event Name]"
6. Staff receives email:
   ├─ Event details
   ├─ Check-in URL: addisevents.com/checkin/[eventId]
   ├─ Login credentials: Email + Temp Password
   └─ Instructions: "Please change your password on first login"
7. Staff clicks check-in URL → /checkin/[eventId]
8. Sees login page (simplified, mobile-first)
9. Enters email + temp password
10. Forced to change password
11. Sets new password
12. Redirects to /checkin/[eventId]


┌─────────────────────────────────────────────────────────────┐
│ STAFF - LOGIN FLOW (Event Day)                               │
└─────────────────────────────────────────────────────────────┘

1. Staff opens phone/tablet
2. Opens bookmark or clicks email link: /checkin/[eventId]
3. If not logged in:
   ├─ Simplified login form:
   │  ├─ Email
   │  └─ Password
   ├─ "Remember me on this device" (checked by default)
   └─ Submit
4. Supabase validates
5. Backend checks:
   ├─ Role = 'staff' OR 'organizer'
   ├─ Has event_access to this specific eventId
   └─ Event is Live (date is today)
6. If valid:
   ├─ Create session
   └─ Load check-in interface
7. If already logged in (remembered):
   └─ Directly load check-in interface
Check-in Screen (Mobile-First UI):
/checkin/[eventId]

┌─────────────────────────────────────┐
│  [Event Logo]                       │
│  Selam & Dawit's Wedding            │
│  Check-in                           │
├─────────────────────────────────────┤
│                                     │
│  ┌─────────────────────────────┐   │
│  │  👥 87 / 156 Checked In     │   │
│  │  🚶 12 No-shows             │   │
│  └─────────────────────────────┘   │
│                                     │
│  [ 📷 Scan QR Code ]  (BIG BUTTON) │
│                                     │
│  ────────── OR ──────────          │
│                                     │
│  🔍 Search by name:                │
│  ┌──────────────────────────────┐  │
│  │ [Search...]                  │  │
│  └──────────────────────────────┘  │
│                                     │
└─────────────────────────────────────┘

User taps "Scan QR Code":
├─ Camera activates (full-screen)
├─ Overlay shows targeting box: "Point at guest's QR code"
├─ QR detected
├─ Instant feedback:
│  ├─ Screen flashes green
│  ├─ Shows guest details:
│  │  ├─ ✓ Abebe Kebede
│  │  ├─ Table 5, Seat 3
│  │  └─ VIP Guest
│  ├─ Success sound (optional)
│  └─ Auto-dismisses after 2 seconds
└─ Returns to scan mode (ready for next guest)

If QR already used:
├─ Screen flashes red
├─ Shows:
│  ├─ ✗ Already Checked In
│  ├─ Abebe Kebede
│  └─ Checked in at 5:42 PM
└─ Dismiss button

User types in search:
├─ Types "Abebe"
├─ Live search results appear:
│  ├─ Abebe Kebede (Table 5) ✓ Checked-in
│  ├─ Abebe Tadesse (Table 8) ⏳ Not yet
│  └─ Abeba Mulugeta (Table 3) ⏳ Not yet
├─ Tap "Abebe Tadesse"
├─ Details card:
│  ├─ Name: Abebe Tadesse
│  ├─ Table: 8, Seat 2
│  ├─ Meal: Vegetarian
│  ├─ Guest Type: General
│  └─ [ Check In ] (big green button)
├─ Tap "Check In"
├─ Confirmation modal: "Check in Abebe Tadesse?"
├─ Confirm
└─ Checked in → Success feedback

Walk-in Guest (if enabled):
├─ Search returns "No results"
├─ Shows: "Guest not found. Add as walk-in?"
├─ Button: "+ Add Walk-in"
├─ Modal:
│  ├─ Full Name
│  ├─ Phone (optional)
│  └─ Guest Type
├─ Submit
├─ Guest added to database
└─ Automatically checked in

Bottom Toolbar:
├─ [👤 Profile] - Staff can logout
├─ [📊 Stats] - See current count
└─ [↻ Refresh] - Manual refresh if offline sync pending

ACTOR 5: GUEST (Enhanced Flow)
RSVP Flow:
┌─────────────────────────────────────────────────────────────┐
│ GUEST - RECEIVING INVITATION                                 │
└─────────────────────────────────────────────────────────────┘

1. Organizer sends invitations from Event > Guests > Send Invitations
2. Guest receives email:

   ┌──────────────────────────────────────────────────┐
   │  From: Flawless Events <noreply@addisevents.com> │
   │  Subject: You're Invited! Selam & Dawit's Wedding│
   ├──────────────────────────────────────────────────┤
   │  [Beautiful email template with event banner]    │
   │                                                  │
   │  Dear Abebe,                                     │
   │                                                  │
   │  You're invited to celebrate with us!           │
   │                                                  │
   │  📅 May 15, 2026 at 4:00 PM                     │
   │  📍 Skylight Hotel, Addis Ababa                 │
   │                                                  │
   │  [ RSVP NOW ] (big button)                      │
   │                                                  │
   │  Or copy this link:                             │
   │  https://addisevents.com/rsvp/abc123xyz         │
   │                                                  │
   │  We can't wait to see you!                      │
   │  - Selam & Dawit                                │
   └──────────────────────────────────────────────────┘

3. Guest clicks "RSVP NOW" button
4. Opens browser → /rsvp/[token]


┌─────────────────────────────────────────────────────────────┐
│ GUEST - RSVP PAGE (YeneSerg-Inspired Rich UI)               │
└─────────────────────────────────────────────────────────────┘

Landing: /rsvp/abc123xyz

┌─────────────────────────────────────────────────────────────┐
│  [Full-width hero image - couple photo or event banner]    │
│  ┌───────────────────────────────────────────────────────┐ │
│  │  Selam & Dawit                                        │ │
│  │  ARE GETTING MARRIED                                  │ │
│  │                                                       │ │
│  │  May 15, 2026                                         │ │
│  └───────────────────────────────────────────────────────┘ │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  [Language Toggle: EN | አማ]                                │
│                                                             │
│  ─────────────────────────────────────────────             │
│                                                             │
│  💌 You're Invited, Abebe!                                 │
│                                                             │
│  ─────────────────────────────────────────────             │
│                                                             │
│  📅 WHEN                                                    │
│  Saturday, May 15, 2026                                    │
│  4:00 PM - 11:00 PM                                        │
│  [Add to Calendar ▼] → Google/Apple/Outlook               │
│                                                             │
│  📍 WHERE                                                   │
│  Skylight Hotel, Grand Ballroom                            │
│  Bole Road, Addis Ababa                                    │
│  [View Map] → Opens Google Maps                            │
│  [Get Directions]                                          │
│                                                             │
│  ─────────────────────────────────────────────             │
│                                                             │
│  ✨ OUR STORY (Toggle section)                             │
│  [Expandable timeline with photos]                         │
│  - How We Met                                              │
│  - First Date                                              │
│  - The Proposal                                            │
│                                                             │
│  ─────────────────────────────────────────────             │
│                                                             │
│  🎉 EVENT SCHEDULE                                         │
│  4:00 PM - Guest Arrival & Cocktails                       │
│  5:00 PM - Ceremony Begins                                 │
│  6:30 PM - Dinner & Toasts                                 │
│  8:00 PM - Dancing & Celebration                           │
│                                                             │
│  ─────────────────────────────────────────────             │
│                                                             │
│  📸 PHOTO GALLERY                                          │
│  [Grid of engagement photos - 6-8 images]                  │
│  [View All]                                                │
│                                                             │
│  ─────────────────────────────────────────────             │
│                                                             │
│  💒 RSVP                                                    │
│  ┌─────────────────────────────────────────────────────┐  │
│  │  Will you be attending?                             │  │
│  │                                                      │  │
│  │  ( ) Joyfully Accepts                               │  │
│  │  ( ) Regretfully Declines                           │  │
│  │                                                      │  │
│  │  [If "Accepts" selected, form expands below:]       │  │
│  │                                                      │  │
│  │  Full Name: [Abebe Kebede] (pre-filled)            │  │
│  │                                                      │  │
│  │  Email: [abebe@email.com] (pre-filled)             │  │
│  │                                                      │  │
│  │  Phone: [+251 911 234 567]                         │  │
│  │                                                      │  │
│  │  Will you bring a guest? (+1)                      │  │
│  │  ( ) Yes  ( ) No                                    │  │
│  │                                                      │  │
│  │  [If Yes:]                                          │  │
│  │  Guest Name: [___________]                         │  │
│  │                                                      │  │
│  │  Meal Preference:                                   │  │
│  │  ┌──────────────────────────────────────┐          │  │
│  │  │ [Dropdown]                           │          │  │
│  │  │ - Meat (Doro Wat)                    │          │  │
│  │  │ - Fish (Asa Tibs)                    │          │  │
│  │  │ - Vegetarian (Veggie Combo)          │          │  │
│  │  │ - Vegan                               │          │  │
│  │  └──────────────────────────────────────┘          │  │
│  │                                                      │  │
│  │  Dietary Restrictions / Allergies:                 │  │
│  │  [Text area]                                       │  │
│  │                                                      │  │
│  │  Special Song Request (optional):                  │  │
│  │  [___________]                                     │  │
│  │                                                      │  │
│  │  Message to the Couple (optional):                 │  │
│  │  [Text area - 200 chars max]                      │  │
│  │                                                      │  │
│  │  [ ላክ RSVP / SUBMIT ]  (big button, Amharic/EN)   │  │
│  └─────────────────────────────────────────────────────┘  │
│                                                             │
│  ─────────────────────────────────────────────             │
│                                                             │
│  🎁 GIFT REGISTRY (Optional Section)                       │
│  We're blessed to have you celebrate with us.              │
│  If you'd like to contribute:                              │
│  [Bank Transfer Details] [CBE Birr] [Telebirr QR]         │
│                                                             │
│  ─────────────────────────────────────────────             │
│                                                             │
│  💬 FAQS                                                    │
│  - What's the dress code? → Formal attire                 │
│  - Is parking available? → Yes, valet service             │
│  - Can I bring children? → Adults only, please            │
│                                                             │
│  ─────────────────────────────────────────────             │
│                                                             │
│  📱 SHARE WITH FRIENDS                                     │
│  [WhatsApp] [Facebook] [Twitter] [Copy Link]              │
│                                                             │
│  ─────────────────────────────────────────────             │
│                                                             │
│  Footer:                                                   │
│  Powered by Addis Events                                   │
│  Need help? Contact: +251 911 XXX XXX                     │
│                                                             │
└─────────────────────────────────────────────────────────────┘


After submitting RSVP:

┌─────────────────────────────────────────────────────────────┐
│  [Confetti animation]                                       │
│                                                             │
│  ✓ አመሰግናለሁ! Your RSVP is Confirmed                        │
│                                                             │
│  We can't wait to celebrate with you, Abebe!               │
│                                                             │
│  ─────────────────────────────────────────────             │
│                                                             │
│  📧 CHECK YOUR EMAIL                                        │
│  We've sent your confirmation with:                        │
│  • Event details                                           │
│  • Your QR code ticket                                     │
│  • Calendar invite                                         │
│  • Directions                                              │
│                                                             │
│  ─────────────────────────────────────────────             │
│                                                             │
│  🎫 YOUR QR CODE                                            │
│  ┌─────────────────────────┐                              │
│  │  [QR Code Image]        │                              │
│  │                         │                              │
│  │  Abebe Kebede           │                              │
│  │  Table 5, Seat 3        │                              │
│  └─────────────────────────┘                              │
│  [Download QR Code]                                        │
│  [Add to Apple Wallet] [Add to Google Wallet]             │
│                                                             │
│  ─────────────────────────────────────────────             │
│                                                             │
│  WHAT'S NEXT?                                              │
│  • Save your QR code (you'll need it at the venue)        │
│  • Check your email for full details                       │
│  • Need to change your RSVP? Click here                   │
│                                                             │
│  ─────────────────────────────────────────────             │
│                                                             │
│  📸 SHARE YOUR EXCITEMENT                                  │
│  [Pre-composed WhatsApp message]:                          │
│  "I just RSVP'd to Selam & Dawit's wedding! 🎉"          │
│  [Share button]                                            │
│                                                             │
└─────────────────────────────────────────────────────────────┘

Confirmation Email:

From: Selam & Dawit <noreply@addisevents.com>
Subject: ✓ You're All Set! See You on May 15

[Email with:]
- Thank you message
- Event details recap
- Attached QR code (PNG)
- .ics calendar file
- Google Maps link
- "Add to Calendar" buttons
- Contact info if they have questions
Guest Changes RSVP:
1. Guest clicks original RSVP link again
2. System detects existing RSVP via token
3. Shows current response:

   ┌─────────────────────────────────────────────────────────┐
   │  YOU'VE ALREADY RSVP'D                                  │
   │                                                         │
   │  ✓ You confirmed attendance on April 28, 2026          │
   │                                                         │
   │  Your Details:                                          │
   │  • Name: Abebe Kebede                                   │
   │  • +1 Guest: Marta Abebe                                │
   │  • Meal: Vegetarian                                     │
   │  • Table: 5, Seat 3                                     │
   │                                                         │
   │  [ Download Your QR Code ]                              │
   │                                                         │
   │  Need to make changes?                                  │
   │  [ Update My RSVP ]                                     │
   │                                                         │
   └─────────────────────────────────────────────────────────┘

4. If user clicks "Update My RSVP":
   ├─ Form reloads with current data pre-filled
   ├─ User can change: Attendance, +1, Meal, etc.
   ├─ Submits
   ├─ Confirmation: "Your RSVP has been updated"
   ├─ Organizer sees update in real-time
   └─ New confirmation email sent
Event Day - Guest Arrival:
1. Guest arrives at venue
2. Staff at check-in desk with tablet
3. Guest shows QR code from:
   ├─ Printed email
   ├─ Phone screenshot
   └─ Digital wallet (Apple/Google)
4. Staff scans
5. Guest sees their name on staff's screen: "✓ Welcome, Abebe!"
6. Staff directs: "You're at Table 5, enjoy!"

ACTOR 6: PUBLIC (Ticket Purchase Flow)
┌─────────────────────────────────────────────────────────────┐
│ PUBLIC - DISCOVERING EVENT                                   │
└─────────────────────────────────────────────────────────────┘

1. Public event published: "Ethio Telecom Product Launch"
2. Event microsite is public: /events/ethio-telecom-launch
3. Person sees Facebook ad / Instagram post / Email marketing
4. Clicks link → Lands on event microsite


┌─────────────────────────────────────────────────────────────┐
│ EVENT MICROSITE (Public)                                     │
└─────────────────────────────────────────────────────────────┘

/events/ethio-telecom-launch

┌─────────────────────────────────────────────────────────────┐
│  [Hero Section]                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  [Event cover image/video]                          │   │
│  │                                                      │   │
│  │  ETHIO TELECOM PRODUCT LAUNCH                       │   │
│  │  Unveiling 5G Ethiopia                              │   │
│  │                                                      │   │
│  │  📅 June 20, 2026 | 6:00 PM                         │   │
│  │  📍 Skylight Hotel, Addis Ababa                     │   │
│  │                                                      │   │
│  │  [ GET TICKETS ] (sticky CTA button)                │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  ─────────────────────────────────────────────             │
│                                                             │
│  ABOUT THIS EVENT                                           │
│  Join us for the most anticipated tech event of the year...│
│  [Full description, formatted text, images]                │
│                                                             │
│  ─────────────────────────────────────────────             │
│                                                             │
│  EVENT SCHEDULE                                             │
│  6:00 PM - Registration & Networking                        │
│  7:00 PM - Keynote Address                                 │
│  8:00 PM - Product Demo                                    │
│  9:00 PM - Q&A & Networking                                │
│                                                             │
│  ─────────────────────────────────────────────             │
│                                                             │
│  SPEAKERS                                                   │
│  [Speaker cards with photos, names, titles, bios]          │
│                                                             │
│  ─────────────────────────────────────────────             │
│                                                             │
│  VENUE                                                      │
│  Skylight Hotel                                            │
│  [Embedded Google Map]                                     │
│  [Get Directions]                                          │
│                                                             │
│  ─────────────────────────────────────────────             │
│                                                             │
│  TICKETS                                                    │
│  ┌─────────────────────────────────────────────────────┐  │
│  │  VIP ACCESS                        2,000 ETB        │  │
│  │  • Front row seating                                │  │
│  │  • VIP networking lounge                            │  │
│  │  • Complimentary dinner                             │  │
│  │  • Exclusive Q&A session                            │  │
│  │  50 available | 23 left                             │  │
│  │  [ SELECT ]                                         │  │
│  └─────────────────────────────────────────────────────┘  │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐  │
│  │  GENERAL ADMISSION                  500 ETB         │  │
│  │  • Standard seating                                 │  │
│  │  • Access to all sessions                           │  │
│  │  • Light refreshments                               │  │
│  │  200 available | 142 left                           │  │
│  │  [ SELECT ]                                         │  │
│  └─────────────────────────────────────────────────────┘  │
│                                                             │
│  ─────────────────────────────────────────────             │
│                                                             │
│  FAQ                                                        │
│  • Is parking available?                                   │
│  • What's the refund policy?                               │
│  • Can I transfer my ticket?                               │
│                                                             │
│  ─────────────────────────────────────────────             │
│                                                             │
│  CONTACT ORGANIZER                                          │
│  Questions? Email: events@ethiotelecom.et                  │
│                                                             │
└─────────────────────────────────────────────────────────────┘


User clicks "SELECT" on VIP ticket:

┌─────────────────────────────────────────────────────────────┐
│  CHECKOUT                                                   │
│                                                             │
│  Your Order:                                                │
│  VIP Access × 1                              2,000 ETB     │
│                                                             │
│  Have a promo code?                                         │
│  [___________] [Apply]                                     │
│                                                             │
│  Your Information:                                          │
│  Full Name: [___________]                                  │
│  Email: [___________]                                      │
│  Phone: [___________]                                      │
│                                                             │
│  Emergency Contact (optional):                              │
│  Name: [___________]                                       │
│  Phone: [___________]                                      │
│                                                             │
│  Total: 2,000 ETB                                          │
│                                                             │
│  [ PROCEED TO PAYMENT ]                                    │
│                                                             │
└─────────────────────────────────────────────────────────────┘

Clicks "PROCEED TO PAYMENT":
├─ Redirects to Chapa payment page
├─ User selects payment method:
│  ├─ Telebirr
│  ├─ CBE Birr
│  ├─ Credit/Debit Card
│  └─ Bank Transfer
├─ Completes payment
├─ Chapa redirects back: /events/ethio-telecom-launch/ticket-confirmed
└─ Confirmation page:

┌─────────────────────────────────────────────────────────────┐
│  ✓ TICKET CONFIRMED!                                        │
│                                                             │
│  Thank you, Abebe!                                          │
│  Your ticket has been sent to your email.                   │
│                                                             │
│  Order #: ET-2026-001234                                   │
│                                                             │
│  🎫 YOUR E-TICKET                                           │
│  ┌─────────────────────────┐                              │
│  │  [QR Code]              │                              │
│  │                         │                              │
│  │  Abebe Kebede           │                              │
│  │  VIP Access             │                              │
│  │  June 20, 2026          │                              │
│  └─────────────────────────┘                              │
│  [Download Ticket (PDF)]                                   │
│  [Add to Wallet]                                           │
│                                                             │
│  📧 Check your email for full details and receipt.         │
│                                                             │
│  [ VIEW EVENT DETAILS ]                                    │
│                                                             │
└─────────────────────────────────────────────────────────────┘

SUPER ADMIN RBAC DASHBOARD
/admin/users

┌─────────────────────────────────────────────────────────────┐
│  USERS MANAGEMENT                                           │
│                                                             │
│  Filters:                                                   │
│  [All Roles ▼] [All Orgs ▼] [Active Status ▼] [Search...] │
│                                                             │
│  [ + Create User ]  [ Export CSV ]                         │
│                                                             │
│  ─────────────────────────────────────────────             │
│                                                             │
│  User Table:                                                │
│  ┌────┬──────────┬─────────┬────────┬────────┬──────────┐ │
│  │ ID │ Name     │ Email   │ Role   │ Org    │ Status   │ │
│  ├────┼──────────┼─────────┼────────┼────────┼──────────┤ │
│  │ 1  │ Admin    │ admin@  │ super_ │ -      │ Active   │ │
│  │    │ User     │ addis.. │ admin  │        │ ✓        │ │
│  │    │          │         │        │        │ [Edit]   │ │
│  ├────┼──────────┼─────────┼────────┼────────┼──────────┤ │
│  │ 2  │ Yohannes │ y@flaw..│organizer│Flawless│Active   │ │
│  │    │ Tadesse  │         │        │ Events │ ✓        │ │
│  │    │          │         │        │        │ [Edit]   │ │
│  ├────┼──────────┼─────────┼────────┼────────┼──────────┤ │
│  │ 3  │ Selam    │ s@ethio │ client │Flawless│Active   │ │
│  │    │ Bekele   │ tel...  │        │ Events │ ✓        │ │
│  │    │          │         │        │        │ [Edit]   │ │
│  └────┴──────────┴─────────┴────────┴────────┴──────────┘ │
│                                                             │
│  Pagination: < 1 2 3 ... 10 >                              │
│                                                             │
└─────────────────────────────────────────────────────────────┘

Click [Edit] on a user:

┌─────────────────────────────────────────────────────────────┐
│  EDIT USER                                                  │
│                                                             │
│  Full Name: [Yohannes Tadesse]                             │
│  Email: [yohannes@flawless.com] (read-only)                │
│  Phone: [+251 911 XXX XXX]                                 │
│                                                             │
│  Role: [Organizer ▼]                                       │
│  Organization: [Flawless Events ▼]                         │
│                                                             │
│  Status:                                                    │
│  ( ) Active                                                 │
│  ( ) Suspended                                              │
│                                                             │
│  Account Actions:                                           │
│  [ Reset Password ] → Sends reset email                    │
│  [ Force Email Verification ]                               │
│  [ View Login History ]                                    │
│                                                             │
│  Danger Zone:                                               │
│  [ Delete User ] (requires confirmation)                   │
│                                                             │
│  [ Save Changes ]  [ Cancel ]                              │
│                                                             │
└─────────────────────────────────────────────────────────────┘

UPDATED DATABASE SCHEMA
sql-- Super admin table
CREATE TABLE super_admins (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) UNIQUE,
  two_fa_enabled BOOLEAN DEFAULT TRUE,
  two_fa_secret TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add role to users table
ALTER TABLE users ADD COLUMN role TEXT NOT NULL 
  CHECK (role IN ('super_admin', 'organizer', 'client', 'staff'));

-- Login attempts tracking (for security)
CREATE TABLE login_attempts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT NOT NULL,
  success BOOLEAN NOT NULL,
  ip_address INET,
  user_agent TEXT,
  attempted_at TIMESTAMPTZ DEFAULT NOW()
);

-- Password reset tokens
CREATE TABLE password_reset_tokens (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id),
  token TEXT UNIQUE NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  used BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Email verification tokens
CREATE TABLE email_verification_tokens (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id),
  token TEXT UNIQUE NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  verified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

This revised master prompt provides:

✅ Complete authentication flows for all 6 actors
✅ Detailed UI/UX for RSVP pages (YeneSerg-inspired)
✅ Super Admin RBAC dashboard
✅ Realistic stress-tested flows
✅ Rich event microsite features
✅ Mobile-first check-in interface
✅ Security considerations (2FA, login tracking, token management)