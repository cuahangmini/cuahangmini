-- Dán toàn bộ file này vào Supabase > SQL Editor > Run
create table if not exists public.store(
  user_id uuid primary key references auth.users(id) on delete cascade,
  data jsonb not null,
  updated_at timestamptz default now()
);
alter table public.store enable row level security;
drop policy if exists "owner only" on public.store;
create policy "owner only" on public.store for all to authenticated
  using (user_id = auth.uid() and (auth.jwt()->>'email') = 'thangiphone.hp@gmail.com')
  with check (user_id = auth.uid() and (auth.jwt()->>'email') = 'thangiphone.hp@gmail.com');
