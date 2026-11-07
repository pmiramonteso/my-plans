-- =============================================================================
-- my-plans · Esquema base: extensiones, tipos, tablas e índices
-- =============================================================================

create extension if not exists pg_trgm with schema extensions;

-- Funciones internas (helpers de RLS, triggers). No expuesto por la API.
create schema if not exists private;
grant usage on schema private to authenticated;

-- -----------------------------------------------------------------------------
-- Tipos
-- -----------------------------------------------------------------------------
create type public.app_locale         as enum ('es', 'en', 'ca');
create type public.visibility         as enum ('private', 'invited', 'friends');
create type public.friendship_status  as enum ('pending', 'accepted');
create type public.plan_status        as enum ('open', 'scheduled', 'done', 'archived');
create type public.plan_interest      as enum ('pending', 'interested', 'not_interested');
create type public.event_status       as enum ('scheduled', 'completed', 'cancelled');
create type public.rsvp_status        as enum ('pending', 'going', 'not_going');
create type public.member_role        as enum ('host', 'cohost', 'guest');
create type public.participant_source as enum ('direct', 'plan');
create type public.notification_type  as enum (
  'friend_request', 'friend_accepted',
  'plan_invite', 'plan_interest',
  'event_invite', 'event_rsvp', 'event_updated', 'event_cancelled', 'event_completed',
  'photos_added'
);

-- -----------------------------------------------------------------------------
-- Utilidades
-- -----------------------------------------------------------------------------
create function private.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

-- -----------------------------------------------------------------------------
-- profiles
-- -----------------------------------------------------------------------------
create table public.profiles (
  id            uuid primary key references auth.users (id) on delete cascade,
  username      text unique check (username ~ '^[a-z0-9_]{3,20}$'),
  display_name  text not null check (char_length(display_name) between 1 and 80),
  avatar_url    text check (avatar_url is null or avatar_url ~ '^https?://'),
  bio           text check (char_length(bio) <= 280),
  locale        public.app_locale not null default 'es',
  timezone      text not null default 'Europe/Madrid',
  onboarded_at  timestamptz,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create index profiles_username_trgm on public.profiles using gin (username extensions.gin_trgm_ops);
create index profiles_display_name_trgm on public.profiles using gin (display_name extensions.gin_trgm_ops);

create trigger profiles_updated_at before update on public.profiles
  for each row execute function private.set_updated_at();

-- -----------------------------------------------------------------------------
-- friendships: una fila por pareja (user_a < user_b)
-- -----------------------------------------------------------------------------
create table public.friendships (
  user_a        uuid not null references public.profiles (id) on delete cascade,
  user_b        uuid not null references public.profiles (id) on delete cascade,
  requested_by  uuid not null references public.profiles (id) on delete cascade,
  status        public.friendship_status not null default 'pending',
  created_at    timestamptz not null default now(),
  accepted_at   timestamptz,
  primary key (user_a, user_b),
  check (user_a < user_b),
  check (requested_by in (user_a, user_b))
);

create index friendships_user_b_idx on public.friendships (user_b, status);

-- -----------------------------------------------------------------------------
-- categories (los nombres se traducen en la app por slug)
-- -----------------------------------------------------------------------------
create table public.categories (
  id          smallint primary key,
  slug        text not null unique check (slug ~ '^[a-z_]+$'),
  icon        text not null,
  color       text not null,
  stat_key    text not null,
  is_summit   boolean not null default false,
  sort_order  smallint not null default 0
);

insert into public.categories (id, slug, icon, color, stat_key, is_summit, sort_order) values
  (1, 'hiking',     'footprints',     'pine',    'hikes',       false, 1),
  (2, 'summit',     'mountain-snow',  'granite', 'summits',     true,  2),
  (3, 'museum',     'landmark',       'plum',    'museums',     false, 3),
  (4, 'restaurant', 'utensils',       'ember',   'restaurants', false, 4),
  (5, 'trip',       'plane',          'sky',     'trips',       false, 5),
  (6, 'city',       'building-2',     'sunrise', 'cities',      false, 6),
  (7, 'other',      'sparkles',       'stone',   'other',       false, 7);

-- -----------------------------------------------------------------------------
-- plans: propuestas sin fecha
-- -----------------------------------------------------------------------------
create table public.plans (
  id               uuid primary key default gen_random_uuid(),
  creator_id       uuid not null references public.profiles (id) on delete cascade,
  category_id      smallint not null references public.categories (id),
  title            text not null check (char_length(title) between 1 and 120),
  description      text check (char_length(description) <= 5000),
  cover_path       text,
  external_url     text check (external_url is null or external_url ~ '^https?://'),
  difficulty       smallint check (difficulty between 1 and 5),
  location_name    text check (char_length(location_name) <= 200),
  address          text check (char_length(address) <= 300),
  lat              double precision check (lat between -90 and 90),
  lng              double precision check (lng between -180 and 180),
  google_place_id  text,
  visibility       public.visibility not null default 'invited',
  status           public.plan_status not null default 'open',
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),
  deleted_at       timestamptz
);

create index plans_creator_idx on public.plans (creator_id, status, created_at desc) where deleted_at is null;

create trigger plans_updated_at before update on public.plans
  for each row execute function private.set_updated_at();

-- -----------------------------------------------------------------------------
-- plan_invitations: invitación + interés
-- -----------------------------------------------------------------------------
create table public.plan_invitations (
  plan_id       uuid not null references public.plans (id) on delete cascade,
  user_id       uuid not null references public.profiles (id) on delete cascade,
  invited_by    uuid references public.profiles (id) on delete set null, -- null = se apuntó solo
  role          public.member_role not null default 'guest' check (role <> 'host'),
  interest      public.plan_interest not null default 'pending',
  responded_at  timestamptz,
  created_at    timestamptz not null default now(),
  primary key (plan_id, user_id)
);

