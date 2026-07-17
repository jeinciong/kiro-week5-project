# Product Requirements Document: TechRSVP

## 1. Overview

TechRSVP is a web application that lets organizers create and manage tech
workshop events, and lets attendees discover events and RSVP to them. Each
event is tagged with a category based on the type of workshop (e.g. Web
Development, AI/ML, Cloud & DevOps, Cybersecurity, Mobile Development, Data
Science, Design/UX, Career & Networking), so attendees can filter and find
events relevant to their interests.

## 2. Goals

- Allow organizers to create, edit, and cancel workshop events.
- Allow attendees to browse events, filter by category, and RSVP.
- Track RSVP capacity and show real-time seat availability.
- Notify attendees of upcoming events they've RSVP'd to (email).
- Provide a simple admin/organizer dashboard for managing events and viewing
  attendee lists.

## 3. Non-Goals

- Payment processing / paid ticketing (out of scope for v1).
- Native mobile apps (web-only, responsive design).
- In-app video conferencing for the workshop itself.
- Multi-language / i18n support (v1 is English only).

## 4. Target Users

- **Organizers**: individuals or companies hosting tech workshops who need to
  publish events and manage attendees.
- **Attendees**: developers and tech enthusiasts looking for workshops to
  attend, who want to RSVP and get reminders.

## 5. Tech Stack

- **Frontend/Framework**: Next.js (App Router, React, TypeScript)
- **Backend/Database**: Supabase (Postgres, Auth, Row Level Security,
  Realtime, Storage for event images)
- **Styling**: Tailwind CSS
- **Hosting**: Vercel (frontend) + Supabase (managed backend)
- **Email**: Supabase Auth emails for account flows; a transactional email
  provider (e.g. Resend) for RSVP confirmations and reminders

## 6. Workshop Categories

Predefined categories, stored as a `categories` table so they can be managed
without a code deploy. Each event belongs to exactly one primary category in
v1 (extensible to many-to-many later).

Initial seed categories:

1. Web Development
2. AI / Machine Learning
3. Cloud & DevOps
4. Cybersecurity
5. Mobile Development
6. Data Science & Analytics
7. Design & UX
8. Career & Networking

Each category has: `id`, `name`, `slug`, `description`, `color` (for UI
badges/tags), `icon` (optional icon identifier).

## 7. Core Features

### 7.1 Authentication

- Sign up / log in via Supabase Auth (email + password, and optionally OAuth
  e.g. Google/GitHub).
- Two roles: `attendee` (default) and `organizer`. Role stored in a `profiles`
  table linked to `auth.users`.
- Organizers can be self-service (request organizer role) or promoted by an
  admin — v1 assumes a simple `is_organizer` flag settable via a request flow
  or manual admin action.

### 7.2 Event Management (Organizer)

- Create event with: title, description, category, date & time, timezone,
  location (physical address or online link), capacity, cover image, tags,
  visibility (public/unlisted).
- Edit event details.
- Cancel event (soft delete, status = `cancelled`, notifies RSVP'd attendees).
- View list of RSVPs per event, with export to CSV.
- Duplicate an existing event as a starting point for a new one.

### 7.3 Event Discovery (Attendee)

- Browse a paginated/infinite-scroll list of upcoming events.
- Filter by category (multi-select), date range, location type
  (online/in-person), and free-text search on title/description.
- Sort by date (soonest first) or popularity (RSVP count).
- Event detail page showing full description, organizer info, category
  badge, remaining capacity, and RSVP button.

### 7.4 RSVP Flow

- Authenticated attendees can RSVP to an event with one click.
- If event is at capacity, attendee can join a waitlist.
- Attendee can cancel their RSVP at any time before the event.
- Capacity/seat counts update in real time (Supabase Realtime) as RSVPs
  come in or are cancelled.
- On successful RSVP: confirmation email sent, and event added to the
  attendee's "My Events" list.

### 7.5 Notifications

- Confirmation email immediately after RSVP.
- Reminder email 24 hours before the event (via scheduled Supabase Edge
  Function / cron job).
- Cancellation email if the organizer cancels the event.

### 7.6 My Events (Attendee Dashboard)

- List of upcoming events the user has RSVP'd to.
- List of past events attended.
- Ability to cancel an RSVP directly from this view.

### 7.7 Organizer Dashboard

- List of events created, with status (draft/published/cancelled/past).
- Per-event RSVP count vs. capacity, waitlist count.
- Attendee list per event with contact info and export (CSV).

## 8. Data Model (high-level)

```
profiles
  id (uuid, references auth.users)
  full_name
  avatar_url
  is_organizer (boolean)
  created_at

categories
  id (uuid)
  name
  slug
  description
  color
  icon

events
  id (uuid)
  organizer_id (references profiles.id)
  category_id (references categories.id)
  title
  description
  location_type (enum: online, in_person)
  location_address (text, nullable)
  location_url (text, nullable)
  starts_at (timestamptz)
  ends_at (timestamptz)
  timezone
  capacity (int)
  cover_image_url (text, nullable)
  status (enum: draft, published, cancelled)
  created_at
  updated_at

rsvps
  id (uuid)
  event_id (references events.id)
  attendee_id (references profiles.id)
  status (enum: confirmed, waitlisted, cancelled)
  created_at
```

Row Level Security (RLS) rules (Supabase):

- `events`: anyone can `select` where `status = 'published'`; only the
  organizer (`organizer_id = auth.uid()`) can `insert`/`update`/`delete`
  their own events.
- `rsvps`: attendees can `insert`/`select`/`update` only their own rows
  (`attendee_id = auth.uid()`); organizers can `select` rsvps for events they
  own.
- `categories`: publicly readable; writable only by admins.

## 9. Success Metrics

- Number of events published per month.
- RSVP conversion rate (event views -> RSVPs).
- Attendance rate (RSVP'd vs. checked-in, if check-in is added later).
- Organizer retention (organizers who publish more than one event).

## 10. Future Considerations (post-v1)

- Paid/ticketed events with Stripe integration.
- Multiple categories/tags per event.
- Check-in via QR code at the event.
- Event series / recurring workshops.
- Public organizer profile pages.
- Admin moderation panel for reported events.
