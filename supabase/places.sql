-- Jalankan sekali dalam Supabase Dashboard > SQL Editor.
create extension if not exists pgcrypto;

create table if not exists public.places (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  category text not null,
  lot text,
  address text,
  lat double precision not null,
  lng double precision not null,
  service text,
  image text,
  description text,
  icon text,
  source text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.places enable row level security;

drop policy if exists "MeruVerse public read places" on public.places;
create policy "MeruVerse public read places"
  on public.places for select to anon, authenticated using (true);

-- App ini menggunakan akaun demo sendiri, bukan Supabase Auth.
-- Polisi ini membolehkan borang admin menyimpan data melalui publishable key.
drop policy if exists "MeruVerse public insert places" on public.places;
create policy "MeruVerse public insert places"
  on public.places for insert to anon, authenticated with check (true);

drop policy if exists "MeruVerse public delete places" on public.places;
create policy "MeruVerse public delete places"
  on public.places for delete to anon, authenticated using (true);
