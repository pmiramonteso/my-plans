-- =============================================================================
-- my-plans · Lógica de negocio: guardas de estado y RPC
--
-- Errores: `raise exception '<codigo>'`. La app traduce el código a un mensaje
-- (forbidden, not_found, not_friends, invalid_input, event_closed, ...).
-- =============================================================================

-- -----------------------------------------------------------------------------
-- Guardas (triggers BEFORE)
-- -----------------------------------------------------------------------------
create function private.friendships_before_update()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.status = 'accepted' and old.status <> 'accepted' then
    new.accepted_at := now();
  end if;
  return new;
end;
$$;

create trigger friendships_accepted_at before update on public.friendships
  for each row execute function private.friendships_before_update();

create function private.plan_invitations_before_update()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.interest is distinct from old.interest then
    if not exists (
      select 1 from public.plans p
      where p.id = new.plan_id and p.deleted_at is null and p.status in ('open', 'scheduled')
    ) then
      raise exception 'plan_closed' using errcode = 'P0001';
    end if;
    new.responded_at := now();
  end if;
  return new;
end;
$$;

create trigger plan_invitations_guard before update on public.plan_invitations
  for each row execute function private.plan_invitations_before_update();

create function private.event_participants_before_update()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.rsvp is distinct from old.rsvp then
    if not exists (
      select 1 from public.events e
      where e.id = new.event_id and e.deleted_at is null and e.status = 'scheduled'
    ) then
      raise exception 'event_closed' using errcode = 'P0001';
    end if;
    new.responded_at := now();
  end if;
  return new;
end;
$$;

create trigger event_participants_guard before update on public.event_participants
  for each row execute function private.event_participants_before_update();

-- El estado de una propuesta se deriva de sus eventos (nunca lo edita el usuario).
create function private.refresh_plan_status(p_plan uuid)
returns void
language sql
security definer
set search_path = ''
as $$
  update public.plans p
  set status = case
    when exists (select 1 from public.events e
                 where e.plan_id = p.id and e.deleted_at is null and e.status = 'completed') then 'done'
    when exists (select 1 from public.events e
                 where e.plan_id = p.id and e.deleted_at is null and e.status = 'scheduled') then 'scheduled'
    else 'open'
  end::public.plan_status
  where p.id = p_plan and p.status <> 'archived';
$$;

create function private.require_user()
returns uuid
language plpgsql
stable
set search_path = ''
as $$
declare
  v uuid := auth.uid();
begin
  if v is null then
    raise exception 'not_authenticated' using errcode = '42501';
  end if;
  return v;
end;
$$;

-- -----------------------------------------------------------------------------
-- Amistad (SECURITY INVOKER: la RLS sigue siendo la guarda)
-- -----------------------------------------------------------------------------
create function public.send_friend_request(p_user uuid)
returns public.friendship_status
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_me  uuid := private.require_user();
  v_row public.friendships;
begin
  if p_user is null or p_user = v_me then
    raise exception 'invalid_input' using errcode = '22023';
  end if;
  if not exists (select 1 from public.profiles where id = p_user and username is not null) then
    raise exception 'not_found' using errcode = 'P0002';
  end if;

  select * into v_row from public.friendships
  where user_a = least(v_me, p_user) and user_b = greatest(v_me, p_user);

  if found then
    -- Si la otra persona ya me lo había pedido, aceptar directamente.
    if v_row.status = 'pending' and v_row.requested_by = p_user then
      update public.friendships set status = 'accepted'
      where user_a = v_row.user_a and user_b = v_row.user_b;
      return 'accepted';
    end if;
    return v_row.status;
  end if;

  insert into public.friendships (user_a, user_b, requested_by)
  values (least(v_me, p_user), greatest(v_me, p_user), v_me);
  return 'pending';
end;
$$;

-- Aceptar (true) o rechazar (false) una solicitud recibida.
create function public.respond_friend_request(p_user uuid, p_accept boolean)
returns void
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_me uuid := private.require_user();
begin
  if p_accept then
    update public.friendships set status = 'accepted'
    where user_a = least(v_me, p_user) and user_b = greatest(v_me, p_user)
      and requested_by = p_user and status = 'pending';
  else
    delete from public.friendships
    where user_a = least(v_me, p_user) and user_b = greatest(v_me, p_user)
      and requested_by = p_user and status = 'pending';
  end if;
  if not found then
    raise exception 'not_found' using errcode = 'P0002';
  end if;
