-- Eliminar la cuenta (Fase 7): se anonimiza el perfil y se borran los datos
-- personales, pero el historial compartido y las fotos se conservan.
begin;
create extension if not exists pgtap with schema extensions;
select plan(17);

create function pg_temp.login(p_user uuid)
returns void
language sql
as $$
  select set_config('request.jwt.claims',
                    json_build_object('sub', p_user, 'role', 'authenticated')::text, true);
  select set_config('role', 'authenticated', true);
$$;

-- Zoe se va; Abel es su amigo y sigue.
insert into auth.users (id, email, raw_user_meta_data) values
  ('00000000-0000-0000-0000-0000000de001', 'zoe@test.dev',  '{"full_name": "Zoe", "avatar_url": "https://lh3.googleusercontent.com/z"}'),
  ('00000000-0000-0000-0000-0000000de002', 'abel@test.dev', '{"full_name": "Abel"}');
insert into auth.identities (user_id, provider, provider_id, identity_data)
values ('00000000-0000-0000-0000-0000000de001', 'google', 'google-zoe', '{"sub": "google-zoe"}');
update public.profiles set username = lower(display_name), bio = 'Hola'
where id in (select id from auth.users where email like '%@test.dev');
insert into public.friendships (user_a, user_b, requested_by, status) values
  ('00000000-0000-0000-0000-0000000de001', '00000000-0000-0000-0000-0000000de002',
   '00000000-0000-0000-0000-0000000de001', 'accepted');

select pg_temp.login('00000000-0000-0000-0000-0000000de001');
-- Un evento realizado juntos (con foto), uno futuro y propuestas abierta y privada.
select set_config('test.done', public.create_event(
  'Canigó', 2::smallint, now() - interval '3 days',
  p_participant_ids => array['00000000-0000-0000-0000-0000000de002'::uuid])::text, true);
select public.complete_event(current_setting('test.done')::uuid,
                             array[auth.uid(), '00000000-0000-0000-0000-0000000de002'::uuid]);
insert into public.event_photos (event_id, uploader_id, storage_path, thumb_path, width, height, size_bytes)
values (current_setting('test.done')::uuid, auth.uid(),
        current_setting('test.done') || '/p.webp', current_setting('test.done') || '/p_thumb.webp', 10, 10, 10);
select set_config('test.future', public.create_event(
  'Montseny', 1::smallint, now() + interval '5 days',
  p_participant_ids => array['00000000-0000-0000-0000-0000000de002'::uuid])::text, true);
select public.create_plan('00000000-0000-0000-0000-0000000d1a01', 'Abierta', 1::smallint,
                          p_visibility => 'friends');
select public.create_plan('00000000-0000-0000-0000-0000000d1a02', 'Privada', 1::smallint,
                          p_visibility => 'private');

select lives_ok($$ select public.delete_my_account() $$, 'Zoe elimina su cuenta');

-- Perfil anónimo y sin datos personales
reset role;
select is((select row(username, avatar_url, bio)::text from public.profiles
           where id = '00000000-0000-0000-0000-0000000de001'), '(,,)',
          'el perfil queda sin username, foto ni bio');
select isnt((select deleted_at from public.profiles where id = '00000000-0000-0000-0000-0000000de001'),
            null, 'y marcado como eliminado');
select is((select email from auth.users where id = '00000000-0000-0000-0000-0000000de001'),
          '00000000-0000-0000-0000-0000000de001@deleted.invalid', 'el email se borra');
select is((select raw_user_meta_data from auth.users where id = '00000000-0000-0000-0000-0000000de001'),
          '{}'::jsonb, 'y los datos de Google');
select is((select count(*) from auth.identities where user_id = '00000000-0000-0000-0000-0000000de001'),
          0::bigint, 'ya no se puede entrar con Google');
select is((select banned_until from auth.users where id = '00000000-0000-0000-0000-0000000de001'),
          'infinity'::timestamptz, 'la cuenta queda bloqueada');

-- Lo pendiente se cierra
select is((select status from public.events where id = current_setting('test.future')::uuid),
          'cancelled'::public.event_status, 'su evento futuro se cancela');
select is((select status from public.plans where id = '00000000-0000-0000-0000-0000000d1a01'),
          'archived'::public.plan_status, 'su propuesta abierta se archiva');
select isnt((select deleted_at from public.plans where id = '00000000-0000-0000-0000-0000000d1a02'),
            null, 'su propuesta privada se borra');
select is((select count(*) from public.friendships where '00000000-0000-0000-0000-0000000de001' in (user_a, user_b)),
          0::bigint, 'sus amistades se borran');
select is((select count(*) from public.notifications where recipient_id = '00000000-0000-0000-0000-0000000de001'),
          0::bigint, 'y sus notificaciones');

-- Lo compartido se conserva
select pg_temp.login('00000000-0000-0000-0000-0000000de002');
select is((select count(*) from public.completed_participations where user_id = auth.uid()),
          1::bigint, 'Abel conserva el evento en su historial');
select is((select count(*) from public.event_photos where event_id = current_setting('test.done')::uuid),
          1::bigint, 'y la foto que subió Zoe');
select is((select count(*) from public.notifications where type = 'event_cancelled'), 1::bigint,
          'Abel recibe el aviso de que el evento futuro se cancela');
select throws_ok($$ select public.send_friend_request('00000000-0000-0000-0000-0000000de001') $$,
                 null, 'nadie puede pedir amistad a una cuenta eliminada');

-- Con el JWT aún vigente, la cuenta eliminada no puede usar las RPC
select pg_temp.login('00000000-0000-0000-0000-0000000de001');
select throws_ok($$ select public.create_plan(gen_random_uuid(), 'X', 1::smallint) $$,
                 'not_authenticated', 'una cuenta eliminada no puede crear nada');

select * from finish();
rollback;
