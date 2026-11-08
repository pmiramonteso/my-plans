-- =============================================================================
-- my-plans · Crear una propuesta con sus invitados en una sola transacción
--
-- SECURITY INVOKER: la RLS de plans y plan_invitations sigue siendo la guarda
-- (creator = yo, solo se invita a amigos). El id lo genera la app para poder
-- subir después la portada a covers/plans/{id}/….
-- =============================================================================

create function public.create_plan(
  p_id             uuid,
  p_title          text,
  p_category_id    smallint,
  p_description    text              default null,
  p_external_url   text              default null,
  p_difficulty     smallint          default null,
  p_location_name  text              default null,
  p_address        text              default null,
  p_visibility     public.visibility default 'invited',
  p_invitee_ids    uuid[]            default '{}'
)
returns uuid
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_me     uuid := private.require_user();
  v_guests uuid[];
begin
  select coalesce(array_agg(distinct g), '{}') into v_guests
  from unnest(coalesce(p_invitee_ids, '{}')) g
  where g <> v_me;

  -- Una propuesta privada es solo para mí.
  if p_visibility = 'private' and cardinality(v_guests) > 0 then
    raise exception 'invalid_input' using errcode = '22023';
  end if;
  if exists (select 1 from unnest(v_guests) g where not private.are_friends(v_me, g)) then
    raise exception 'not_friends' using errcode = '42501';
  end if;

  insert into public.plans (
    id, creator_id, category_id, title, description, external_url, difficulty,
    location_name, address, visibility
  ) values (
    coalesce(p_id, gen_random_uuid()), v_me, p_category_id, p_title, p_description, p_external_url,
    p_difficulty, p_location_name, p_address, coalesce(p_visibility, 'invited')
  )
  returning id into p_id;

  insert into public.plan_invitations (plan_id, user_id, invited_by)
  select p_id, g, v_me from unnest(v_guests) g;

  return p_id;
end;
$$;

revoke execute on function public.create_plan(uuid, text, smallint, text, text, smallint, text, text,
                                              public.visibility, uuid[]) from public, anon;
grant execute on function public.create_plan(uuid, text, smallint, text, text, smallint, text, text,
                                             public.visibility, uuid[]) to authenticated;
