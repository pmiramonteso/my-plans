-- =============================================================================
-- my-plans · Seguridad: alta de perfiles, helpers de RLS, privilegios y políticas
-- =============================================================================

-- -----------------------------------------------------------------------------
-- Alta automática del perfil al registrarse (Google OAuth)
-- -----------------------------------------------------------------------------
create function private.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_name   text := coalesce(
    nullif(trim(new.raw_user_meta_data ->> 'full_name'), ''),
    nullif(trim(new.raw_user_meta_data ->> 'name'), ''),
    nullif(split_part(coalesce(new.email, ''), '@', 1), ''),
    'Explorer'
  );
  v_avatar text := coalesce(new.raw_user_meta_data ->> 'avatar_url', new.raw_user_meta_data ->> 'picture');
begin
  insert into public.profiles (id, display_name, avatar_url)
  values (
    new.id,
    left(v_name, 80),
    case when v_avatar ~ '^https?://' then v_avatar end
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function private.handle_new_user();

-- El onboarding termina la primera vez que se elige username.
create function private.profiles_before_update()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if old.username is null and new.username is not null then
    new.onboarded_at := now();
  end if;
  return new;
end;
$$;

create trigger profiles_onboarded before update on public.profiles
  for each row execute function private.profiles_before_update();

-- -----------------------------------------------------------------------------
-- Helpers de RLS (SECURITY DEFINER: evitan recursión entre políticas)
-- -----------------------------------------------------------------------------
create function private.are_friends(a uuid, b uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.friendships f
    where f.user_a = least(a, b)
      and f.user_b = greatest(a, b)
      and f.status = 'accepted'
  );
$$;

-- Toda la lógica de visibilidad de propuestas vive aquí. Para añadir 'public'
-- en el futuro basta con una rama más.
create function private.can_view_plan(p_plan uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.plans p
    where p.id = p_plan
      and p.deleted_at is null
      and (
        p.creator_id = auth.uid()
        or (p.visibility in ('invited', 'friends') and exists (
              select 1 from public.plan_invitations i
              where i.plan_id = p.id and i.user_id = auth.uid()))
        or (p.visibility = 'friends' and private.are_friends(p.creator_id, auth.uid()))
      )
  );
$$;

-- Creador o co-organizador.
create function private.can_manage_plan(p_plan uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.plans p
    where p.id = p_plan
      and p.deleted_at is null
      and (
        p.creator_id = auth.uid()
        or exists (
          select 1 from public.plan_invitations i
          where i.plan_id = p.id and i.user_id = auth.uid() and i.role = 'cohost')
      )
  );
$$;

create function private.is_event_participant(p_event uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.event_participants ep
    where ep.event_id = p_event and ep.user_id = auth.uid()
  );
$$;

create function private.can_view_event(p_event uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.events e
    where e.id = p_event
      and e.deleted_at is null
      and (
        e.creator_id = auth.uid()
        or private.is_event_participant(e.id)
        or (e.visibility = 'friends' and private.are_friends(e.creator_id, auth.uid()))
      )
  );
$$;

-- Host o co-organizador.
create function private.can_manage_event(p_event uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.events e
    join public.event_participants ep on ep.event_id = e.id
    where e.id = p_event
      and e.deleted_at is null
      and ep.user_id = auth.uid()
      and ep.role in ('host', 'cohost')
  );
$$;

-- Pueden subir fotos los participantes que van o asistieron, una vez empezado el evento.
create function private.can_contribute_photos(p_event uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.events e
    join public.event_participants ep on ep.event_id = e.id
    where e.id = p_event
      and e.deleted_at is null
      and e.status <> 'cancelled'
      and e.starts_at <= now()
      and ep.user_id = auth.uid()
      and (ep.rsvp = 'going' or ep.attended)
  );
$$;

create function private.try_uuid(p text)
returns uuid
language plpgsql
immutable
set search_path = ''
as $$
begin
  return p::uuid;
exception when invalid_text_representation then
  return null;
end;
$$;

-- -----------------------------------------------------------------------------
-- Privilegios: la app es privada (sin acceso anónimo) y las columnas editables
-- se conceden una a una. Las transiciones de estado van por RPC.
-- -----------------------------------------------------------------------------
-- Convención: toda tabla, vista o función nueva concede sus privilegios explícitamente.
revoke all on all tables in schema public from anon, authenticated;
alter default privileges for role postgres in schema public revoke all on tables from anon, authenticated;
alter default privileges for role postgres in schema public revoke execute on functions from public, anon, authenticated;
alter default privileges for role postgres in schema private revoke execute on functions from public, anon, authenticated;

grant select on all tables in schema public to authenticated;

grant update (username, display_name, avatar_url, bio, locale, timezone) on public.profiles to authenticated;

grant insert (user_a, user_b, requested_by) on public.friendships to authenticated;
grant update (status) on public.friendships to authenticated;
grant delete on public.friendships to authenticated;

grant insert (id, creator_id, category_id, title, description, cover_path, external_url, difficulty,
              location_name, address, lat, lng, google_place_id, visibility)
  on public.plans to authenticated;
grant update (category_id, title, description, cover_path, external_url, difficulty,
              location_name, address, lat, lng, google_place_id, visibility)
  on public.plans to authenticated;

grant insert (plan_id, user_id, invited_by, interest) on public.plan_invitations to authenticated;
grant update (interest) on public.plan_invitations to authenticated;
grant delete on public.plan_invitations to authenticated;

grant update (category_id, title, description, extra_info, cover_path, external_url,
              starts_at, ends_at, all_day, timezone, location_name, address, lat, lng,
              google_place_id, visibility)
  on public.events to authenticated;

grant insert (event_id, user_id, invited_by, rsvp) on public.event_participants to authenticated;
grant update (rsvp) on public.event_participants to authenticated;
grant delete on public.event_participants to authenticated;

grant insert (id, name, altitude_m, range_name, country, lat, lng, created_by) on public.peaks to authenticated;

grant insert, delete on public.plan_peaks to authenticated;
grant insert, delete on public.event_peaks to authenticated;
grant update (elevation_gain_m, distance_km, difficulty, duration_min) on public.event_peaks to authenticated;

grant insert (id, event_id, uploader_id, storage_path, thumb_path, width, height, size_bytes, caption)
  on public.event_photos to authenticated;
grant update (caption) on public.event_photos to authenticated;
grant delete on public.event_photos to authenticated;

grant update (read_at) on public.notifications to authenticated;
grant delete on public.notifications to authenticated;

-- -----------------------------------------------------------------------------
-- RLS
-- -----------------------------------------------------------------------------
alter table public.profiles           enable row level security;
alter table public.friendships        enable row level security;
alter table public.categories         enable row level security;
alter table public.plans              enable row level security;
alter table public.plan_invitations   enable row level security;
alter table public.events             enable row level security;
alter table public.event_participants enable row level security;
alter table public.peaks              enable row level security;
alter table public.plan_peaks         enable row level security;
alter table public.event_peaks        enable row level security;
alter table public.event_photos       enable row level security;
alter table public.notifications      enable row level security;

-- profiles: datos no sensibles, visibles para usuarios autenticados (búsqueda).
create policy profiles_select on public.profiles
  for select to authenticated using (true);
create policy profiles_update_own on public.profiles
  for update to authenticated
  using (id = auth.uid()) with check (id = auth.uid());

-- friendships
create policy friendships_select on public.friendships
  for select to authenticated
  using (auth.uid() in (user_a, user_b));
create policy friendships_insert on public.friendships
  for insert to authenticated
  with check (requested_by = auth.uid() and auth.uid() in (user_a, user_b) and status = 'pending');
-- Solo el destinatario acepta una solicitud pendiente.
create policy friendships_accept on public.friendships
  for update to authenticated
  using (auth.uid() in (user_a, user_b) and requested_by <> auth.uid() and status = 'pending')
  with check (status = 'accepted');
create policy friendships_delete on public.friendships
  for delete to authenticated
  using (auth.uid() in (user_a, user_b));

-- categories
create policy categories_select on public.categories
  for select to authenticated using (true);

-- plans
-- `creator_id = auth.uid()` en línea: el helper no ve la fila durante el propio INSERT … RETURNING.
create policy plans_select on public.plans
  for select to authenticated using (creator_id = auth.uid() or private.can_view_plan(id));
create policy plans_insert on public.plans
  for insert to authenticated with check (creator_id = auth.uid());
create policy plans_update on public.plans
  for update to authenticated
  using (private.can_manage_plan(id)) with check (private.can_manage_plan(id));

-- plan_invitations
create policy plan_invitations_select on public.plan_invitations
  for select to authenticated using (private.can_view_plan(plan_id));
-- El organizador invita a sus amigos, o un amigo se apunta solo a una propuesta 'friends'.
create policy plan_invitations_insert on public.plan_invitations
  for insert to authenticated
  with check (
    (private.can_manage_plan(plan_id)
      and invited_by = auth.uid()
      and user_id <> auth.uid()
      and private.are_friends(auth.uid(), user_id)
      and interest = 'pending')
    or
    (user_id = auth.uid()
      and invited_by is null
      and private.can_view_plan(plan_id))
  );
create policy plan_invitations_update_own on public.plan_invitations
  for update to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy plan_invitations_delete on public.plan_invitations
  for delete to authenticated
  using (private.can_manage_plan(plan_id) or user_id = auth.uid());

-- events: la inserción va por la RPC create_event.
create policy events_select on public.events
  for select to authenticated using (creator_id = auth.uid() or private.can_view_event(id));
create policy events_update on public.events
  for update to authenticated
  using (private.can_manage_event(id)) with check (private.can_manage_event(id));

-- event_participants
create policy event_participants_select on public.event_participants
  for select to authenticated using (private.can_view_event(event_id));
create policy event_participants_insert on public.event_participants
  for insert to authenticated
  with check (
    (private.can_manage_event(event_id)
      and invited_by = auth.uid()
      and user_id <> auth.uid()
      and private.are_friends(auth.uid(), user_id)
      and rsvp = 'pending')
    or
    (user_id = auth.uid()
      and invited_by is null
      and private.can_view_event(event_id))
  );
create policy event_participants_update_own on public.event_participants
  for update to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy event_participants_delete on public.event_participants
  for delete to authenticated
  using (role <> 'host' and (private.can_manage_event(event_id) or user_id = auth.uid()));

-- peaks
create policy peaks_select on public.peaks
  for select to authenticated using (true);
create policy peaks_insert on public.peaks
  for insert to authenticated with check (created_by = auth.uid());

-- plan_peaks / event_peaks
create policy plan_peaks_select on public.plan_peaks
  for select to authenticated using (private.can_view_plan(plan_id));
create policy plan_peaks_insert on public.plan_peaks
  for insert to authenticated with check (private.can_manage_plan(plan_id));
create policy plan_peaks_delete on public.plan_peaks
  for delete to authenticated using (private.can_manage_plan(plan_id));

create policy event_peaks_select on public.event_peaks
  for select to authenticated using (private.can_view_event(event_id));
create policy event_peaks_insert on public.event_peaks
  for insert to authenticated with check (private.can_manage_event(event_id));
create policy event_peaks_update on public.event_peaks
  for update to authenticated
  using (private.can_manage_event(event_id)) with check (private.can_manage_event(event_id));
create policy event_peaks_delete on public.event_peaks
  for delete to authenticated using (private.can_manage_event(event_id));

-- event_photos
create policy event_photos_select on public.event_photos
  for select to authenticated using (private.can_view_event(event_id));
create policy event_photos_insert on public.event_photos
  for insert to authenticated
  with check (uploader_id = auth.uid() and private.can_contribute_photos(event_id));
create policy event_photos_update_own on public.event_photos
  for update to authenticated
  using (uploader_id = auth.uid()) with check (uploader_id = auth.uid());
create policy event_photos_delete on public.event_photos
  for delete to authenticated
  using (uploader_id = auth.uid() or private.can_manage_event(event_id));

-- notifications: solo las crean los triggers.
create policy notifications_select_own on public.notifications
  for select to authenticated using (recipient_id = auth.uid());
create policy notifications_update_own on public.notifications
  for update to authenticated
  using (recipient_id = auth.uid()) with check (recipient_id = auth.uid());
create policy notifications_delete_own on public.notifications
  for delete to authenticated using (recipient_id = auth.uid());
