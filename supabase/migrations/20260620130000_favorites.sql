begin;

create table if not exists public.favorites (
  user_id uuid not null references auth.users(id) on delete cascade,
  barbershop_id uuid not null references public.barbershops(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, barbershop_id)
);

create index if not exists favorites_barbershop_id_idx
  on public.favorites(barbershop_id);

alter table public.favorites enable row level security;

drop policy if exists favorites_select_own on public.favorites;
create policy favorites_select_own on public.favorites for select to authenticated
  using (user_id = auth.uid());

drop policy if exists favorites_insert_own on public.favorites;
create policy favorites_insert_own on public.favorites for insert to authenticated
  with check (user_id = auth.uid());

drop policy if exists favorites_delete_own on public.favorites;
create policy favorites_delete_own on public.favorites for delete to authenticated
  using (user_id = auth.uid());

commit;
