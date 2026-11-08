-- Propuestas y eventos tal como los usa la app (Fase 4): create_plan, invitar
-- después, interés, conversión, RSVP, edición, cancelar y portadas.
begin;
create extension if not exists pgtap with schema extensions;
select plan(24);

create function pg_temp.login(p_user uuid)
returns void
language sql
as $$
  select set_config('request.jwt.claims',
                    json_build_object('sub', p_user, 'role', 'authenticated')::text, true);
  select set_config('role', 'authenticated', true);
$$;

-- Gala organiza; Hugo e Iris son sus amigos; Jon es un desconocido.
insert into auth.users (id, email, raw_user_meta_data) values
  ('00000000-0000-0000-0000-000000000a01', 'gala@test.dev', '{"full_name": "Gala"}'),
  ('00000000-0000-0000-0000-000000000b02', 'hugo@test.dev', '{"full_name": "Hugo"}'),
  ('00000000-0000-0000-0000-000000000c03', 'iris@test.dev', '{"full_name": "Iris"}'),
  ('00000000-0000-0000-0000-000000000d04', 'jon@test.dev',  '{"full_name": "Jon"}');
update public.profiles set username = lower(display_name) where id in (select id from auth.users where email like '%@test.dev');
insert into public.friendships (user_a, user_b, requested_by, status) values
  ('00000000-0000-0000-0000-000000000a01', '00000000-0000-0000-0000-000000000b02',
   '00000000-0000-0000-0000-000000000a01', 'accepted'),
  ('00000000-0000-0000-0000-000000000a01', '00000000-0000-0000-0000-000000000c03',
   '00000000-0000-0000-0000-000000000a01', 'accepted');

-- =============================================================================
-- create_plan
-- =============================================================================
select pg_temp.login('00000000-0000-0000-0000-000000000a01');

select is(public.create_plan(
            '00000000-0000-0000-0000-0000000000f1', 'Aneto', 2::smallint,
            p_difficulty => 4::smallint,
            p_invitee_ids => array['00000000-0000-0000-0000-000000000b02'::uuid,
                                   '00000000-0000-0000-0000-000000000b02'::uuid,
                                   '00000000-0000-0000-0000-000000000a01'::uuid]),
          '00000000-0000-0000-0000-0000000000f1'::uuid, 'create_plan usa el id de la app');
select is((select count(*) from public.plan_invitations where plan_id = '00000000-0000-0000-0000-0000000000f1'),
          1::bigint, 'invitados sin duplicados y sin el creador');
select throws_ok($$ select public.create_plan(gen_random_uuid(), 'X', 1::smallint,
                      p_invitee_ids => array['00000000-0000-0000-0000-000000000d04'::uuid]) $$,
                 'not_friends', 'solo se invita a amigos');
select is((select count(*) from public.plans where title = 'X'), 0::bigint,
          'si falla la invitación no queda la propuesta a medias');
select throws_ok($$ select public.create_plan(gen_random_uuid(), 'Y', 1::smallint,
                      p_visibility => 'private',
                      p_invitee_ids => array['00000000-0000-0000-0000-000000000b02'::uuid]) $$,
                 'invalid_input', 'una propuesta privada no tiene invitados');
select throws_ok($$ select public.create_plan(gen_random_uuid(), '', 1::smallint) $$,
                 '23514', null, 'el título es obligatorio (CHECK)');

-- Invitar más tarde (insert directo con RLS)
select lives_ok($$ insert into public.plan_invitations (plan_id, user_id, invited_by)
                   values ('00000000-0000-0000-0000-0000000000f1', '00000000-0000-0000-0000-000000000c03', auth.uid())
                   on conflict do nothing $$, 'el creador invita a otro amigo después');
select throws_ok($$ insert into public.plan_invitations (plan_id, user_id, invited_by)
                    values ('00000000-0000-0000-0000-0000000000f1', '00000000-0000-0000-0000-000000000d04', auth.uid()) $$,
                 '42501', null, 'pero no a un desconocido');

-- Editar la propuesta
select lives_ok($$ update public.plans set title = 'Aneto por La Renclusa'
                   where id = '00000000-0000-0000-0000-0000000000f1' $$, 'el creador edita');

-- =============================================================================
-- Interés de los invitados
-- =============================================================================
select pg_temp.login('00000000-0000-0000-0000-000000000b02');
select is((select title from public.plans), 'Aneto por La Renclusa', 'Hugo ve la propuesta');
select lives_ok($$ select public.set_plan_interest('00000000-0000-0000-0000-0000000000f1', 'interested') $$,
                'Hugo se apunta');
update public.plans set title = 'hack' where id = '00000000-0000-0000-0000-0000000000f1';
select is((select title from public.plans), 'Aneto por La Renclusa', 'un invitado no puede editarla');

select pg_temp.login('00000000-0000-0000-0000-000000000d04');
select is((select count(*) from public.plans), 0::bigint, 'Jon no ve la propuesta');

-- =============================================================================
-- Convertir en evento, RSVP, editar y cancelar
-- =============================================================================
select pg_temp.login('00000000-0000-0000-0000-000000000a01');
select isnt(public.create_event(
              'Aneto por La Renclusa', 2::smallint, now() + interval '7 days',
              p_plan_id => '00000000-0000-0000-0000-0000000000f1',
              p_participant_ids => array['00000000-0000-0000-0000-000000000b02'::uuid]),
            null, 'la propuesta se convierte en evento');
select is((select status from public.plans where id = '00000000-0000-0000-0000-0000000000f1'),
          'scheduled'::public.plan_status, 'la propuesta pasa a programada');
select is((select source from public.event_participants
           where user_id = '00000000-0000-0000-0000-000000000b02'),
          'plan'::public.participant_source, 'Hugo viene de la propuesta');

select pg_temp.login('00000000-0000-0000-0000-000000000b02');
select lives_ok($$ update public.event_participants set rsvp = 'going'
                   where user_id = auth.uid() $$, 'Hugo confirma que va');
select is((select rsvp from public.event_participants where user_id = auth.uid()),
          'going'::public.rsvp_status, 'el RSVP queda guardado');
update public.events set title = 'hack';
select is((select title from public.events), 'Aneto por La Renclusa', 'un invitado no edita el evento');

select pg_temp.login('00000000-0000-0000-0000-000000000a01');
select lives_ok($$ update public.events set location_name = 'Benasque', starts_at = starts_at + interval '1 day' $$,
                'el organizador cambia lugar y fecha');
select lives_ok($$ select public.cancel_event((select id from public.events)) $$, 'y lo cancela');
select is((select status from public.plans where id = '00000000-0000-0000-0000-0000000000f1'),
          'open'::public.plan_status, 'cancelar devuelve la propuesta a abierta');

-- =============================================================================
-- Portadas: solo quien gestiona la propuesta escribe en su carpeta
-- =============================================================================
select lives_ok($$ insert into storage.objects (bucket_id, name, owner)
                   values ('covers', 'plans/00000000-0000-0000-0000-0000000000f1/c.webp', auth.uid()) $$,
                'el creador sube la portada');
select pg_temp.login('00000000-0000-0000-0000-000000000b02');
select throws_ok($$ insert into storage.objects (bucket_id, name, owner)
                    values ('covers', 'plans/00000000-0000-0000-0000-0000000000f1/d.webp', auth.uid()) $$,
                 '42501', null, 'un invitado no puede cambiarla');

select * from finish();
rollback;