create index plan_invitations_user_idx on public.plan_invitations (user_id, interest);

-- -----------------------------------------------------------------------------
-- events: eventos con fecha (vinculados opcionalmente a una propuesta)
-- -----------------------------------------------------------------------------
create table public.events (
  id               uuid primary key default gen_random_uuid(),
  plan_id          uuid references public.plans (id) on delete set null,
  creator_id       uuid not null references public.profiles (id) on delete cascade,
  category_id      smallint not null references public.categories (id),
  title            text not null check (char_length(title) between 1 and 120),
  description      text check (char_length(description) <= 5000),
  extra_info       text check (char_length(extra_info) <= 5000),
  cover_path       text,
  external_url     text check (external_url is null or external_url ~ '^https?://'),
  starts_at        timestamptz not null,
  ends_at          timestamptz,
  all_day          boolean not null default false,
  timezone         text not null default 'Europe/Madrid',
  location_name    text check (char_length(location_name) <= 200),
  address          text check (char_length(address) <= 300),
  lat              double precision check (lat between -90 and 90),
  lng              double precision check (lng between -180 and 180),
  google_place_id  text,
  visibility       public.visibility not null default 'invited',
  status           public.event_status not null default 'scheduled',
  completed_at     timestamptz,
  cancelled_at     timestamptz,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),
  deleted_at       timestamptz,
  check (ends_at is null or ends_at >= starts_at),
  check ((status = 'completed') = (completed_at is not null)),
  check ((status = 'cancelled') = (cancelled_at is not null))
);

create index events_starts_at_idx on public.events (starts_at) where deleted_at is null;
create index events_plan_idx on public.events (plan_id) where plan_id is not null;
create index events_creator_idx on public.events (creator_id);

create trigger events_updated_at before update on public.events
  for each row execute function private.set_updated_at();

-- -----------------------------------------------------------------------------
-- event_participants
-- -----------------------------------------------------------------------------
create table public.event_participants (
  event_id      uuid not null references public.events (id) on delete cascade,
  user_id       uuid not null references public.profiles (id) on delete cascade,
  role          public.member_role not null default 'guest',
  rsvp          public.rsvp_status not null default 'pending',
  attended      boolean,
  source        public.participant_source not null default 'direct',
  invited_by    uuid references public.profiles (id) on delete set null,
  responded_at  timestamptz,
  created_at    timestamptz not null default now(),
  primary key (event_id, user_id)
);

create index event_participants_user_idx on public.event_participants (user_id, rsvp);
create index event_participants_attended_idx on public.event_participants (user_id) where attended;

-- -----------------------------------------------------------------------------
-- peaks: catálogo de cimas
-- -----------------------------------------------------------------------------
create table public.peaks (
  id          uuid primary key default gen_random_uuid(),
  name        text not null check (char_length(name) between 1 and 120),
  altitude_m  integer not null check (altitude_m between 0 and 9000),
  range_name  text check (char_length(range_name) <= 120),
  country     text check (char_length(country) <= 2),
  lat         double precision check (lat between -90 and 90),
  lng         double precision check (lng between -180 and 180),
  created_by  uuid references public.profiles (id) on delete set null,
  created_at  timestamptz not null default now()
);

create unique index peaks_name_altitude_key on public.peaks (lower(name), altitude_m);
create index peaks_name_trgm on public.peaks using gin (name extensions.gin_trgm_ops);

create table public.plan_peaks (
  plan_id  uuid not null references public.plans (id) on delete cascade,
  peak_id  uuid not null references public.peaks (id) on delete restrict,
  primary key (plan_id, peak_id)
);

create table public.event_peaks (
  event_id          uuid not null references public.events (id) on delete cascade,
  peak_id           uuid not null references public.peaks (id) on delete restrict,
  elevation_gain_m  integer check (elevation_gain_m between 0 and 10000),
  distance_km       numeric(6, 2) check (distance_km between 0 and 1000),
  difficulty        smallint check (difficulty between 1 and 5),
  duration_min      integer check (duration_min between 0 and 10000),
  primary key (event_id, peak_id)
);

create index event_peaks_peak_idx on public.event_peaks (peak_id);

-- -----------------------------------------------------------------------------
-- event_photos (borrado físico: se elimina también el archivo, por privacidad)
-- -----------------------------------------------------------------------------
create table public.event_photos (
  id            uuid primary key default gen_random_uuid(),
  event_id      uuid not null references public.events (id) on delete cascade,
  uploader_id   uuid not null references public.profiles (id) on delete cascade,
  storage_path  text not null unique,
  thumb_path    text not null unique,
  width         integer not null check (width > 0),
  height        integer not null check (height > 0),
  size_bytes    integer not null check (size_bytes > 0),
  caption       text check (char_length(caption) <= 500),
  created_at    timestamptz not null default now()
);

create index event_photos_event_idx on public.event_photos (event_id, created_at desc);

-- -----------------------------------------------------------------------------
-- notifications
-- -----------------------------------------------------------------------------
create table public.notifications (
  id            uuid primary key default gen_random_uuid(),
  recipient_id  uuid not null references public.profiles (id) on delete cascade,
  actor_id      uuid references public.profiles (id) on delete set null,
  type          public.notification_type not null,
  entity_type   text not null check (entity_type in ('profile', 'plan', 'event')),
  entity_id     uuid not null,
  data          jsonb not null default '{}'::jsonb,
  read_at       timestamptz,
  created_at    timestamptz not null default now()
);

create index notifications_recipient_idx on public.notifications (recipient_id, created_at desc);
create index notifications_unread_idx on public.notifications (recipient_id) where read_at is null;
