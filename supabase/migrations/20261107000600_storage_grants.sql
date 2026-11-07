-- =============================================================================
-- my-plans · Storage, Realtime y privilegios de funciones
-- =============================================================================

-- -----------------------------------------------------------------------------
-- Buckets (la app comprime a WebP en el cliente; aquí, el límite duro)
-- -----------------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types) values
  ('avatars',      'avatars',      true,  2097152,  array['image/webp', 'image/jpeg', 'image/png']),
  ('covers',       'covers',       false, 10485760, array['image/webp', 'image/jpeg', 'image/png']),
  ('event-photos', 'event-photos', false, 10485760, array['image/webp', 'image/jpeg', 'image/png'])
on conflict (id) do update set
  public             = excluded.public,
  file_size_limit    = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- covers: plans/{plan_id}/… o events/{event_id}/…
-- Al convertir una propuesta, el evento reutiliza la portada de la propuesta,
-- así que los participantes del evento también pueden verla.
create function private.can_view_cover(p_name text)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select case split_part(p_name, '/', 1)
    when 'plans' then
      private.can_view_plan(private.try_uuid(split_part(p_name, '/', 2)))
      or exists (select 1 from public.events e
                 where e.cover_path = p_name and private.can_view_event(e.id))
    when 'events' then
      private.can_view_event(private.try_uuid(split_part(p_name, '/', 2)))
    else false
  end;
$$;

create function private.can_manage_cover(p_name text)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select case split_part(p_name, '/', 1)
    when 'plans'  then private.can_manage_plan(private.try_uuid(split_part(p_name, '/', 2)))
    when 'events' then private.can_manage_event(private.try_uuid(split_part(p_name, '/', 2)))
    else false
  end;
$$;

create index events_cover_path_idx on public.events (cover_path) where cover_path like 'plans/%';

-- avatars: {user_id}/…
create policy avatars_select on storage.objects
  for select to authenticated using (bucket_id = 'avatars');
create policy avatars_insert on storage.objects
  for insert to authenticated
  with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);
create policy avatars_update on storage.objects
  for update to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text)
  with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);
create policy avatars_delete on storage.objects
  for delete to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);

create policy covers_select on storage.objects
  for select to authenticated using (bucket_id = 'covers' and private.can_view_cover(name));
create policy covers_insert on storage.objects
  for insert to authenticated with check (bucket_id = 'covers' and private.can_manage_cover(name));
create policy covers_update on storage.objects
  for update to authenticated
  using (bucket_id = 'covers' and private.can_manage_cover(name))
  with check (bucket_id = 'covers' and private.can_manage_cover(name));
create policy covers_delete on storage.objects
  for delete to authenticated using (bucket_id = 'covers' and private.can_manage_cover(name));

-- event-photos: {event_id}/{photo_id}.webp y {event_id}/{photo_id}_thumb.webp
create policy event_photos_obj_select on storage.objects
  for select to authenticated
  using (bucket_id = 'event-photos'
         and private.can_view_event(private.try_uuid((storage.foldername(name))[1])));
create policy event_photos_obj_insert on storage.objects
  for insert to authenticated
  with check (bucket_id = 'event-photos'
              and private.can_contribute_photos(private.try_uuid((storage.foldername(name))[1])));
create policy event_photos_obj_delete on storage.objects
  for delete to authenticated
  using (bucket_id = 'event-photos'
         and (owner_id = auth.uid()::text
              or private.can_manage_event(private.try_uuid((storage.foldername(name))[1]))));

-- -----------------------------------------------------------------------------
-- Realtime: contador de notificaciones (Realtime respeta la RLS)
-- -----------------------------------------------------------------------------
alter publication supabase_realtime add table public.notifications;

-- -----------------------------------------------------------------------------
-- Privilegios
-- -----------------------------------------------------------------------------
grant select on public.completed_participations to authenticated;

-- Funciones internas: solo los helpers que usan las políticas.
revoke execute on all functions in schema private from public, anon, authenticated;
grant execute on function
  private.are_friends(uuid, uuid),
  private.can_view_plan(uuid),
  private.can_manage_plan(uuid),
  private.is_event_participant(uuid),
  private.can_view_event(uuid),
  private.can_manage_event(uuid),
  private.can_contribute_photos(uuid),
  private.try_uuid(text),
  private.can_view_cover(text),
  private.can_manage_cover(text),
  private.require_user()
to authenticated;

-- RPC públicas: solo usuarios autenticados.
revoke execute on all functions in schema public from public, anon;
grant execute on function
  public.send_friend_request(uuid),
  public.respond_friend_request(uuid, boolean),
  public.remove_friend(uuid),
  public.search_profiles(text, integer),
  public.set_plan_interest(uuid, public.plan_interest),
  public.set_plan_archived(uuid, boolean),
  public.delete_plan(uuid),
  public.create_event(text, smallint, timestamptz, timestamptz, boolean, text, text, text, text, text,
                      text, text, double precision, double precision, text, public.visibility, uuid, uuid[]),
  public.cancel_event(uuid),
  public.complete_event(uuid, uuid[]),
  public.delete_event(uuid),
  public.mark_all_notifications_read(),
  public.get_user_stats(uuid, integer),
  public.get_shared_stats(uuid, integer),
  public.get_friends_shared_counts(),
  public.get_friend_feed(timestamptz, integer)
to authenticated;