end;
$$;

-- Eliminar a un amigo o cancelar una solicitud enviada.
create function public.remove_friend(p_user uuid)
returns void
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_me uuid := private.require_user();
begin
  delete from public.friendships
  where user_a = least(v_me, p_user) and user_b = greatest(v_me, p_user);
  if not found then
    raise exception 'not_found' using errcode = 'P0002';
  end if;
end;
$$;

create function public.search_profiles(p_query text, p_limit integer default 20)
returns table (
  id               uuid,
  username         text,
  display_name     text,
  avatar_url       text,
  friendship       public.friendship_status,
  requested_by_me  boolean
)
language sql
stable
security invoker
set search_path = ''
as $$
  with q as (
    select replace(replace(replace(lower(trim(p_query)), '\', '\\'), '%', '\%'), '_', '\_') as term
  )
  select p.id, p.username, p.display_name, p.avatar_url, f.status, f.requested_by = auth.uid()
  from q, public.profiles p
  left join public.friendships f
    on f.user_a = least(p.id, auth.uid()) and f.user_b = greatest(p.id, auth.uid())
  where char_length(q.term) >= 2
    and p.id <> auth.uid()
    and p.username is not null
    and (p.username ilike '%' || q.term || '%' or p.display_name ilike '%' || q.term || '%')
  order by (p.username ilike q.term || '%') desc, p.display_name
  limit least(greatest(coalesce(p_limit, 20), 1), 50);
$$;

-- -----------------------------------------------------------------------------
-- Propuestas
-- -----------------------------------------------------------------------------
-- Registrar el interés propio. Si es una propuesta 'friends' a la que no estaba
-- invitado, me apunto (RLS: plan_invitations_insert).
create function public.set_plan_interest(p_plan uuid, p_interest public.plan_interest)
returns void
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_me uuid := private.require_user();
begin
  if p_interest = 'pending' then
    raise exception 'invalid_input' using errcode = '22023';
  end if;

  update public.plan_invitations set interest = p_interest
  where plan_id = p_plan and user_id = v_me;

  if not found then
    insert into public.plan_invitations (plan_id, user_id, invited_by, interest)
    values (p_plan, v_me, null, p_interest);
  end if;
end;
$$;

create function public.set_plan_archived(p_plan uuid, p_archived boolean)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  perform private.require_user();
  if not private.can_manage_plan(p_plan) then
    raise exception 'forbidden' using errcode = '42501';
  end if;

  if p_archived then
    update public.plans set status = 'archived' where id = p_plan;
  else
    update public.plans set status = 'open' where id = p_plan and status = 'archived';
    perform private.refresh_plan_status(p_plan);
  end if;
end;
$$;

-- Borrado lógico, reservado al creador. Los eventos vinculados se conservan.
create function public.delete_plan(p_plan uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_me uuid := private.require_user();
begin
  update public.plans set deleted_at = now()
  where id = p_plan and creator_id = v_me and deleted_at is null;
  if not found then
    raise exception 'forbidden' using errcode = '42501';
  end if;
end;
$$;

-- -----------------------------------------------------------------------------
-- Eventos
-- -----------------------------------------------------------------------------
-- Crea un evento desde cero o a partir de una propuesta (p_plan_id). Una sola
-- transacción: evento + host + participantes + cimas + estado de la propuesta.
-- La propuesta y su historial de interesados no se modifican.
create function public.create_event(
  p_title            text,
  p_category_id      smallint,
  p_starts_at        timestamptz,
  p_ends_at          timestamptz       default null,
  p_all_day          boolean           default false,
  p_timezone         text              default 'Europe/Madrid',
  p_description      text              default null,
  p_extra_info       text              default null,
  p_cover_path       text              default null,
  p_external_url     text              default null,
  p_location_name    text              default null,
  p_address          text              default null,
  p_lat              double precision  default null,
  p_lng              double precision  default null,
  p_google_place_id  text              default null,
  p_visibility       public.visibility default 'invited',
  p_plan_id          uuid              default null,
  p_participant_ids  uuid[]            default '{}'
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_me     uuid := private.require_user();
  v_event  uuid;
  v_cover  text := p_cover_path;
  v_guests uuid[];
begin
  if p_plan_id is not null then
    if not private.can_manage_plan(p_plan_id) then
      raise exception 'forbidden' using errcode = '42501';
    end if;
    if v_cover is null then
      select cover_path into v_cover from public.plans where id = p_plan_id;
    end if;
  end if;

  select coalesce(array_agg(distinct g), '{}') into v_guests
  from unnest(coalesce(p_participant_ids, '{}')) g
  where g <> v_me;

  if exists (select 1 from unnest(v_guests) g where not private.are_friends(v_me, g)) then
    raise exception 'not_friends' using errcode = '42501';
  end if;

  insert into public.events (
    plan_id, creator_id, category_id, title, description, extra_info, cover_path, external_url,
    starts_at, ends_at, all_day, timezone, location_name, address, lat, lng, google_place_id, visibility
  ) values (
    p_plan_id, v_me, p_category_id, p_title, p_description, p_extra_info, v_cover, p_external_url,
    p_starts_at, p_ends_at, coalesce(p_all_day, false), coalesce(p_timezone, 'Europe/Madrid'),
    p_location_name, p_address, p_lat, p_lng, p_google_place_id, coalesce(p_visibility, 'invited')
  )
  returning id into v_event;

  insert into public.event_participants (event_id, user_id, role, rsvp, source, responded_at)
  values (v_event, v_me, 'host', 'going',
          case when p_plan_id is null then 'direct' else 'plan' end::public.participant_source, now());

  insert into public.event_participants (event_id, user_id, role, rsvp, source, invited_by)
  select v_event, g, 'guest', 'pending',
         case when exists (select 1 from public.plan_invitations i
                           where i.plan_id = p_plan_id and i.user_id = g)
              then 'plan' else 'direct' end::public.participant_source,
         v_me
  from unnest(v_guests) g;

  if p_plan_id is not null then
    insert into public.event_peaks (event_id, peak_id)
    select v_event, pp.peak_id from public.plan_peaks pp where pp.plan_id = p_plan_id;
    perform private.refresh_plan_status(p_plan_id);
  end if;

  return v_event;
end;
$$;

create function public.cancel_event(p_event uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_plan uuid;
begin
  perform private.require_user();
  if not private.can_manage_event(p_event) then
    raise exception 'forbidden' using errcode = '42501';
  end if;

  update public.events set status = 'cancelled', cancelled_at = now()
  where id = p_event and status = 'scheduled'
  returning plan_id into v_plan;
  if not found then
    raise exception 'event_closed' using errcode = 'P0001';
  end if;

  if v_plan is not null then
    perform private.refresh_plan_status(v_plan);
  end if;
end;
$$;

-- Marca el evento como realizado. p_attendees = quién asistió de verdad: solo
-- ellos suman en estadísticas e historial.
create function public.complete_event(p_event uuid, p_attendees uuid[])
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_plan uuid;
begin
  perform private.require_user();
  if not private.can_manage_event(p_event) then
    raise exception 'forbidden' using errcode = '42501';
  end if;
  if coalesce(cardinality(p_attendees), 0) = 0 then
    raise exception 'invalid_input' using errcode = '22023';
  end if;
  if not exists (select 1 from public.events where id = p_event and status = 'scheduled') then
    raise exception 'event_closed' using errcode = 'P0001';
  end if;
  if exists (select 1 from public.events where id = p_event and starts_at > now()) then
    raise exception 'event_not_started' using errcode = 'P0001';
  end if;

  update public.event_participants
  set attended = (user_id = any(p_attendees))
  where event_id = p_event;

  update public.events set status = 'completed', completed_at = now()
  where id = p_event
  returning plan_id into v_plan;

  if v_plan is not null then
    perform private.refresh_plan_status(v_plan);
  end if;
end;
$$;

-- Borrado lógico, reservado al creador.
create function public.delete_event(p_event uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_me   uuid := private.require_user();
  v_plan uuid;
begin
  update public.events set deleted_at = now()
  where id = p_event and creator_id = v_me and deleted_at is null
  returning plan_id into v_plan;
  if not found then
    raise exception 'forbidden' using errcode = '42501';
  end if;

  if v_plan is not null then
    perform private.refresh_plan_status(v_plan);
  end if;
end;
$$;

-- -----------------------------------------------------------------------------
-- Notificaciones
-- -----------------------------------------------------------------------------
create function public.mark_all_notifications_read()
returns integer
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_count integer;
begin
  update public.notifications set read_at = now()
  where recipient_id = private.require_user() and read_at is null;
  get diagnostics v_count = row_count;
  return v_count;
end;
$$;
