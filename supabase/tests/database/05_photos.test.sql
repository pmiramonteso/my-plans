-- Fotos tal como las usa la app (Fase 6): quién puede subir, una notificación
-- por subida, quién las ve y quién las borra.
begin;
create extension if not exists pgtap with schema extensions;
select plan(13);

create function pg_temp.login(p_user uuid)
returns void
language sql
as $$
  select set_config('request.jwt.claims',
                    json_build_object('sub', p_user, 'role', 'authenticated')::text, true);
  select set_config('role', 'authenticated', true);
$$;

-- Fila de event_photos con las rutas que genera la app.
create function pg_temp.photo(p_event uuid, p_uploader uuid)
returns table (id uuid, event_id uuid, uploader_id uuid, storage_path text, thumb_path text,
               width integer, height integer, size_bytes integer)
language sql
as $$
  select v.id, p_event, p_uploader, p_event || '/' || v.id || '.webp',
         p_event || '/' || v.id || '_thumb.webp', 2560, 1920, 1500000
  from (select gen_random_uuid() as id) v;
$$;

-- Pau organiza; Rita (va) y Sol (sin responder) son sus amigas; Teo es un desconocido.
insert into auth.users (id, email, raw_user_meta_data) values
  ('00000000-0000-0000-0000-0000000a1001', 'pau@test.dev',  '{"full_name": "Pau"}'),
  ('00000000-0000-0000-0000-0000000b2002', 'rita@test.dev', '{"full_name": "Rita"}'),
  ('00000000-0000-0000-0000-0000000c3003', 'sol@test.dev',  '{"full_name": "Sol"}'),
  ('00000000-0000-0000-0000-0000000d4004', 'teo@test.dev',  '{"full_name": "Teo"}');
update public.profiles set username = lower(display_name)
where id in (select id from auth.users where email like '%@test.dev');
insert into public.friendships (user_a, user_b, requested_by, status) values
  ('00000000-0000-0000-0000-0000000a1001', '00000000-0000-0000-0000-0000000b2002',
   '00000000-0000-0000-0000-0000000a1001', 'accepted'),
  ('00000000-0000-0000-0000-0000000a1001', '00000000-0000-0000-0000-0000000c3003',
   '00000000-0000-0000-0000-0000000a1001', 'accepted');

select pg_temp.login('00000000-0000-0000-0000-0000000a1001');
select set_config('test.past', public.create_event(
  'Montseny', 1::smallint, now() - interval '1 day',
  p_participant_ids => array['00000000-0000-0000-0000-0000000b2002'::uuid,
                             '00000000-0000-0000-0000-0000000c3003'::uuid])::text, true);
select set_config('test.future', public.create_event(
  'Collserola', 1::smallint, now() + interval '3 days',
  p_participant_ids => array['00000000-0000-0000-0000-0000000b2002'::uuid])::text, true);

select pg_temp.login('00000000-0000-0000-0000-0000000b2002');
update public.event_participants set rsvp = 'going' where user_id = auth.uid();

-- =============================================================================
-- Subir
-- =============================================================================
select throws_ok(format($$ insert into public.event_photos (id, event_id, uploader_id, storage_path, thumb_path, width, height, size_bytes)
                           select * from pg_temp.photo(%L, auth.uid()) $$, current_setting('test.future')),
                 '42501', null, 'no se suben fotos antes de que empiece');
select lives_ok(format($$ insert into public.event_photos (id, event_id, uploader_id, storage_path, thumb_path, width, height, size_bytes)
                          select * from pg_temp.photo(%L, auth.uid())
                          union all select * from pg_temp.photo(%L, auth.uid()) $$,
                       current_setting('test.past'), current_setting('test.past')),
                'Rita, que va, sube dos fotos de una vez');
select throws_ok(format($$ insert into public.event_photos (id, event_id, uploader_id, storage_path, thumb_path, width, height, size_bytes)
                           select * from pg_temp.photo(%L, '00000000-0000-0000-0000-0000000a1001') $$,
                        current_setting('test.past')),
                 '42501', null, 'nadie sube fotos en nombre de otro');

select pg_temp.login('00000000-0000-0000-0000-0000000a1001');
select is((select count(*) from public.notifications
           where type = 'photos_added' and entity_id = current_setting('test.past')::uuid), 1::bigint,
          'Pau recibe una sola notificación por la subida');
select is((select (data ->> 'count')::int from public.notifications where type = 'photos_added'), 2,
          'con el número de fotos');
select is((select count(*) from public.event_photos where event_id = current_setting('test.past')::uuid),
          2::bigint, 'el organizador ve las fotos');

select pg_temp.login('00000000-0000-0000-0000-0000000c3003');
select is((select count(*) from public.notifications where type = 'photos_added'), 0::bigint,
          'Sol, que no ha confirmado, no recibe el aviso');
select throws_ok(format($$ insert into public.event_photos (id, event_id, uploader_id, storage_path, thumb_path, width, height, size_bytes)
                           select * from pg_temp.photo(%L, auth.uid()) $$, current_setting('test.past')),
                 '42501', null, 'Sol no puede subir fotos sin confirmar');
delete from public.event_photos where event_id = current_setting('test.past')::uuid;

select pg_temp.login('00000000-0000-0000-0000-0000000d4004');
select is((select count(*) from public.event_photos), 0::bigint, 'un desconocido no ve ninguna foto');

-- =============================================================================
-- Borrar
-- =============================================================================
select pg_temp.login('00000000-0000-0000-0000-0000000b2002');
select is((select count(*) from public.event_photos where event_id = current_setting('test.past')::uuid),
          2::bigint, 'Sol no ha podido borrar las fotos de Rita');
select set_config('test.photo',
  (select id::text from public.event_photos where event_id = current_setting('test.past')::uuid limit 1), true);
delete from public.event_photos where id = current_setting('test.photo')::uuid;
select is((select count(*) from public.event_photos where event_id = current_setting('test.past')::uuid),
          1::bigint, 'Rita borra una foto suya');

select pg_temp.login('00000000-0000-0000-0000-0000000a1001');
delete from public.event_photos where event_id = current_setting('test.past')::uuid;
select is((select count(*) from public.event_photos where event_id = current_setting('test.past')::uuid),
          0::bigint, 'el organizador puede borrar cualquier foto del evento');

select public.cancel_event(current_setting('test.past')::uuid);
select pg_temp.login('00000000-0000-0000-0000-0000000b2002');
select throws_ok(format($$ insert into public.event_photos (id, event_id, uploader_id, storage_path, thumb_path, width, height, size_bytes)
                           select * from pg_temp.photo(%L, auth.uid()) $$, current_setting('test.past')),
                 '42501', null, 'no se suben fotos a un evento cancelado');

select * from finish();
rollback;
