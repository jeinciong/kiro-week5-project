-- TechRSVP initial schema
-- Tables: profiles, categories, events, rsvps
-- Includes RLS policies per PRD section 8.

-- ========== Enums ==========
create type location_type as enum ('online', 'in_person');
create type event_status as enum ('draft', 'published', 'cancelled');
create type rsvp_status as enum ('confirmed', 'waitlisted', 'cancelled');

-- ========== profiles ==========
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text,
  avatar_url text,
  is_organizer boolean not null default false,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "Profiles are publicly readable"
  on public.profiles for select
  using (true);

create policy "Users can insert their own profile"
  on public.profiles for insert
  with check (auth.uid() = id);

create policy "Users can update their own profile"
  on public.profiles for update
  using (auth.uid() = id);

-- Automatically create a profile row when a new auth user is created.
create function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, new.raw_user_meta_data ->> 'full_name');
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ========== categories ==========
create table public.categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  description text,
  color text,
  icon text
);

alter table public.categories enable row level security;

create policy "Categories are publicly readable"
  on public.categories for select
  using (true);

-- Writable only by admins (service role bypasses RLS; no public write policy).

insert into public.categories (name, slug, description, color, icon) values
  ('Web Development', 'web-development', 'Frontend, backend, and full-stack workshops.', '#3B82F6', 'code'),
  ('AI / Machine Learning', 'ai-ml', 'Artificial intelligence and machine learning topics.', '#8B5CF6', 'cpu'),
  ('Cloud & DevOps', 'cloud-devops', 'Cloud infrastructure, CI/CD, and platform engineering.', '#0EA5E9', 'cloud'),
  ('Cybersecurity', 'cybersecurity', 'Security, privacy, and ethical hacking.', '#EF4444', 'shield'),
  ('Mobile Development', 'mobile-development', 'iOS, Android, and cross-platform app development.', '#F59E0B', 'smartphone'),
  ('Data Science & Analytics', 'data-science-analytics', 'Data engineering, analytics, and visualization.', '#10B981', 'bar-chart'),
  ('Design & UX', 'design-ux', 'Product design, UX research, and UI craft.', '#EC4899', 'palette'),
  ('Career & Networking', 'career-networking', 'Career growth, mentorship, and networking events.', '#6366F1', 'users');

-- ========== events ==========
create table public.events (
  id uuid primary key default gen_random_uuid(),
  organizer_id uuid not null references public.profiles (id) on delete cascade,
  category_id uuid references public.categories (id) on delete set null,
  title text not null,
  description text,
  location_type location_type not null,
  location_address text,
  location_url text,
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  timezone text not null default 'UTC',
  capacity integer not null check (capacity > 0),
  cover_image_url text,
  status event_status not null default 'draft',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index events_status_starts_at_idx on public.events (status, starts_at);
create index events_category_id_idx on public.events (category_id);
create index events_organizer_id_idx on public.events (organizer_id);

alter table public.events enable row level security;

create policy "Published events are publicly readable"
  on public.events for select
  using (status = 'published' or organizer_id = auth.uid());

create policy "Organizers can insert their own events"
  on public.events for insert
  with check (organizer_id = auth.uid());

create policy "Organizers can update their own events"
  on public.events for update
  using (organizer_id = auth.uid());

create policy "Organizers can delete their own events"
  on public.events for delete
  using (organizer_id = auth.uid());

create function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger events_set_updated_at
  before update on public.events
  for each row execute procedure public.set_updated_at();

-- ========== rsvps ==========
create table public.rsvps (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events (id) on delete cascade,
  attendee_id uuid not null references public.profiles (id) on delete cascade,
  status rsvp_status not null default 'confirmed',
  created_at timestamptz not null default now(),
  unique (event_id, attendee_id)
);

create index rsvps_event_id_idx on public.rsvps (event_id);
create index rsvps_attendee_id_idx on public.rsvps (attendee_id);

alter table public.rsvps enable row level security;

create policy "Attendees can view their own rsvps"
  on public.rsvps for select
  using (attendee_id = auth.uid());

create policy "Organizers can view rsvps for their events"
  on public.rsvps for select
  using (
    exists (
      select 1 from public.events
      where events.id = rsvps.event_id
        and events.organizer_id = auth.uid()
    )
  );

create policy "Attendees can insert their own rsvps"
  on public.rsvps for insert
  with check (attendee_id = auth.uid());

create policy "Attendees can update their own rsvps"
  on public.rsvps for update
  using (attendee_id = auth.uid());

-- Enable realtime for live seat-count updates.
alter publication supabase_realtime add table public.rsvps;
