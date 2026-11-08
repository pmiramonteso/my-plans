-- Agenda e historial tal como los usa la app (Fase 5): marcar como realizado,
-- historial personal y compartido (completed_participations) y filtro por año.
begin;
create extension if not exists pgtap with schema extensions;
select plan(15);

create function pg_temp.login(p_user uuid)
returns void
language sql
as $$
  select set_config('request.jwt.claims',
                    json_build_object('sub', p_user, 'role', 'authenticated')::text, true);
  select set_config('role', 'authenticated', true);
$$;

-- Lia organiza; Max y Noa son sus amigos (entre ellos no); Oto es un desconocido.
insert into auth.users (id, email, raw_user_meta_data) values
  ('00000000-0000-0000-0000-00000000a101', 'lia@test.dev', '{"full_name": "Lia"}'),
  ('00000000-0000-0000-0000-00000000b202', 'max@test.dev', '{"full_name": "Max"}'),
  ('00000000-0000-0000-0000-00000000c303', 'noa@test.dev', '{"full_name": "Noa"}'),
  ('00000000-0000-0000-0000-00000000d404', 'oto@test.dev', '{"full_name": "Oto"}');
update public.profiles set username = lower(display_name) where id in (select id from auth.users where email like '%@test.dev');
insert into public.friendships (user_a, user_b, requested_by, status) values
  ('00000000-0000-0000-0000-00000000a101', '00000000-0000-0000-0000-00000000b202',
   '00000000-0000-0000-0000-00000000a101', 'accepted'),
  ('00000000-0000-0000-0000-00000000a101', '00000000-0000-0000-0000-00000000c303',
   '00000000-0000-0000-0000-00000000a101', 'accepted');

-- =============================================================================
-- Marcar como realizado
-- =============================================================================
select pg_temp.login('00000000-0000-0000-0000-00000000a101');
select set_config('test.event', public.create_event(
  'Montserrat', 1::smallint, now() - interval '2 days',
  p_participant_ids => array['00000000-0000-0000-0000-00000000b202'::uuid,
                             '00000000-0000-0000-0000-00000000c303'::uuid])::text, true);
select set_config('test.year',
  extract(year from (now() - interval '2 days') at time zone 'Europe/Madrid')::int::text, true);

select pg_temp.login('00000000-0000-0000-0000-00000000b202');
select throws_ok(format($$ select public.complete_event(%L, array[auth.uid()]) $$, current_setting('test.event')),
                 'forbidden', 'un invitado no cierra el evento');

select pg_temp.login('00000000-0000-0000-0000-00000000a101');
select throws_ok(format($$ select public.complete_event(%L, '{}') $$, current_setting('test.event')),
                 'invalid_input', 'hace falta al menos un asistente');
-- Noa no vino, aunque estaba invitada; Oto no participa (se ignora).
select lives_ok(format($$ select public.complete_event(%L, array[
                            auth.uid(), '00000000-0000-0000-0000-00000000b202'::uuid,
                            '00000000-0000-0000-0000-00000000d404'::uuid]) $$, current_setting('test.event')),
                'Lia marca quién vino');
select throws_ok(format($$ select public.complete_event(%L, array[auth.uid()]) $$, current_setting('test.event')),
                 'event_closed', 'no se cierra dos veces');
select is((select count(*) from public.event_participants
           where event_id = current_setting('test.event')::uuid
             and user_id = '00000000-0000-0000-0000-00000000d404'), 0::bigint,
          'un asistente que no era participante no se añade');

-- =============================================================================
-- Historial
-- =============================================================================
select is((select count(*) from public.completed_participations
           where event_id = current_setting('test.event')::uuid), 2::bigint,
          'Lia ve a los dos asistentes en su historial');
select is((select count(*) from (
             select event_id from public.completed_participations
             where user_id in (auth.uid(), '00000000-0000-0000-0000-00000000b202')
             group by event_id having count(distinct user_id) = 2) shared), 1::bigint,
          'historial compartido con Max: los dos asistieron');
select is((public.get_user_stats(p_year => current_setting('test.year')::int) ->> 'total')::int, 1,
          'cuenta en las estadísticas de su año');
select is((public.get_user_stats(p_year => current_setting('test.year')::int - 1) ->> 'total')::int, 0,
          'y no en las de otro año');
select is((public.get_shared_stats('00000000-0000-0000-0000-00000000c303') ->> 'total')::int, 0,
          'con Noa no hay nada compartido: no vino');

select pg_temp.login('00000000-0000-0000-0000-00000000b202');
select is((select count(*) from public.notifications
           where type = 'event_completed' and entity_id = current_setting('test.event')::uuid), 1::bigint,
          'Max recibe el aviso de que se ha realizado');
select is((public.get_user_stats() ->> 'total')::int, 1, 'y le cuenta en sus estadísticas');

select pg_temp.login('00000000-0000-0000-0000-00000000c303');
select is((select count(*) from public.notifications where type = 'event_completed'), 0::bigint,
          'Noa no recibe el aviso porque no asistió');
select is((select count(*) from public.completed_participations where user_id = auth.uid()), 0::bigint,
          'ni aparece en su historial');

select pg_temp.login('00000000-0000-0000-0000-00000000d404');
select is((select count(*) from public.completed_participations), 0::bigint,
          'un desconocido no ve el historial de nadie');

select * from finish();
rollback;
