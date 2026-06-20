begin;

create or replace function public.delete_user()
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
begin
  if v_user_id is null then
    raise exception 'Authentication is required to delete an account.'
      using errcode = '42501';
  end if;

  delete from public.appointments
   where customer_id = v_user_id;

  delete from public.appointments
   where barbershop_id in (
     select id from public.barbershops where owner_id = v_user_id
   );

  delete from public.services
   where barbershop_id in (
     select id from public.barbershops where owner_id = v_user_id
   );

  delete from public.business_hours
   where barbershop_id in (
     select id from public.barbershops where owner_id = v_user_id
   );

  delete from public.barbershops
   where owner_id = v_user_id;

  delete from storage.objects
   where bucket_id = 'avatars'
     and (storage.foldername(name))[1] = v_user_id::text;

  delete from public.profiles
   where id = v_user_id;

  delete from auth.users
   where id = v_user_id;
end;
$$;

revoke all on function public.delete_user() from public, anon;
grant execute on function public.delete_user() to authenticated;

comment on function public.delete_user() is
  'Deletes the authenticated user and all of their owned data (appointments, barbershops, services, business hours, avatar, profile and auth account).';

commit;
