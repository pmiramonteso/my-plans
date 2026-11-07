-- =============================================================================
-- my-plans · Historial, estadísticas y feed de amigos
--
-- Regla: solo cuentan los eventos `completed` en los que el usuario `attended`.
-- Confirmar asistencia no suma nada.
-- =============================================================================

-- Historial: una fila por (usuario, evento realizado al que asistió). Respeta RLS.
create view public.completed_participations
with (security_invoker = true)
as
select
  ep.user_id,
  e.id as event_id,
  e.plan_id,
  e.category_id,
  e.title,
  e.description,
  e.cover_path,
  e.starts_at,
  e.completed_at,
  e.timezone,
  e.location_name,
  e.address,
  e.lat,
  e.lng,
  e.google_place_id
from public.event_participants ep
join public.events e on e.id = ep.event_id
where ep.attended
  and e.status = 'completed'
  and e.deleted_at is null;

-- Métricas de los eventos a los que asistieron TODOS los usuarios de p_users.
-- Una categoría nueva aparece sola en `by_category` gracias a `stat_key`.
create function private.compute_stats(p_users uuid[], p_year integer default null)
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
  with ev as (
    select e.*
    from public.events e
    where e.status = 'completed'
      and e.deleted_at is null
      and (p_year is null or extract(year from e.starts_at at time zone e.timezone) = p_year)
      and e.id in (
        select ep.event_id from public.event_participants ep
        where ep.attended and ep.user_id = any(p_users)
        group by ep.event_id
        having count(distinct ep.user_id) = cardinality(p_users)
      )
  ),
  by_cat as (
    select c.stat_key, count(ev.id) as n
    from public.categories c
    left join ev on ev.category_id = c.id
    group by c.stat_key
  ),
  ascents as (
    select pk.peak_id, pk.elevation_gain_m, pk.distance_km
    from ev join public.event_peaks pk on pk.event_id = ev.id
  )
  select jsonb_build_object(
    'total',            (select count(*) from ev),
    'by_category',      (select coalesce(jsonb_object_agg(stat_key, n), '{}'::jsonb) from by_cat),
    'distinct_summits', (select count(distinct peak_id) from ascents),
    'summit_ascents',   (select count(*) from ascents),
    'max_altitude_m',   (select max(p.altitude_m) from ascents a join public.peaks p on p.id = a.peak_id),
    'elevation_gain_m', (select coalesce(sum(elevation_gain_m), 0) from ascents),
    'distance_km',      (select coalesce(sum(distance_km), 0) from ascents),
    'places',           (select count(distinct coalesce(google_place_id, lower(trim(location_name))))
                         from ev where coalesce(google_place_id, location_name) is not null),
    'first_at',         (select min(starts_at) from ev),
    'last_at',          (select max(starts_at) from ev)
  );
$$;

-- Estadísticas de un usuario: las propias o las de un amigo (solo agregados).
create function public.get_user_stats(p_user uuid default null, p_year integer default null)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_me     uuid := private.require_user();
  v_target uuid := coalesce(p_user, v_me);
begin
  if v_target <> v_me and not private.are_friends(v_me, v_target) then
    raise exception 'forbidden' using errcode = '42501';
  end if;
  return private.compute_stats(array[v_target], p_year);
end;
$$;

-- Estadísticas compartidas con un amigo (eventos en los que asistimos los dos).
create function public.get_shared_stats(p_friend uuid, p_year integer default null)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_me uuid := private.require_user();
begin
  if not private.are_friends(v_me, p_friend) then
    raise exception 'forbidden' using errcode = '42501';
  end if;
  return private.compute_stats(array[v_me, p_friend], p_year);
end;
$$;

-- Actividades realizadas con cada amigo (para el listado y futuros rankings).
create function public.get_friends_shared_counts()
returns table (friend_id uuid, shared_count bigint, last_at timestamptz)
language sql
stable
security invoker
set search_path = ''
as $$
  select other.user_id, count(*), max(e.starts_at)
  from public.event_participants me
  join public.event_participants other
    on other.event_id = me.event_id and other.user_id <> me.user_id and other.attended
  join public.events e
    on e.id = me.event_id and e.status = 'completed' and e.deleted_at is null
  where me.user_id = auth.uid()
    and me.attended
    and private.are_friends(auth.uid(), other.user_id)
  group by other.user_id;
$$;

-- Actividad reciente de mis amigos. SECURITY INVOKER: la RLS filtra lo que puedo ver.
create function public.get_friend_feed(p_before timestamptz default null, p_limit integer default 20)
returns table (
  kind         text,
  actor_id     uuid,
  entity_id    uuid,
  title        text,
  category_id  smallint,
  cover_path   text,
  occurred_at  timestamptz,
  data         jsonb
)
language sql
stable
security invoker
set search_path = ''
as $$
  select * from (
    select 'event_completed'::text, e.creator_id, e.id, e.title, e.category_id, e.cover_path,
           e.completed_at, '{}'::jsonb
    from public.events e
    where e.status = 'completed' and e.deleted_at is null
      and e.creator_id <> auth.uid()
      and private.are_friends(auth.uid(), e.creator_id)

    union all

    select 'plan_created', p.creator_id, p.id, p.title, p.category_id, p.cover_path,
           p.created_at, '{}'::jsonb
    from public.plans p
    where p.deleted_at is null and p.visibility <> 'private'
      and p.creator_id <> auth.uid()
      and private.are_friends(auth.uid(), p.creator_id)

    union all

    select 'photos_added', ph.uploader_id, ph.event_id, e.title, e.category_id, e.cover_path,
           max(ph.created_at), jsonb_build_object('count', count(*))
    from public.event_photos ph
    join public.events e on e.id = ph.event_id and e.deleted_at is null
    where ph.uploader_id <> auth.uid()
      and private.are_friends(auth.uid(), ph.uploader_id)
    group by ph.uploader_id, ph.event_id, e.title, e.category_id, e.cover_path,
             date_trunc('day', ph.created_at)
  ) feed (kind, actor_id, entity_id, title, category_id, cover_path, occurred_at, data)
  where p_before is null or feed.occurred_at < p_before
  order by feed.occurred_at desc
  limit least(greatest(coalesce(p_limit, 20), 1), 50);
$$;
