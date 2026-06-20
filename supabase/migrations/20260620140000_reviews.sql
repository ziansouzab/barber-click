begin;

create table if not exists public.reviews (
  id uuid primary key default gen_random_uuid(),
  barbershop_id uuid not null references public.barbershops(id) on delete cascade,
  customer_id uuid not null references auth.users(id) on delete cascade,
  rating smallint not null check (rating between 1 and 5),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (barbershop_id, customer_id)
);

alter table public.reviews enable row level security;

drop policy if exists reviews_select_own on public.reviews;
create policy reviews_select_own on public.reviews for select to authenticated
  using (customer_id = auth.uid());

revoke insert, update, delete on table public.reviews from anon, authenticated;

create or replace function public.rate_barbershop(
  p_barbershop_id uuid,
  p_rating integer
)
returns numeric
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_avg numeric;
begin
  if v_user_id is null then
    raise exception 'Authentication is required to rate a barbershop.'
      using errcode = '42501';
  end if;

  if p_rating is null or p_rating < 1 or p_rating > 5 then
    raise exception 'Rating must be between 1 and 5.'
      using errcode = '22023';
  end if;

  if not exists (
    select 1
      from public.appointments
     where customer_id = v_user_id
       and barbershop_id = p_barbershop_id
       and status = 'aprovado'
       and (date + time) < timezone('America/Sao_Paulo', now())
  ) then
    raise exception 'You can only rate a barbershop after a completed appointment.'
      using errcode = 'P0001';
  end if;

  insert into public.reviews (barbershop_id, customer_id, rating)
  values (p_barbershop_id, v_user_id, p_rating)
  on conflict (barbershop_id, customer_id)
  do update set rating = excluded.rating, updated_at = now();

  select round(avg(rating), 2)
    into v_avg
    from public.reviews
   where barbershop_id = p_barbershop_id;

  update public.barbershops
     set rating = v_avg
   where id = p_barbershop_id;

  return v_avg;
end;
$$;

revoke all on function public.rate_barbershop(uuid, integer) from public, anon;
grant execute on function public.rate_barbershop(uuid, integer) to authenticated;

comment on function public.rate_barbershop(uuid, integer) is
  'Registra a nota (1-5) de um cliente para uma barbearia apos um atendimento aprovado e recalcula a media em barbershops.rating.';

commit;
