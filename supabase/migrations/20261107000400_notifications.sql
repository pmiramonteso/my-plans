-- =============================================================================
-- my-plans · Notificaciones internas, generadas por triggers
--
-- Nadie puede insertarlas desde la API. El texto lo compone la app (i18n) a
-- partir de `type` + `data`.
-- =============================================================================

create function private.notify(
  p_recipient    uuid,
  p_actor        uuid,
  p_type         public.notification_type,
  p_entity_type  text,
  p_entity_id    uuid,
  p_data         jsonb default '{}'::jsonb
)
returns void
language sql
security definer
set search_path = ''
as $$
  insert into public.notifications (recipient_id, actor_id, type, entity_type, entity_id, data)
  select p_recipient, p_actor, p_type, p_entity_type, p_entity_id, coalesce(p_data, '{}'::jsonb)
  where p_recipient is not null and p_recipient is distinct from p_actor;
$$;

-- -----------------------------------------------------------------------------
-- Amistad
-- -----------------------------------------------------------------------------
create function private.on_friendship_change()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_other uuid;
begin
  if tg_op = 'INSERT' then
    v_other := case when new.requested_by = new.user_a then new.user_b else new.user_a end;
    perform private.notify(v_other, new.requested_by, 'friend_request', 'profile', new.requested_by);
  elsif new.status = 'accepted' and old.status = 'pending' then
    v_other := case when new.requested_by = new.user_a then new.user_b else new.user_a end;
    perform private.notify(new.requested_by, v_other, 'friend_accepted', 'profile', v_other);
  end if;
  return null;
end;
$$;

create trigger friendships_notify after insert or update of status on public.friendships
  for each row execute function private.on_friendship_change();

-- -----------------------------------------------------------------------------
-- Propuestas
-- -----------------------------------------------------------------------------
create function private.on_plan_invitation_change()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_plan public.plans;
begin
  select * into v_plan from public.plans where id = new.plan_id;

  if tg_op = 'INSERT' and new.invited_by is not null then
    perform private.notify(new.user_id, new.invited_by, 'plan_invite', 'plan', new.plan_id,
                           jsonb_build_object('title', v_plan.title));
  end if;

  if new.interest = 'interested'
     and (tg_op = 'INSERT' or old.interest is distinct from new.interest) then
    perform private.notify(v_plan.creator_id, new.user_id, 'plan_interest', 'plan', new.plan_id,
                           jsonb_build_object('title', v_plan.title));
  end if;
  return null;
end;
$$;

create trigger plan_invitations_notify after insert or update of interest on public.plan_invitations
  for each row execute function private.on_plan_invitation_change();

-- -----------------------------------------------------------------------------
-- Eventos
-- -----------------------------------------------------------------------------
create function private.on_event_participant_change()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_event public.events;
begin
  select * into v_event from public.events where id = new.event_id;

  if tg_op = 'INSERT' then
    if new.invited_by is not null then
      perform private.notify(new.user_id, new.invited_by, 'event_invite', 'event', new.event_id,
                             jsonb_build_object('title', v_event.title, 'starts_at', v_event.starts_at));
    end if;
  elsif new.rsvp is distinct from old.rsvp and new.rsvp <> 'pending' then
    perform private.notify(v_event.creator_id, new.user_id, 'event_rsvp', 'event', new.event_id,
                           jsonb_build_object('title', v_event.title, 'rsvp', new.rsvp));
  end if;
  return null;
end;
$$;

create trigger event_participants_notify after insert or update of rsvp on public.event_participants
  for each row execute function private.on_event_participant_change();

create function private.on_event_change()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor   uuid := auth.uid();
  v_type    public.notification_type;
  v_changed text[] := '{}';
begin
  if new.deleted_at is not null then
    return null;
  end if;

  if new.status = 'cancelled' and old.status <> 'cancelled' then
    v_type := 'event_cancelled';
  elsif new.status = 'completed' and old.status <> 'completed' then
    v_type := 'event_completed';
  elsif new.status = 'scheduled' then
    if new.title is distinct from old.title then v_changed := array_append(v_changed, 'title'); end if;
    if new.starts_at is distinct from old.starts_at
       or new.ends_at is distinct from old.ends_at
       or new.all_day is distinct from old.all_day then v_changed := array_append(v_changed, 'date'); end if;
    if new.location_name is distinct from old.location_name
       or new.address is distinct from old.address then v_changed := array_append(v_changed, 'location'); end if;
    if cardinality(v_changed) > 0 then
      v_type := 'event_updated';
    end if;
  end if;

  if v_type is null then
    return null;
  end if;

  insert into public.notifications (recipient_id, actor_id, type, entity_type, entity_id, data)
  select ep.user_id, v_actor, v_type, 'event', new.id,
         jsonb_build_object('title', new.title, 'starts_at', new.starts_at, 'changed', to_jsonb(v_changed))
  from public.event_participants ep
  where ep.event_id = new.id
    and ep.user_id is distinct from v_actor
    and case v_type
          when 'event_completed' then coalesce(ep.attended, false)
          else ep.rsvp <> 'not_going'
        end;
  return null;
end;
$$;

create trigger events_notify after update on public.events
  for each row execute function private.on_event_change();

-- -----------------------------------------------------------------------------
-- Fotos: una notificación por subida (trigger por sentencia), no por foto.
-- -----------------------------------------------------------------------------
create function private.on_photos_inserted()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.notifications (recipient_id, actor_id, type, entity_type, entity_id, data)
  select ep.user_id, n.uploader_id, 'photos_added', 'event', n.event_id,
         jsonb_build_object('title', e.title, 'count', n.photo_count)
  from (
    select event_id, uploader_id, count(*) as photo_count
    from new_rows group by event_id, uploader_id
  ) n
  join public.events e on e.id = n.event_id
  join public.event_participants ep
    on ep.event_id = n.event_id
   and ep.user_id <> n.uploader_id
   and (ep.rsvp = 'going' or ep.attended);
  return null;
end;
$$;

create trigger event_photos_notify after insert on public.event_photos
  referencing new table as new_rows
  for each statement execute function private.on_photos_inserted();
