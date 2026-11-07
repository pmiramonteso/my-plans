-- Pruebas de RLS y de los flujos principales.
-- Ana y Bob serán amigos; Carla es una desconocida.
begin;
create extension if not exists pgtap with schema extensions;
select plan(61);

create function pg_temp.login(p_user uuid)
returns void
language sql
as $$
  select set_config('request.jwt.claims',
                    json_build_object('sub', p_user, 'role', 'authenticated')::text, true);
  select set_config('role', 'authenticated', true);
$$;

insert into auth.users (id, email, raw_user_meta_data) values
  ('00000000-0000-0000-0000-0000000000a1', 'ana@test.dev',   '{"full_name": "Ana Puig", "avatar_url": "https://example.com/a.png"}'),
  ('00000000-0000-0000-0000-0000000000b2', 'bob@test.dev',   '{"name": "Bob"}'),
  ('00000000-0000-0000-0000-0000000000c3', 'carla@test.dev', '{}');

-- =============================================================================
-- Perfiles
-- =============================================================================
select is((select display_name from public.profiles where id = '00000000-0000-0000-0000-0000000000a1'),
          'Ana Puig', 'el perfil se crea al registrarse, con el nombre de Google');
select is((select avatar_url from public.profiles where id = '00000000-0000-0000-0000-0000000000a1'),
          'https://example.com/a.png', 'se guarda la foto de Google');
select is((select display_name from public.profiles where id = '00000000-0000-0000-0000-0000000000c3'),
          'carla', 'sin nombre, se usa la parte local del email');
select ok(not has_table_privilege('anon', 'public.profiles', 'select'),
          'los anónimos no pueden leer perfiles');
select ok(not has_table_privilege('authenticated', 'public.notifications', 'insert'),
          'nadie puede crear notificaciones desde la API');

select pg_temp.login('00000000-0000-0000-0000-0000000000a1');
update public.profiles set username = 'ana', bio = 'Montaña' where id = auth.uid();
select isnt((select onboarded_at from public.profiles where id = auth.uid()), null,
            'elegir username completa el onboarding');
select throws_ok($$ update public.profiles set username = 'Ana!' where id = auth.uid() $$,
                 '23514', null, 'username con formato inválido');
update public.profiles set bio = 'hack' where id = '00000000-0000-0000-0000-0000000000b2';

select pg_temp.login('00000000-0000-0000-0000-0000000000b2');
update public.profiles set username = 'bob' where id = auth.uid();
select is((select bio from public.profiles where id = auth.uid()), null,
          'no se puede editar el perfil de otra persona');
select throws_ok($$ update public.profiles set onboarded_at = null where id = auth.uid() $$,
                 '42501', null, 'las columnas no editables están bloqueadas');

select pg_temp.login('00000000-0000-0000-0000-0000000000c3');
update public.profiles set username = 'carla' where id = auth.uid();

-- =============================================================================
-- Amistad
-- =============================================================================
select pg_temp.login('00000000-0000-0000-0000-0000000000a1');
select is((select count(*) from public.search_profiles('bo')), 1::bigint, 'búsqueda por username');
select is(public.send_friend_request('00000000-0000-0000-0000-0000000000b2'), 'pending'::public.friendship_status,
          'Ana envía solicitud a Bob');
select throws_ok($$ select public.send_friend_request(auth.uid()) $$, 'invalid_input',
                 'no puedes ser amigo de ti mismo');
select throws_ok($$ select public.respond_friend_request('00000000-0000-0000-0000-0000000000b2', true) $$,
                 'not_found', 'quien envía no puede aceptar su propia solicitud');

select pg_temp.login('00000000-0000-0000-0000-0000000000c3');
select is((select count(*) from public.friendships), 0::bigint, 'Carla no ve amistades ajenas');

select pg_temp.login('00000000-0000-0000-0000-0000000000b2');
select is((select count(*) from public.notifications where type = 'friend_request'), 1::bigint,
          'Bob recibe la notificación de solicitud');
select lives_ok($$ select public.respond_friend_request('00000000-0000-0000-0000-0000000000a1', true) $$,
                'Bob acepta');

select pg_temp.login('00000000-0000-0000-0000-0000000000a1');
select is((select status from public.friendships), 'accepted'::public.friendship_status, 'ahora son amigos');
select is((select count(*) from public.notifications where type = 'friend_accepted'), 1::bigint,
          'Ana recibe la notificación de aceptación');
select is((select count(*) from public.notifications), 1::bigint, 'Ana solo ve sus notificaciones');

-- Carla envía y Ana rechaza: la solicitud desaparece y se puede volver a enviar.
select pg_temp.login('00000000-0000-0000-0000-0000000000c3');
select public.send_friend_request('00000000-0000-0000-0000-0000000000a1');
select pg_temp.login('00000000-0000-0000-0000-0000000000a1');
select lives_ok($$ select public.respond_friend_request('00000000-0000-0000-0000-0000000000c3', false) $$,
                'Ana rechaza a Carla');
