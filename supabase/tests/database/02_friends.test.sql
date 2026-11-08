-- Amistad tal como la usa la app (Fase 3): estados en la búsqueda, solicitudes
-- cruzadas, cancelar y eliminar, perfiles sin onboarding y avatares.
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

-- Dana y Edu completan el onboarding; Fran todavía no tiene username.
insert into auth.users (id, email, raw_user_meta_data) values
  ('00000000-0000-0000-0000-0000000000d4', 'dana@test.dev', '{"full_name": "Dana Ros"}'),
  ('00000000-0000-0000-0000-0000000000e5', 'edu@test.dev',  '{"full_name": "Edu Mas"}'),
  ('00000000-0000-0000-0000-0000000000f6', 'fran@test.dev', '{"full_name": "Fran Dalmau"}');

select pg_temp.login('00000000-0000-0000-0000-0000000000d4');
update public.profiles set username = 'dana' where id = auth.uid();
select pg_temp.login('00000000-0000-0000-0000-0000000000e5');
update public.profiles set username = 'edu' where id = auth.uid();

-- =============================================================================
-- Búsqueda
-- =============================================================================
select pg_temp.login('00000000-0000-0000-0000-0000000000d4');
select is((select count(*) from public.search_profiles('da')), 0::bigint,
          'no me encuentro a mí misma');
select is((select count(*) from public.search_profiles('fran')), 0::bigint,
          'sin onboarding no aparece en la búsqueda');
select is((select count(*) from public.search_profiles('e')), 0::bigint,
          'hacen falta al menos 2 caracteres');
select is((select friendship from public.search_profiles('edu')), null,
          'sin relación, friendship es null');
select is((select count(*) from public.search_profiles('MAS')), 1::bigint,
          'busca también por nombre, sin distinguir mayúsculas');
select throws_ok($$ select public.send_friend_request('00000000-0000-0000-0000-0000000000f6') $$,
                 'not_found', 'no se puede pedir amistad a quien no ha hecho el onboarding');

-- =============================================================================
-- Solicitud enviada → estado en la búsqueda de ambos
-- =============================================================================
select public.send_friend_request('00000000-0000-0000-0000-0000000000e5');
select is((select requested_by_me from public.search_profiles('edu')), true,
          'Dana ve su solicitud como enviada');
select is(public.send_friend_request('00000000-0000-0000-0000-0000000000e5'),
          'pending'::public.friendship_status, 'repetir la solicitud no duplica nada');

select pg_temp.login('00000000-0000-0000-0000-0000000000e5');
select is((select requested_by_me from public.search_profiles('dana')), false,
          'Edu la ve como recibida');

-- Si Edu también pide amistad, se acepta directamente.
select is(public.send_friend_request('00000000-0000-0000-0000-0000000000d4'),
          'accepted'::public.friendship_status, 'solicitudes cruzadas: amistad aceptada');
select is((select friendship from public.search_profiles('dana')),
          'accepted'::public.friendship_status, 'la búsqueda muestra que son amigos');

-- =============================================================================
-- Eliminar amigo y cancelar solicitud
-- =============================================================================
select lives_ok($$ select public.remove_friend('00000000-0000-0000-0000-0000000000d4') $$,
                'Edu elimina a Dana');
select is((select count(*) from public.friendships), 0::bigint, 'la amistad desaparece para Edu');
select pg_temp.login('00000000-0000-0000-0000-0000000000d4');
select is((select count(*) from public.friendships), 0::bigint, 'y para Dana');

select public.send_friend_request('00000000-0000-0000-0000-0000000000e5');
select lives_ok($$ select public.remove_friend('00000000-0000-0000-0000-0000000000e5') $$,
                'Dana cancela su solicitud');
select throws_ok($$ select public.remove_friend('00000000-0000-0000-0000-0000000000e5') $$,
                 'not_found', 'cancelar dos veces avisa');

-- =============================================================================
-- Avatares: cada uno solo escribe en su carpeta
-- =============================================================================
select throws_ok($$ insert into storage.objects (bucket_id, name, owner)
                    values ('avatars', '00000000-0000-0000-0000-0000000000e5/x.webp', auth.uid()) $$,
                 '42501', null, 'no se puede subir un avatar en la carpeta de otro');

select * from finish();
rollback;
