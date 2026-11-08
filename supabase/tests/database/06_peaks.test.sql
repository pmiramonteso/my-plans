-- Cimas tal como las usa la app (Fase 6): catálogo compartido, cimas de
-- propuestas y eventos, datos de la ascensión y estadísticas.
begin;
create extension if not exists pgtap with schema extensions;
select plan(10);

create function pg_temp.login(p_user uuid)
returns void
language sql
as $$
  select set_config('request.jwt.claims',
                    json_build_object('sub', p_user, 'role', 'authenticated')::text, true);
  select set_config('role', 'authenticated', true);
$$;

-- Uma organiza; Vic es su amigo e invitado.
insert into auth.users (id, email, raw_user_meta_data) values
  ('00000000-0000-0000-0000-00000a1b0001', 'uma@test.dev', '{"full_name": "Uma"}'),
  ('00000000-0000-0000-0000-00000a1b0002', 'vic@test.dev', '{"full_name": "Vic"}');
update public.profiles set username = lower(display_name)
where id in (select id from auth.users where email like '%@test.dev');
insert into public.friendships (user_a, user_b, requested_by, status) values
  ('00000000-0000-0000-0000-00000a1b0001', '00000000-0000-0000-0000-00000a1b0002',
   '00000000-0000-0000-0000-00000a1b0001', 'accepted');

select pg_temp.login('00000000-0000-0000-0000-00000a1b0001');
insert into public.peaks (id, name, altitude_m, created_by) values
  ('00000000-0000-0000-0000-0000000e0001', 'Tuc de Test', 2800, auth.uid());
select throws_ok($$ insert into public.peaks (name, altitude_m, created_by)
                    values ('TUC DE TEST', 2800, auth.uid()) $$,
                 '23505', null, 'no se repite una cima con el mismo nombre y altitud');
select throws_ok($$ insert into public.peaks (name, altitude_m, created_by)
                    values ('Otra', 2000, '00000000-0000-0000-0000-00000a1b0002') $$,
                 '42501', null, 'nadie crea cimas en nombre de otro');

select set_config('test.event', public.create_event(
  'Travesía', 2::smallint, now() - interval '1 day',
  p_participant_ids => array['00000000-0000-0000-0000-00000a1b0002'::uuid])::text, true);
select lives_ok(format($$ insert into public.event_peaks (event_id, peak_id, elevation_gain_m, distance_km)
                          values (%L, '00000000-0000-0000-0000-0000000e0001', 1200, 14.5) $$,
                       current_setting('test.event')),
                'el organizador añade la cima con su desnivel');
select throws_ok(format($$ update public.event_peaks set elevation_gain_m = 20000 where event_id = %L $$,
                        current_setting('test.event')),
                 '23514', null, 'el desnivel tiene un máximo (CHECK)');

select pg_temp.login('00000000-0000-0000-0000-00000a1b0002');
select is((select count(*) from public.event_peaks where event_id = current_setting('test.event')::uuid),
          1::bigint, 'el invitado ve la cima del evento');
insert into public.peaks (id, name, altitude_m, created_by) values
  ('00000000-0000-0000-0000-0000000e0002', 'Pic de Vic', 2500, auth.uid());
select throws_ok(format($$ insert into public.event_peaks (event_id, peak_id)
                           values (%L, '00000000-0000-0000-0000-0000000e0002') $$,
                        current_setting('test.event')),
                 '42501', null, 'el invitado no añade cimas');
update public.event_peaks set elevation_gain_m = 1 where event_id = current_setting('test.event')::uuid;
select is((select elevation_gain_m from public.event_peaks where event_id = current_setting('test.event')::uuid),
          1200, 'ni cambia el desnivel');
delete from public.event_peaks where event_id = current_setting('test.event')::uuid;
select is((select count(*) from public.event_peaks where event_id = current_setting('test.event')::uuid),
          1::bigint, 'ni quita cimas');

select pg_temp.login('00000000-0000-0000-0000-00000a1b0001');
select public.complete_event(current_setting('test.event')::uuid,
                             array[auth.uid(), '00000000-0000-0000-0000-00000a1b0002'::uuid]);
select is(public.get_user_stats() - 'first_at' - 'last_at' - 'by_category' - 'places' - 'total',
          '{"distinct_summits": 1, "summit_ascents": 1, "max_altitude_m": 2800,
            "elevation_gain_m": 1200, "distance_km": 14.5}'::jsonb,
          'las estadísticas de montaña salen de las cimas del evento');
select is((public.get_shared_stats('00000000-0000-0000-0000-00000a1b0002') ->> 'elevation_gain_m')::int, 1200,
          'y también las compartidas');

select * from finish();
rollback;