select is((select count(*) from public.friendships where status = 'pending'), 0::bigint,
          'la solicitud rechazada se elimina');

-- =============================================================================
-- Propuestas
-- =============================================================================
-- Ana propone el Pedraforca (cima de catálogo) y invita a Bob.
insert into public.plans (id, creator_id, category_id, title, visibility)
values ('00000000-0000-0000-0000-0000000000f1', auth.uid(), 2, 'Subir al Pedraforca', 'invited');
insert into public.peaks (id, name, altitude_m, created_by)
values ('00000000-0000-0000-0000-0000000000e1', 'Pedraforca', 2506, auth.uid());
insert into public.plan_peaks (plan_id, peak_id)
values ('00000000-0000-0000-0000-0000000000f1', '00000000-0000-0000-0000-0000000000e1');

select lives_ok($$ insert into public.plan_invitations (plan_id, user_id, invited_by)
                   values ('00000000-0000-0000-0000-0000000000f1', '00000000-0000-0000-0000-0000000000b2', auth.uid()) $$,
                'Ana invita a su amigo Bob');
select throws_ok($$ insert into public.plan_invitations (plan_id, user_id, invited_by)
                    values ('00000000-0000-0000-0000-0000000000f1', '00000000-0000-0000-0000-0000000000c3', auth.uid()) $$,
                 '42501', null, 'no se puede invitar a quien no es amigo');
select throws_ok($$ update public.plans set status = 'done' where id = '00000000-0000-0000-0000-0000000000f1' $$,
                 '42501', null, 'el estado de la propuesta no se edita a mano');

select pg_temp.login('00000000-0000-0000-0000-0000000000c3');
select is((select count(*) from public.plans), 0::bigint, 'Carla no ve la propuesta');
select throws_ok($$ select public.set_plan_interest('00000000-0000-0000-0000-0000000000f1', 'interested') $$,
                 '42501', null, 'Carla no puede apuntarse a una propuesta solo para invitados');

select pg_temp.login('00000000-0000-0000-0000-0000000000b2');
select is((select title from public.plans), 'Subir al Pedraforca', 'Bob ve la propuesta');
select is((select count(*) from public.notifications where type = 'plan_invite'), 1::bigint,
          'Bob recibe la invitación');
select lives_ok($$ select public.set_plan_interest('00000000-0000-0000-0000-0000000000f1', 'interested') $$,
                'Bob indica que le interesa');
update public.plans set title = 'Hackeado' where id = '00000000-0000-0000-0000-0000000000f1';
select is((select title from public.plans), 'Subir al Pedraforca', 'un invitado no puede editar la propuesta');
select throws_ok($$ update public.plan_invitations set role = 'cohost' where user_id = auth.uid() $$,
                 '42501', null, 'un invitado no puede ascenderse a co-organizador');

-- =============================================================================
-- Conversión propuesta → evento
-- =============================================================================
select pg_temp.login('00000000-0000-0000-0000-0000000000a1');
select is((select count(*) from public.notifications where type = 'plan_interest'), 1::bigint,
          'Ana se entera del interés de Bob');
select throws_ok($$ select public.create_event('Con Carla', 1::smallint, now(),
                      p_participant_ids => array['00000000-0000-0000-0000-0000000000c3'::uuid]) $$,
                 'not_friends', 'no se puede invitar a desconocidos a un evento');

select set_config('test.event',
  public.create_event('Subir al Pedraforca', 2::smallint, now() - interval '1 day',
                      p_location_name => 'Gósol',
                      p_plan_id => '00000000-0000-0000-0000-0000000000f1',
                      p_participant_ids => array['00000000-0000-0000-0000-0000000000b2'::uuid])::text,
  true);

select is((select plan_id from public.events where id = current_setting('test.event')::uuid),
          '00000000-0000-0000-0000-0000000000f1'::uuid, 'el evento conserva la propuesta original');
select is((select status from public.plans where id = '00000000-0000-0000-0000-0000000000f1'),
          'scheduled'::public.plan_status, 'la propuesta pasa a programada');
select is((select interest from public.plan_invitations where user_id = '00000000-0000-0000-0000-0000000000b2'),
          'interested'::public.plan_interest, 'el historial de interesados se conserva');
select is((select source from public.event_participants
           where event_id = current_setting('test.event')::uuid and user_id = '00000000-0000-0000-0000-0000000000b2'),
          'plan'::public.participant_source, 'Bob figura como participante procedente de la propuesta');
select is((select role from public.event_participants
           where event_id = current_setting('test.event')::uuid and user_id = auth.uid()),
          'host'::public.member_role, 'Ana es la anfitriona');
select is((select count(*) from public.event_peaks where event_id = current_setting('test.event')::uuid),
          1::bigint, 'las cimas de la propuesta se copian al evento');

