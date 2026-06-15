begin;

alter table public.barbershops
  add column if not exists appointment_capacity integer not null default 1;

alter table public.barbershops
  drop constraint if exists barbershops_appointment_capacity_check;

alter table public.barbershops
  add constraint barbershops_appointment_capacity_check
  check (appointment_capacity >= 1);

create or replace function public.book_appointment(
  p_barbershop_id uuid,
  p_service_id uuid,
  p_date date,
  p_time time without time zone
)
returns public.appointments
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_shop public.barbershops%rowtype;
  v_service public.services%rowtype;
  v_hours public.business_hours%rowtype;
  v_active_appointments integer;
  v_appointment public.appointments%rowtype;
begin
  if v_user_id is null then
    raise exception 'Authentication is required to book an appointment.'
      using errcode = '42501';
  end if;

  select *
    into v_shop
    from public.barbershops
   where id = p_barbershop_id;

  if not found then
    raise exception 'Barbershop not found.'
      using errcode = 'P0002';
  end if;

  select *
    into v_service
    from public.services
   where id = p_service_id
     and barbershop_id = p_barbershop_id;

  if not found then
    raise exception 'Invalid service for this barbershop.'
      using errcode = '22023';
  end if;

  if p_date + p_time <= timezone('America/Sao_Paulo', now()) then
    raise exception 'Choose a future date and time.'
      using errcode = '22023';
  end if;

  select *
    into v_hours
    from public.business_hours
   where barbershop_id = p_barbershop_id
     and weekday = extract(dow from p_date)::smallint;

  if not found
     or not v_hours.is_open
     or v_hours.open_time is null
     or v_hours.close_time is null
     or p_time < v_hours.open_time
     or p_time + make_interval(mins => v_shop.duration_minutes) > v_hours.close_time then
    raise exception 'The barbershop is closed at this time.'
      using errcode = '22023';
  end if;

  perform pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtextextended(
      p_barbershop_id::text || ':' || p_date::text || ':' || p_time::text,
      0
    )
  );

  select count(*)
    into v_active_appointments
    from public.appointments
   where barbershop_id = p_barbershop_id
     and date = p_date
     and time = p_time
     and status in ('pendente', 'aprovado');

  if v_active_appointments >= v_shop.appointment_capacity then
    raise exception 'This time has reached its appointment capacity.'
      using errcode = 'P0001';
  end if;

  insert into public.appointments (
    barbershop_id,
    customer_id,
    service_id,
    service_name,
    service_price,
    date,
    time,
    duration_minutes,
    status
  )
  values (
    p_barbershop_id,
    v_user_id,
    v_service.id,
    v_service.name,
    v_service.price,
    p_date,
    p_time,
    v_shop.duration_minutes,
    'pendente'
  )
  returning * into v_appointment;

  return v_appointment;
end;
$$;

revoke all on function public.book_appointment(uuid, uuid, date, time without time zone)
  from public, anon;
grant execute on function public.book_appointment(uuid, uuid, date, time without time zone)
  to authenticated;

drop policy if exists appointments_insert_customer on public.appointments;

revoke insert on table public.appointments from anon, authenticated;
revoke update on table public.appointments from anon, authenticated;
grant update (status) on table public.appointments to authenticated;

comment on column public.barbershops.appointment_capacity is
  'Maximum number of active appointments allowed for the same date and start time.';

comment on function public.book_appointment(uuid, uuid, date, time without time zone) is
  'Creates an appointment atomically after validating service, business hours and capacity.';

commit;
