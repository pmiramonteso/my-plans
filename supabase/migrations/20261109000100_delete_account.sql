-- =============================================================================
-- my-plans · Eliminar la cuenta (anonimizar, sin perder lo compartido)
--
-- Borrar la fila de auth.users borraría en cascada el perfil y, con él, sus
-- propuestas, eventos y fotos, que también son el historial de sus amigos.
-- En su lugar:
--   · el perfil queda anónimo (sin username, foto ni bio; la app lo muestra
--     como "Usuario eliminado") y marcado con deleted_at;
--   · se borran sus datos personales de auth (email, identidades, sesiones) y
--     se bloquea el acceso: no se puede volver a entrar con esa cuenta;
--   · se conservan sus eventos realizados, propuestas y fotos compartidas;
--   · se cancelan sus eventos futuros, se archivan sus propuestas abiertas y
--     se borran las privadas;
--   · se borran sus amistades y sus notificaciones.
-- El avatar (Storage) lo borra la app antes de llamar a la RPC.
-- =============================================================================

alter table public.profiles add column deleted_at timestamptz;

-- Una cuenta eliminada no puede usar ninguna RPC aunque su JWT siga vigente
-- (dura hasta 1 h; las sesiones y los refresh tokens se borran al eliminarla).
create or replace function private.require_user()
returns uuid
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v uuid := auth.uid();
begin
  if v is null then
    raise exception 'not_authenticated' using errcode = '42501';
  end if;
  if exists (select 1 from public.profiles where id = v and deleted_at is not null) then
    raise exception 'not_authenticated' using errcode = '42501';
  end if;
  return v;
end;
$$;

-- Nadie puede pedir amistad a una cuenta eliminada (ni desde ella).
create function private.friendships_check_active()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if exists (select 1 from public.profiles
             where id in (new.user_a, new.user_b) and deleted_at is not null) then
    raise exception 'not_found' using errcode = 'P0002';
  end if;
  return new;
end;
$$;

create trigger friendships_check_active before insert on public.friendships
  for each row execute function private.friendships_check_active();

create function public.delete_my_account()
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_me    uuid := private.require_user();
  v_event uuid;
begin
  -- Eventos futuros que organizo: se cancelan (avisa a los participantes).
  for v_event in
    select id from public.events
    where creator_id = v_me and status = 'scheduled' and deleted_at is null and starts_at > now()
  loop
    perform public.cancel_event(v_event);
  end loop;

  -- Propuestas: las privadas se borran; las abiertas a otros se archivan.
  update public.plans set deleted_at = now()
  where creator_id = v_me and visibility = 'private' and deleted_at is null;
  update public.plans set status = 'archived'
  where creator_id = v_me and status = 'open' and deleted_at is null;

  delete from public.friendships where v_me in (user_a, user_b);
  delete from public.notifications where recipient_id = v_me;
  -- Invitaciones a planes que aún no han pasado: ya no voy a responder.
  delete from public.plan_invitations pi
  using public.plans p
  where pi.plan_id = p.id and pi.user_id = v_me and p.status = 'open';
  delete from public.event_participants ep
  using public.events e
  where ep.event_id = e.id and ep.user_id = v_me and ep.role = 'guest'
    and e.status = 'scheduled' and e.starts_at > now();

  update public.profiles
  set username = null, display_name = 'deleted', avatar_url = null, bio = null,
      deleted_at = now()
  where id = v_me;

  -- Datos personales de auth y acceso.
  delete from auth.identities where user_id = v_me;
  delete from auth.sessions where user_id = v_me;
  delete from auth.refresh_tokens where user_id = v_me::text;
  update auth.users
  set email = v_me || '@deleted.invalid',
      phone = null,
      raw_user_meta_data = '{}'::jsonb,
      banned_until = 'infinity'
  where id = v_me;
end;
$$;

grant execute on function public.delete_my_account() to authenticated;