select pg_temp.login('00000000-0000-0000-0000-0000000000c3');
select is((select count(*) from public.events), 0::bigint, 'Carla no ve el evento');

select pg_temp.login('00000000-0000-0000-0000-0000000000b2');
select is((select count(*) from public.notifications where type = 'event_invite'), 1::bigint,
          'Bob recibe la invitación al evento');
select throws_ok(format($$ select public.complete_event(%L, array[auth.uid()]) $$, current_setting('test.event')),
                 'forbidden', 'un invitado no puede marcar el evento como realizado');
select throws_ok(format($$ update public.event_participants set attended = true where event_id = %L $$,
                        current_setting('test.event')),
                 '42501', null, 'nadie se marca como asistente a sí mismo');
update public.event_participants set rsvp = 'going'
where event_id = current_setting('test.event')::uuid and user_id = auth.uid();

select pg_temp.login('00000000-0000-0000-0000-0000000000a1');
select is((select count(*) from public.notifications where type = 'event_rsvp'), 1::bigint,
          'Ana se entera de que Bob confirma');
update public.events set location_name = 'Saldes' where id = current_setting('test.event')::uuid;

select pg_temp.login('00000000-0000-0000-0000-0000000000b2');
select is((select data -> 'changed' from public.notifications where type = 'event_updated'),
          '["location"]'::jsonb, 'Bob recibe el cambio de ubicación');

-- =============================================================================
-- Estadísticas: confirmar no suma, completar sí
-- =============================================================================
select pg_temp.login('00000000-0000-0000-0000-0000000000a1');
select is((public.get_user_stats() ->> 'total')::int, 0, 'confirmar asistencia no cuenta');

select set_config('test.future',
  public.create_event('Museo del Prado', 3::smallint, now() + interval '7 days')::text, true);
select throws_ok(format($$ select public.complete_event(%L, array[auth.uid()]) $$, current_setting('test.future')),
                 'event_not_started', 'no se completa un evento que no ha empezado');

select lives_ok(format($$ select public.complete_event(%L, array[auth.uid(), '00000000-0000-0000-0000-0000000000b2'::uuid]) $$,
                       current_setting('test.event')),
                'Ana marca el evento como realizado');
select is((select status from public.plans where id = '00000000-0000-0000-0000-0000000000f1'),
          'done'::public.plan_status, 'la propuesta queda como realizada');
select is((public.get_user_stats() ->> 'total')::int, 1, 'el evento realizado cuenta');
select is((public.get_user_stats() -> 'by_category' ->> 'summits')::int, 1, 'cuenta como cima');
select is((public.get_user_stats() ->> 'distinct_summits')::int, 1, 'Pedraforca cuenta como cima distinta');
select is((public.get_shared_stats('00000000-0000-0000-0000-0000000000b2') ->> 'total')::int, 1,
          'actividad compartida con Bob');
select is((select count(*) from public.completed_participations where user_id = auth.uid()), 1::bigint,
          'aparece en el historial');

select pg_temp.login('00000000-0000-0000-0000-0000000000c3');
select throws_ok($$ select public.get_user_stats('00000000-0000-0000-0000-0000000000a1') $$,
                 'forbidden', 'Carla no ve las estadísticas de Ana');

select pg_temp.login('00000000-0000-0000-0000-0000000000b2');
select throws_ok(format($$ update public.event_participants set rsvp = 'not_going'
                           where event_id = %L and user_id = auth.uid() $$, current_setting('test.event')),
                 'event_closed', 'no se cambia la respuesta de un evento cerrado');
select is((select count(*) from public.get_friend_feed() where kind = 'event_completed'), 1::bigint,
          'el feed de Bob muestra la actividad de Ana');

-- =============================================================================
-- Fotos
-- =============================================================================
select lives_ok(format($$ insert into public.event_photos
                            (event_id, uploader_id, storage_path, thumb_path, width, height, size_bytes)
                          values (%L, auth.uid(), 'x/1.webp', 'x/1_thumb.webp', 800, 600, 1000) $$,
                       current_setting('test.event')),
                'un asistente puede subir fotos');

select pg_temp.login('00000000-0000-0000-0000-0000000000a1');
select is((select (data ->> 'count')::int from public.notifications where type = 'photos_added'), 1,
          'Ana recibe el aviso de fotos nuevas');

select pg_temp.login('00000000-0000-0000-0000-0000000000c3');
select throws_ok(format($$ insert into public.event_photos
                             (event_id, uploader_id, storage_path, thumb_path, width, height, size_bytes)
                           values (%L, auth.uid(), 'x/2.webp', 'x/2_thumb.webp', 800, 600, 1000) $$,
                        current_setting('test.event')),
                 '42501', null, 'una desconocida no puede subir fotos');
select is((select count(*) from public.event_photos), 0::bigint, 'ni verlas');

select * from finish();
rollback;
