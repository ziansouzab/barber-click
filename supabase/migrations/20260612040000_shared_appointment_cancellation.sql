begin;

alter table public.appointments
  add column if not exists cancelled_by uuid references auth.users(id) on delete set null,
  add column if not exists cancelled_at timestamptz;

do $$
declare
  v_constraint record;
begin
  for v_constraint in
    select conname
      from pg_constraint
     where conrelid = 'public.appointments'::regclass
       and contype = 'c'
       and pg_get_constraintdef(oid) ilike '%status%'
  loop
    execute format(
      'alter table public.appointments drop constraint %I',
      v_constraint.conname
    );
  end loop;
end;
$$;

alter table public.appointments
  add constraint appointments_status_check
  check (status in ('pendente', 'aprovado', 'recusado', 'cancelado'));

create or replace function public.update_appointment_status(
  p_appointment_id uuid,
  p_status text
)
returns public.appointments
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_appointment public.appointments%rowtype;
  v_owner_id uuid;
begin
  if v_user_id is null then
    raise exception 'Authentication is required to update an appointment.';
  end if;

  if p_status is null or p_status not in ('aprovado', 'recusado') then
    raise exception 'Invalid appointment status transition.';
  end if;

  select appointment.*
    into v_appointment
    from public.appointments as appointment
   where appointment.id = p_appointment_id
   for update of appointment;

  if not found then
    raise exception 'Appointment not found.';
  end if;

  select owner_id
    into v_owner_id
    from public.barbershops
   where id = v_appointment.barbershop_id;

  if v_owner_id <> v_user_id then
    raise exception 'Only the barbershop owner can update this appointment.';
  end if;

  if v_appointment.status <> 'pendente' then
    raise exception 'Only pending appointments can be approved or rejected.';
  end if;

  update public.appointments
     set status = p_status::public.appointment_status
   where id = p_appointment_id
  returning * into v_appointment;

  return v_appointment;
end;
$$;

create or replace function public.cancel_appointment(
  p_appointment_id uuid
)
returns public.appointments
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_appointment public.appointments%rowtype;
  v_owner_id uuid;
  v_is_customer boolean;
  v_is_owner boolean;
  v_appointment_time timestamp without time zone;
  v_cancellation_limit timestamp without time zone;
begin
  if v_user_id is null then
    raise exception 'Authentication is required to cancel an appointment.';
  end if;

  select appointment.*
    into v_appointment
    from public.appointments as appointment
   where appointment.id = p_appointment_id
   for update of appointment;

  if not found then
    raise exception 'Appointment not found.';
  end if;

  select owner_id
    into v_owner_id
    from public.barbershops
   where id = v_appointment.barbershop_id;

  v_is_customer := v_appointment.customer_id = v_user_id;
  v_is_owner := v_owner_id = v_user_id;

  if not v_is_customer and not v_is_owner then
    raise exception 'You cannot cancel this appointment.';
  end if;

  if v_is_owner and v_appointment.status <> 'aprovado' then
    raise exception 'The barbershop can only cancel approved appointments.';
  end if;

  if v_is_customer and v_appointment.status not in ('pendente', 'aprovado') then
    raise exception 'The customer can only cancel pending or approved appointments.';
  end if;

  v_appointment_time := v_appointment.date + v_appointment.time;
  v_cancellation_limit :=
    timezone('America/Sao_Paulo', now()) + interval '2 hours';

  if v_appointment_time < v_cancellation_limit then
    raise exception 'Appointments must be cancelled at least two hours in advance.';
  end if;

  update public.appointments
     set status = 'cancelado',
         cancelled_by = v_user_id,
         cancelled_at = now()
   where id = p_appointment_id
  returning * into v_appointment;

  return v_appointment;
end;
$$;

revoke update (status) on table public.appointments from authenticated;

revoke all on function public.update_appointment_status(uuid, text)
  from public, anon;
grant execute on function public.update_appointment_status(uuid, text)
  to authenticated;

revoke all on function public.cancel_appointment(uuid)
  from public, anon;
grant execute on function public.cancel_appointment(uuid)
  to authenticated;

comment on column public.appointments.cancelled_by is
  'Authenticated user who cancelled the appointment.';

comment on column public.appointments.cancelled_at is
  'Timestamp when the appointment was cancelled.';

comment on function public.update_appointment_status(uuid, text) is
  'Allows the barbershop owner to approve or reject a pending appointment.';

comment on function public.cancel_appointment(uuid) is
  'Allows the customer or barbershop owner to cancel an eligible appointment at least two hours in advance.';

commit;
